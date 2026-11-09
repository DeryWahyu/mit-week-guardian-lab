import { Prisma } from "@prisma/client";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import type { AdminReport } from "@/lib/validations/admin";
import { appendAudit } from "./audit";
import { METRIC_LABELS } from "./labels";
import { lockAdmin } from "./security";
export function reportRange(input: { from?: string; to?: string }) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const to = input.to ?? today;
  const from =
    input.from ??
    new Date(new Date(`${to}T00:00:00+07:00`).getTime() - 29 * 86400000 + 7 * 3600000)
      .toISOString()
      .slice(0, 10);
  const start = new Date(`${from}T00:00:00+07:00`),
    end = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86400000);
  const days = (end.getTime() - start.getTime()) / 86400000;
  if (!Number.isFinite(days) || days < 1 || days > 366)
    throw new InputError("Rentang laporan harus 1–366 hari.");
  return { from, to, start, end, days };
}
export async function getAdminReport(input: { from?: string; to?: string }): Promise<AdminReport> {
  const { from, to, start, end, days } = reportRange(input);
  const createdAt = { gte: start, lt: end };
  const typeGrouping = {
    by: ["type"],
    orderBy: { type: "asc" },
    where: { createdAt },
    _count: { _all: true },
  } satisfies Prisma.ForensicRecordGroupByArgs;
  const statusGrouping = {
    by: ["status"],
    orderBy: { status: "asc" },
    where: { createdAt },
    _count: { _all: true },
  } satisfies Prisma.ForensicRecordGroupByArgs;
  const [
    users,
    newUsers,
    types,
    statuses,
    quizAttempts,
    quizPassed,
    communityPublished,
    activeSandbox,
    dailyRows,
  ] = await prisma.$transaction(
    [
      prisma.user.count(),
      prisma.user.count({ where: { createdAt } }),
      prisma.forensicRecord.groupBy(typeGrouping),
      prisma.forensicRecord.groupBy(statusGrouping),
      prisma.quizAttempt.count({ where: { completedAt: createdAt } }),
      prisma.quizAttempt.count({ where: { completedAt: createdAt, passed: true } }),
      prisma.communityReplay.count({
        where: {
          status: "APPROVED",
          withdrawnAt: null,
          reviewedAt: createdAt,
          sourceRecordId: { not: null },
          consentedAt: { not: null },
        },
      }),
      prisma.sandboxSession.count({ where: { status: "ACTIVE", expiresAt: { gt: new Date() } } }),
      prisma.$queryRaw<Array<{ day: string; kind: string; total: bigint }>>(Prisma.sql`
 SELECT DATE_FORMAT(CONVERT_TZ(createdAt,'+00:00','+07:00'),'%Y-%m-%d') AS day, 'investigations' AS kind, COUNT(*) AS total FROM ForensicRecord WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY day
 UNION ALL SELECT DATE_FORMAT(CONVERT_TZ(createdAt,'+00:00','+07:00'),'%Y-%m-%d') AS day, 'users' AS kind, COUNT(*) AS total FROM User WHERE createdAt >= ${start} AND createdAt < ${end} GROUP BY day
 UNION ALL SELECT DATE_FORMAT(CONVERT_TZ(completedAt,'+00:00','+07:00'),'%Y-%m-%d') AS day, 'quizAttempts' AS kind, COUNT(*) AS total FROM QuizAttempt WHERE completedAt >= ${start} AND completedAt < ${end} GROUP BY day`),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  const count = (status: string) =>
    statuses.find((item) => item.status === status)?._count._all ?? 0;
  const daily = Array.from({ length: days }, (_, i) => ({
    date: new Date(start.getTime() + i * 86400000 + 7 * 3600000).toISOString().slice(0, 10),
    investigations: 0,
    users: 0,
    quizAttempts: 0,
  }));
  for (const row of dailyRows) {
    const day = daily.find((item) => item.date === row.day);
    if (day && ["users", "investigations", "quizAttempts"].includes(row.kind))
      day[row.kind as "users" | "investigations" | "quizAttempts"] = Number(row.total);
  }
  return {
    from,
    to,
    totals: {
      users,
      newUsers,
      investigations: statuses.reduce((sum, item) => sum + item._count._all, 0),
      completed: count("COMPLETED"),
      failed: count("FAILED"),
      unavailable: count("UNAVAILABLE"),
      quizAttempts,
      quizPassed,
      communityPublished,
      activeSandbox,
    },
    types: types.map((item) => ({ label: item.type, value: item._count._all })),
    statuses: statuses.map((item) => ({ label: item.status, value: item._count._all })),
    daily,
  };
}
export async function exportAdminReport(actorId: string, input: { from?: string; to?: string }) {
  const report = await getAdminReport(input);
  await prisma.$transaction(
    async (tx) => {
      await lockAdmin(tx, actorId);
      await appendAudit(tx, {
        actorId,
        action: "REPORT_EXPORTED",
        entityType: "REPORT",
        entityId: `${report.from}_${report.to}`,
        details: {
          from: report.from,
          to: report.to,
          rows: report.daily.length,
          format: "CSV_AGGREGATE",
        },
      });
    },
    { isolationLevel: "ReadCommitted" },
  );
  const header = "Tanggal (WIB),Investigasi,Pengguna baru,Percobaan kuis";
  const rows = report.daily.map((row) =>
    [row.date, row.investigations, row.users, row.quizAttempts].join(","),
  );
  const metrics = Object.entries(report.totals).map(
    ([label, value]) => `${METRIC_LABELS[label as keyof typeof METRIC_LABELS]},${value}`,
  );
  return {
    filename: `guardian-lab-${report.from}_${report.to}.csv`,
    body: `\uFEFF${[header, ...rows, "", "Metrik,Total", ...metrics].join("\r\n")}`,
  };
}
