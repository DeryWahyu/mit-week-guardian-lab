import { Prisma } from "@prisma/client";
import type { UserSession } from "@/lib/auth/session";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { communityQuerySchema } from "@/lib/validations/community";
import { readCommunityReport, serializeCommunityCase } from "./report";
import { publishedCommunityWhere } from "./visibility";

export async function listCommunityCases(request: Request, user: UserSession, admin = false) {
  const query = communityQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) throw new InputError("Filter komunitas tidak valid.");
  const { view, status, type, q, page, pageSize } = query.data;
  const own = !admin && view === "mine";
  const where: Prisma.CommunityReplayWhereInput = {
    ...(admin && query.data.withdrawn
      ? { withdrawnAt: query.data.withdrawn === "yes" ? { not: null } : null }
      : {}),
    ...(admin
      ? { status: status ?? "PENDING_REVIEW" }
      : own
        ? { userId: user.id, ...(status ? { status } : {}) }
        : publishedCommunityWhere),
    ...(type ? { AND: [{ sanitizedData: { path: "$.type", equals: type } }] } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
  };
  const [items, total] = await prisma.$transaction(
    [
      prisma.communityReplay.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.communityReplay.count({ where }),
    ],
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
  return {
    items: items.map((item) => ({
      ...serializeCommunityCase(item, own || admin, admin),
      ...(admin ? { canReview: item.userId !== user.id && item.status === "PENDING_REVIEW" } : {}),
    })),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}
export async function getCommunityCase(id: string, user: UserSession) {
  const record = await prisma.communityReplay.findUnique({ where: { id } });
  if (!record) throw new InputError("Studi kasus tidak ditemukan.", 404);
  const privateView = record.userId === user.id || user.role === "ADMIN";
  const visible =
    record.status === "APPROVED" &&
    !record.withdrawnAt &&
    record.consentedAt &&
    record.sourceRecordId &&
    readCommunityReport(record.sanitizedData);
  if (!visible && !privateView) throw new InputError("Studi kasus tidak ditemukan.", 404);
  return {
    ...serializeCommunityCase(record, privateView, user.role === "ADMIN"),
    ...(user.role === "ADMIN"
      ? { canReview: record.userId !== user.id && record.status === "PENDING_REVIEW" }
      : {}),
  };
}
