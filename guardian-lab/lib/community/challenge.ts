import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { calculateRank } from "@/lib/academy/gamification";
import { learningStreak } from "@/lib/academy/streak";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { quizResultSchema } from "@/lib/validations/academy";
import type { communityChallengeSubmissionSchema } from "@/lib/validations/community-challenge";
import { buildChallenge } from "./challenge-questions";
import { readCommunityReport } from "./report";

async function approvedCase(id: string, tx: Prisma.TransactionClient = prisma) {
  const record = await tx.communityReplay.findUnique({ where: { id } });
  const report = record ? readCommunityReport(record.sanitizedData) : null;
  if (
    !record ||
    record.status !== "APPROVED" ||
    record.withdrawnAt ||
    !record.sourceRecordId ||
    !record.consentedAt ||
    !report
  )
    throw new InputError(
      "Latihan kasus belum tersedia. Kasus harus ditinjau dan memiliki snapshot lengkap.",
      404,
    );
  return { record, ...buildChallenge(id, record.updatedAt, report) };
}
export async function getCommunityChallenge(id: string, userId: string) {
  const data = await approvedCase(id);
  const passed = await prisma.replayAttempt.findFirst({
    where: { userId, replayId: id, solved: true },
    select: { id: true },
  });
  return {
    id,
    title: data.record.title,
    revision: data.revision,
    expReward: 30,
    isSolved: Boolean(passed),
    questions: data.questions.map(({ correctId: _key, explanation: _explanation, ...q }) => q),
  };
}
export async function submitCommunityChallenge(
  id: string,
  userId: string,
  input: z.infer<typeof communityChallengeSubmissionSchema>,
) {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        id,
        input.revision,
        Object.entries(input.answers).sort(([a], [b]) => a.localeCompare(b)),
      ]),
    )
    .digest("hex");
  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data: { exp: { increment: 0 } } });
      if (user.suspendedAt) throw new InputError("Akun sedang ditangguhkan.", 403);
      const previous = await tx.replayAttempt.findUnique({
        where: { userId_submissionId: { userId, submissionId: input.submissionId } },
      });
      if (previous?.result) {
        const saved = previous.result as Record<string, unknown>;
        if (saved.fingerprint !== fingerprint)
          throw new InputError("ID pengiriman sudah dipakai untuk jawaban lain.", 409);
        return quizResultSchema.parse(saved);
      }
      await tx.$queryRaw`SELECT id FROM CommunityReplay WHERE id = ${id} FOR SHARE`;
      const data = await approvedCase(id, tx);
      if (data.revision !== input.revision)
        throw new InputError("Snapshot berubah. Muat ulang latihan.", 409);
      if (Object.keys(input.answers).length !== data.questions.length)
        throw new InputError("Jawab seluruh pertanyaan kasus.");
      const feedback = data.questions.map((q) => {
        const selected = input.answers[q.id];
        if (!q.options.some((o) => o.id === selected))
          throw new InputError("Pilihan jawaban tidak valid.");
        return {
          questionId: q.id,
          questionText: q.questionText,
          correct: selected === q.correctId,
          selected: [selected],
          correctAnswers: q.options.filter((o) => o.id === q.correctId).map((o) => o.text),
          explanation: q.explanation,
        };
      });
      const correctCount = feedback.filter((f) => f.correct).length;
      const passed = correctCount === feedback.length;
      const priorPass = await tx.replayAttempt.findFirst({
        where: { userId, replayId: id, solved: true },
        select: { id: true },
      });
      const expEarned = passed && !priorPass ? 30 : 0;
      const now = new Date();
      const newStreak = learningStreak(user.streakDays, user.lastLearningAt, now, true);
      const updated = await tx.user.update({
        where: { id: userId },
        data: { exp: { increment: expEarned }, streakDays: newStreak, lastLearningAt: now },
      });
      if (passed) {
        await tx.badge.createMany({
          skipDuplicates: true,
          data: {
            code: "COMMUNITY_CASE_SOLVED",
            title: "Pembaca Bukti",
            description:
              "Menyelesaikan latihan kasus komunitas berdasarkan snapshot yang ditinjau.",
            expReward: 0,
          },
        });
        const badge = await tx.badge.findUniqueOrThrow({
          where: { code: "COMMUNITY_CASE_SOLVED" },
        });
        await tx.userBadge.createMany({
          skipDuplicates: true,
          data: { userId, badgeId: badge.id },
        });
      }
      const result = {
        score: Math.round((correctCount / feedback.length) * 100),
        passed,
        expEarned,
        correctCount,
        totalQuestions: feedback.length,
        newExp: updated.exp,
        newStreak,
        rank: calculateRank(updated.exp).rank,
        feedback,
      };
      await tx.replayAttempt.create({
        data: {
          userId,
          replayId: id,
          solved: passed,
          expEarned,
          submissionId: input.submissionId,
          result: { ...result, fingerprint } as Prisma.InputJsonValue,
        },
      });
      return result;
    },
    { isolationLevel: "ReadCommitted", timeout: 15000 },
  );
}
