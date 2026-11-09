import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient, User } from "@prisma/client";
import { calculateRank } from "@/lib/academy/gamification";
import { buildChallenge } from "@/lib/community/challenge-questions";
import { readCommunityReport } from "@/lib/community/report";
import { quizResultSchema } from "@/lib/validations/academy";
import {
  DEMO_VERSION,
  type DemoProfile,
  type DemoStep,
  demoId,
  demoLearningSummary,
  demoTime,
} from "./demo-content";
import { demoCaseFeedback, demoQuizFeedback } from "./demo-feedback";

type LearningContext = { user: User; exp: number; dates: Date[] };
type Feedback = ReturnType<typeof demoQuizFeedback>;

async function awardBadge(
  tx: Prisma.TransactionClient,
  userId: string,
  at: Date,
  badgeType: "first_pass" | "case_solved" | "sentinel",
) {
  let code = "ACADEMY_FIRST_PASS";
  let title = "Langkah Pertama";
  let description = "Lulus kuis pertama di Guardian Academy.";

  if (badgeType === "case_solved") {
    code = "COMMUNITY_CASE_SOLVED";
    title = "Pembaca Bukti";
    description = "Menyelesaikan latihan kasus komunitas berdasarkan snapshot yang ditinjau.";
  } else if (badgeType === "sentinel") {
    code = "CYBER_SENTINEL_PRO";
    title = "Pengawal Siber";
    description = "Mencapai peringkat Cyber Sentinel dengan dedikasi analisis forensik tinggi.";
  }

  const badge = await tx.badge.upsert({
    where: { code },
    update: {},
    create: {
      code,
      title,
      description,
      expReward: 0,
    },
  });
  await tx.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id, awardedAt: at },
  });
}

function resultFor(
  context: LearningContext,
  feedback: Feedback,
  passed: boolean,
  expEarned: number,
  at: Date,
  id: string,
) {
  const correctCount = feedback.filter((item) => item.correct).length;
  context.dates.push(at);
  context.exp += expEarned;
  return {
    ...quizResultSchema.parse({
      score: Math.round((correctCount / feedback.length) * 100),
      passed,
      expEarned,
      totalQuestions: feedback.length,
      correctCount,
      newExp: context.exp,
      newStreak: demoLearningSummary(context.dates, context.user).streakDays,
      rank: calculateRank(context.exp).rank,
      feedback,
    }),
    fingerprint: createHash("sha256").update(id).digest("hex"),
    isDemo: true,
    seedVersion: DEMO_VERSION,
  };
}

async function seedQuizAttempt(
  tx: Prisma.TransactionClient,
  context: LearningContext,
  step: DemoStep,
  id: string,
  at: Date,
) {
  const existing = await tx.quizAttempt.findUnique({ where: { id } });
  if (existing) {
    if (existing.userId !== context.user.id)
      throw new Error("Pemilik aktivitas demo tidak sesuai.");
    return;
  }
  const quiz = await tx.quiz.findUnique({
    where: { id: step.key },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz?.published || !quiz.questions.length) return;
  const feedback = demoQuizFeedback(quiz.questions, step.pass);
  const passed = feedback.filter((item) => item.correct).length / feedback.length >= 0.7;
  const prior = await tx.quizAttempt.findFirst({
    where: { userId: context.user.id, quizId: quiz.id, passed: true },
    select: { id: true },
  });
  const expEarned = passed && !prior ? quiz.expReward : 0;
  const result = resultFor(context, feedback, passed, expEarned, at, id);
  await tx.quizAttempt.create({
    data: {
      id,
      userId: context.user.id,
      quizId: quiz.id,
      score: result.score,
      passed,
      expEarned,
      completedAt: at,
      submissionId: randomUUID(),
      result,
    },
  });
  if (passed) await awardBadge(tx, context.user.id, at, "first_pass");
}

async function seedCaseAttempt(
  tx: Prisma.TransactionClient,
  context: LearningContext,
  step: DemoStep,
  id: string,
  at: Date,
) {
  const existing = await tx.replayAttempt.findUnique({ where: { id } });
  if (existing) {
    if (existing.userId !== context.user.id)
      throw new Error("Pemilik aktivitas demo tidak sesuai.");
    return;
  }
  const replay = await tx.communityReplay.findUnique({
    where: { id: demoId(step.key, "case", "primary") },
  });
  const report = replay ? readCommunityReport(replay.sanitizedData) : null;
  if (
    !replay ||
    replay.status !== "APPROVED" ||
    replay.withdrawnAt ||
    !replay.sourceRecordId ||
    !replay.consentedAt ||
    !report
  )
    return;
  const challenge = buildChallenge(replay.id, replay.updatedAt, report);
  const feedback = demoCaseFeedback(challenge.questions, step.pass);
  const solved = feedback.every((item) => item.correct);
  const prior = await tx.replayAttempt.findFirst({
    where: { userId: context.user.id, replayId: replay.id, solved: true },
    select: { id: true },
  });
  const expEarned = solved && !prior ? 30 : 0;
  const result = resultFor(context, feedback, solved, expEarned, at, id);
  await tx.replayAttempt.create({
    data: {
      id,
      userId: context.user.id,
      replayId: replay.id,
      solved,
      expEarned,
      attemptedAt: at,
      submissionId: randomUUID(),
      result,
    },
  });
  if (solved) await awardBadge(tx, context.user.id, at, "case_solved");
}

export async function seedDemoLearning(
  database: PrismaClient,
  userId: string,
  profile: DemoProfile,
  now: Date,
) {
  await database.$transaction(
    async (tx) => {
      // Serialize demo rewards with ordinary quiz/case submissions for the same account.
      const user = await tx.user.update({ where: { id: userId }, data: { exp: { increment: 0 } } });
      if (user.suspendedAt || user.role !== "USER") return;
      const [quizzes, cases] = await Promise.all([
        tx.quizAttempt.findMany({ where: { userId }, select: { completedAt: true } }),
        tx.replayAttempt.findMany({ where: { userId }, select: { attemptedAt: true } }),
      ]);
      const existingDemoQuiz = await tx.quizAttempt.findFirst({
        where: { userId, id: { startsWith: demoId(profile.key) } },
      });
      const isInitialDemoRun = !existingDemoQuiz;
      const baseExpToAdd = isInitialDemoRun ? (profile.baseExp ?? 0) : 0;
      const context: LearningContext = {
        user,
        exp: user.exp + baseExpToAdd,
        dates: [
          ...quizzes.map((attempt) => attempt.completedAt),
          ...cases.map((attempt) => attempt.attemptedAt),
        ],
      };
      for (const [index, step] of profile.timeline.entries()) {
        const id = demoId(profile.key, "learning", String(index + 1));
        const at = demoTime(now, step.daysAgo, user.createdAt);
        if (step.kind === "quiz") await seedQuizAttempt(tx, context, step, id, at);
        else await seedCaseAttempt(tx, context, step, id, at);
      }
      if (context.exp >= 300) {
        await awardBadge(tx, context.user.id, now, "sentinel");
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          exp: { increment: context.exp - user.exp },
          ...demoLearningSummary(context.dates, user),
        },
      });
    },
    { timeout: 15000 },
  );
}
