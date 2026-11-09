import { prisma } from "@/lib/prisma";
import { calculateRank } from "./gamification";
import { learningStreak } from "./streak";
export async function academyProgress(userId: string) {
  const [user, attempts, completions, badges, recent, cases, recentCases] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.groupBy({ by: ["quizId"], where: { userId, passed: true } }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.replayAttempt.groupBy({ by: ["replayId"], where: { userId, solved: true } }),
    prisma.replayAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: "desc" },
      take: 10,
      include: { replay: { select: { title: true } } },
    }),
  ]);
  return {
    exp: user.exp,
    streakDays: learningStreak(user.streakDays, user.lastLearningAt),
    rank: calculateRank(user.exp).rank,
    attempts,
    completed: completions.length,
    casesSolved: cases.length,
    badges: badges.map((b) => ({
      id: b.id,
      title: b.badge.title,
      description: b.badge.description,
      awardedAt: b.awardedAt.toISOString(),
    })),
    recentAttempts: [
      ...recent.map((a) => ({
        id: a.id,
        title: a.quiz.title,
        score: a.score,
        expEarned: a.expEarned,
        completedAt: a.completedAt.toISOString(),
      })),
      ...recentCases.map((a) => ({
        id: a.id,
        title: `Kasus: ${a.replay.title}`,
        score: a.solved
          ? 100
          : typeof a.result === "object" &&
              a.result !== null &&
              !Array.isArray(a.result) &&
              typeof a.result.score === "number"
            ? a.result.score
            : 0,
        expEarned: a.expEarned,
        completedAt: a.attemptedAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 10),
  };
}
