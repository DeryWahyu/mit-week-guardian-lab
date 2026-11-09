import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import { InputError } from "@/lib/investigations/request-input";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import type {
  adminInvestigationQuerySchema,
  investigationReviewSchema,
} from "@/lib/validations/admin";
import { appendAudit } from "./audit";
import { cleanAdminReason, lockAdmin } from "./security";

const reviewInclude = {
  reviewer: { select: { name: true } },
} satisfies Prisma.AdminInvestigationReviewInclude;
function serializeReview(
  review: Prisma.AdminInvestigationReviewGetPayload<{ include: typeof reviewInclude }> | null,
) {
  return review
    ? {
        status: review.status,
        note: review.note,
        updatedAt: review.updatedAt.toISOString(),
        reviewer: review.reviewer.name,
      }
    : null;
}
export async function listAdminInvestigations(
  query: z.infer<typeof adminInvestigationQuerySchema>,
) {
  const where: Prisma.ForensicRecordWhereInput = {
    ...(query.q ? { defangedTarget: { contains: query.q } } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.review ? { adminReview: { status: query.review } } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(`${query.from}T00:00:00+07:00`) } : {}),
            ...(query.to
              ? { lt: new Date(new Date(`${query.to}T00:00:00+07:00`).getTime() + 86400000) }
              : {}),
          },
        }
      : {}),
  };
  const [records, total] = await prisma.$transaction(
    [
      prisma.forensicRecord.findMany({
        where,
        include: { user: { select: { name: true } }, adminReview: { include: reviewInclude } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        skip: (query.page - 1) * 20,
      }),
      prisma.forensicRecord.count({ where }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    items: records.map((record) => ({
      id: record.id,
      target: serializeInvestigation(record).defangedTarget,
      type: record.type,
      status: record.status,
      riskScore: getInvestigationResult(serializeInvestigation(record))?.riskScore ?? null,
      owner: record.user.name,
      createdAt: record.createdAt.toISOString(),
      review: serializeReview(record.adminReview),
    })),
    pagination: {
      page: query.page,
      pageSize: 20,
      total,
      totalPages: Math.max(1, Math.ceil(total / 20)),
    },
  };
}
export async function adminInvestigationDetail(id: string) {
  const record = await prisma.forensicRecord.findUnique({
    where: { id },
    select: { id: true, user: { select: { name: true } }, adminReview: { include: reviewInclude } },
  });
  if (!record) throw new InputError("Investigasi tidak ditemukan.", 404);
  return { id: record.id, owner: record.user.name, review: serializeReview(record.adminReview) };
}
export async function saveInvestigationReview(
  actorId: string,
  id: string,
  input: z.infer<typeof investigationReviewSchema>,
) {
  const note = cleanAdminReason(input.note);
  return prisma.$transaction(
    async (tx) => {
      await lockAdmin(tx, actorId);
      await tx.$queryRaw`SELECT id FROM ForensicRecord WHERE id = ${id} FOR UPDATE`;
      const record = await tx.forensicRecord.findUnique({
        where: { id },
        select: { id: true, adminReview: true },
      });
      if (!record) throw new InputError("Investigasi tidak ditemukan.", 404);
      if ((record.adminReview?.updatedAt.toISOString() ?? null) !== input.revision)
        throw new InputError("Tinjauan telah berubah. Muat ulang sebelum menyimpan.", 409);
      await tx.adminInvestigationReview.upsert({
        where: { investigationId: id },
        create: { investigationId: id, reviewerId: actorId, status: input.status, note },
        update: { reviewerId: actorId, status: input.status, note, updatedAt: new Date() },
      });
      await appendAudit(tx, {
        actorId,
        action: "INVESTIGATION_REVIEW",
        entityType: "INVESTIGATION",
        entityId: id,
        reason: note,
        details: { previousStatus: record.adminReview?.status ?? null, nextStatus: input.status },
      });
      return { success: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
