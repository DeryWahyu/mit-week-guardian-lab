import type { PrismaClient } from "@prisma/client";
import { calculateRank } from "@/lib/academy/gamification";
import { learningStreak } from "@/lib/academy/streak";
import { demoAccounts } from "./demo-accounts";
import { demoProfiles } from "./demo-content";
import { seedDemoLearning } from "./demo-learning";
import { seedDemoRecords } from "./demo-records";

export function assertLocalDemoSeed() {
  if (process.env.ALLOW_DEMO_SEED === "true") {
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeder akun demo hanya untuk pengembangan lokal.");
  }
  const target = new URL(process.env.DATABASE_URL ?? "");
  if (
    target.protocol !== "mysql:" ||
    !["localhost", "127.0.0.1", "::1", "[::1]", "db", "mysql", "mysql-db"].includes(target.hostname)
  ) {
    throw new Error("Seeder demo hanya diizinkan pada MySQL lokal atau layanan database Compose.");
  }
}

export async function seedDemoActivity(database: PrismaClient, now = new Date()) {
  assertLocalDemoSeed();
  const accounts = await database.user.findMany({
    where: { email: { in: demoAccounts.map((account) => account.email) } },
  });
  const admin = accounts.find((account) => account.role === "ADMIN" && !account.suspendedAt);
  if (!admin) throw new Error("Akun admin seeder harus aktif sebelum data demo dibuat.");
  for (const profile of demoProfiles) {
    const user = accounts.find((account) => account.email === profile.email);
    if (!user) throw new Error("Jalankan seeder akun sebelum mengisi aktivitas demo.");
    await seedDemoRecords(database, user.id, admin.id, profile, now);
  }
  for (const profile of demoProfiles) {
    const user = accounts.find((account) => account.email === profile.email);
    if (user) await seedDemoLearning(database, user.id, profile, now);
  }
  const summaries = [];
  for (const profile of demoProfiles) {
    const user = await database.user.findUniqueOrThrow({
      where: { email: profile.email },
      include: {
        _count: { select: { forensicRecords: true, userBadges: true, communityReplays: true } },
      },
    });
    const [quizzes, cases] = await Promise.all([
      database.quizAttempt.groupBy({ by: ["quizId"], where: { userId: user.id, passed: true } }),
      database.replayAttempt.groupBy({
        by: ["replayId"],
        where: { userId: user.id, solved: true },
      }),
    ]);
    summaries.push({
      akun: user.email,
      EXP: user.exp,
      peringkat: calculateRank(user.exp).rank,
      streak: learningStreak(user.streakDays, user.lastLearningAt, now),
      kuisLulus: quizzes.length,
      kasusSelesai: cases.length,
      lencana: user._count.userBadges,
      pemeriksaan: user._count.forensicRecords,
      pengajuan: user._count.communityReplays,
    });
  }
  return summaries;
}
