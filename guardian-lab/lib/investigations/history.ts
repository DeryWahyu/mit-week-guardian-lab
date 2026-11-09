import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { historyQuerySchema } from "@/lib/validations/history";
import { serializeInvestigation } from "./serialize";

export async function getInvestigationHistory(
  user: { id: string; role: string },
  query: z.infer<typeof historyQuerySchema>,
) {
  const verified: Prisma.ForensicRecordWhereInput = {
    status: "COMPLETED",
    analysisSource: { notIn: ["LEGACY_UNVERIFIED", ""] },
    modelVersion: { notIn: [""] },
    summary: { notIn: [""] },
    scamCategory: { notIn: [""] },
    riskScore: { gte: 0, lte: 100 },
  };
  const where: Prisma.ForensicRecordWhereInput = {
    ...(user.role !== "ADMIN" ? { userId: user.id } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.risk ? { riskLevel: query.risk } : {}),
    ...(query.risk ? { AND: [verified] } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { target: { contains: query.search } } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };
  const grouping = {
    by: ["status"],
    orderBy: { status: "asc" },
    where,
    _count: { _all: true },
  } satisfies Prisma.ForensicRecordGroupByArgs;
  const grouped = prisma.forensicRecord.groupBy(grouping);
  const [records, groups, highRisk] = await prisma.$transaction(
    [
      prisma.forensicRecord.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      grouped,
      prisma.forensicRecord.count({
        where: {
          AND: [
            where,
            verified,
            { riskLevel: { in: ["CRITICAL", "HIGH", "DANGEROUS", "PHISHING", "MALWARE"] } },
          ],
        },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  const count = (statuses: string[]) =>
    groups
      .filter((group) => statuses.includes(group.status))
      .reduce((sum, group) => sum + group._count._all, 0);
  const total = groups.reduce((sum, group) => sum + group._count._all, 0);
  return {
    records: records.map(serializeInvestigation),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
    summary: {
      total,
      highRisk,
      unavailable: count(["UNAVAILABLE"]),
      processing: count(["RECEIVED", "PROCESSING"]),
      failed: count(["FAILED"]),
    },
  };
}
