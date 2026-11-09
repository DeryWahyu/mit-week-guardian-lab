import { createHash } from "node:crypto";
import { calculateRank } from "@/lib/academy/gamification";
import { learningStreak } from "@/lib/academy/streak";
import { prisma } from "@/lib/prisma";
import { publishedCommunityWhere } from "./visibility";

export async function getRanking(page = 1, currentUserId?: string, pageSize = 10) {
  const where = { role: "USER" as const, exp: { gt: 0 }, suspendedAt: null };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: [{ exp: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, exp: true, streakDays: true, lastLearningAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: users.map((user, i) => ({
      position: (page - 1) * pageSize + i + 1,
      alias: `Guardian ${createHash("sha256").update(`guardian-ranking:${user.id}`).digest("hex").slice(0, 6).toUpperCase()}`,
      exp: user.exp,
      rank: calculateRank(user.exp).rank,
      streakDays: learningStreak(user.streakDays, user.lastLearningAt),
      isCurrentUser: user.id === currentUserId,
    })),
  };
}
export async function getPlatformOverview() {
  const [links, apks, cases, ranking] = await Promise.all([
    prisma.forensicRecord.count({ where: { type: { in: ["URL", "QR"] } } }),
    prisma.forensicRecord.count({ where: { type: "APK" } }),
    prisma.communityReplay.count({
      where: publishedCommunityWhere,
    }),
    getRanking(1, undefined, 3),
  ]);
  return { links, apks, cases, ranking: ranking.items };
}
