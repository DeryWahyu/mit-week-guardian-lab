import { requirePageUser } from "@/lib/auth/page-access";
import { prisma } from "@/lib/prisma";
import { sanitizeShareText } from "@/lib/share-card/content";

export async function getAdminDashboard() {
  await requirePageUser("ADMIN");
  const [
    users,
    investigations,
    activeSessions,
    pendingReviews,
    quizzes,
    reviewQueue,
    recentInvestigations,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.forensicRecord.count(),
    prisma.sandboxSession.count({ where: { status: "ACTIVE", expiresAt: { gt: new Date() } } }),
    prisma.communityReplay.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.quiz.count(),
    prisma.communityReplay.findMany({
      where: { status: "PENDING_REVIEW" },
      select: { id: true, title: true, scamType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.forensicRecord.findMany({
      select: {
        id: true,
        defangedTarget: true,
        type: true,
        riskScore: true,
        status: true,
        analysisSource: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return {
    users,
    investigations,
    activeSessions,
    pendingReviews,
    quizzes,
    reviewQueue: reviewQueue.map((item) => ({
      ...item,
      title: sanitizeShareText(item.title),
      scamType: sanitizeShareText(item.scamType),
    })),
    recentInvestigations,
  };
}
export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;
