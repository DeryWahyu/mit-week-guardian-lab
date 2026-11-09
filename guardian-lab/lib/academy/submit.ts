import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { quizResultSchema, type quizSubmissionSchema } from "@/lib/validations/academy";
import { calculateRank } from "./gamification";
import { readQuestion } from "./quiz";
import { learningStreak } from "./streak";

type Submission = z.infer<typeof quizSubmissionSchema>;
function fingerprint(input: Submission) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.quizId,
        input.revision,
        Object.entries(input.answers)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([id, options]) => [id, [...options].sort()]),
      ]),
    )
    .digest("hex");
}
export async function submitQuiz(userId: string, input: Submission) {
  const hash = fingerprint(input);
  return prisma.$transaction(
    async (tx) => {
      // Lock this account before inspecting rewards or accepting an idempotent retry.
      const user = await tx.user.update({ where: { id: userId }, data: { exp: { increment: 0 } } });
      if (user.suspendedAt) throw new InputError("Akun sedang ditangguhkan.", 403);
      const existing = await tx.quizAttempt.findUnique({
        where: { userId_submissionId: { userId, submissionId: input.submissionId } },
      });
      if (existing?.result) {
        const saved = existing.result as Record<string, unknown>;
        if (saved.fingerprint !== hash)
          throw new InputError("Permintaan ini sudah digunakan untuk jawaban lain.", 409);
        return quizResultSchema.parse(saved);
      }
      await tx.$queryRaw`SELECT id FROM Quiz WHERE id = ${input.quizId} FOR SHARE`;
      const quiz = await tx.quiz.findUnique({
        where: { id: input.quizId },
        include: { questions: { orderBy: { order: "asc" } } },
      });
      if (!quiz?.published)
        throw new InputError("Kuis tidak ditemukan atau belum diterbitkan.", 404);
      if (quiz.updatedAt.toISOString() !== input.revision)
        throw new InputError(
          "Soal telah diperbarui. Muat ulang kuis sebelum mengirim jawaban.",
          409,
        );
      if (!quiz.questions.length || Object.keys(input.answers).length !== quiz.questions.length)
        throw new InputError("Jawab seluruh soal kuis.");
      const feedback = quiz.questions.map((raw) => {
        const q = readQuestion(raw);
        const selected = input.answers[q.id];
        if (
          !selected?.length ||
          new Set(selected).size !== selected.length ||
          selected.some((id) => !q.options.some((o) => o.id === id))
        )
          throw new InputError("Pilihan jawaban tidak valid.");
        const correct =
          selected.length === q.correctAnswers.length &&
          q.correctAnswers.every((id) => selected.includes(id));
        return {
          questionId: q.id,
          questionText: q.questionText,
          correct,
          selected,
          correctAnswers: q.correctAnswers.map(
            (id) => q.options.find((o) => o.id === id)?.text ?? id,
          ),
          explanation: q.explanation,
        };
      });
      const correctCount = feedback.filter((f) => f.correct).length;
      const score = Math.round((correctCount / feedback.length) * 100);
      const passed = correctCount / feedback.length >= 0.7;
      const prior = await tx.quizAttempt.findFirst({
        where: { userId, quizId: quiz.id, passed: true },
        select: { id: true },
      });
      const expEarned = passed && !prior ? quiz.expReward : 0;
      const now = new Date();
      const streak = learningStreak(user.streakDays, user.lastLearningAt, now, true);
      const updated = await tx.user.update({
        where: { id: userId },
        data: { exp: { increment: expEarned }, streakDays: streak, lastLearningAt: now },
      });
      if (passed) {
        await tx.badge.createMany({
          skipDuplicates: true,
          data: {
            code: "ACADEMY_FIRST_PASS",
            title: "Langkah Pertama",
            description: "Lulus kuis pertama di Guardian Academy.",
            expReward: 0,
          },
        });
        const badge = await tx.badge.findUniqueOrThrow({ where: { code: "ACADEMY_FIRST_PASS" } });
        await tx.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          update: {},
          create: { userId, badgeId: badge.id },
        });
      }
      const result = {
        score,
        passed,
        expEarned,
        totalQuestions: feedback.length,
        correctCount,
        newExp: updated.exp,
        newStreak: streak,
        rank: calculateRank(updated.exp).rank,
        feedback,
      };
      await tx.quizAttempt.create({
        data: {
          userId,
          quizId: quiz.id,
          score,
          passed,
          expEarned,
          submissionId: input.submissionId,
          result: { ...result, fingerprint: hash } as Prisma.InputJsonValue,
        },
      });
      return result;
    },
    { isolationLevel: "ReadCommitted", timeout: 15000 },
  );
}
