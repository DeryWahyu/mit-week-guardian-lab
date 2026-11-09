import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { appendAudit } from "@/lib/admin/audit";
import { cleanAdminReason, lockAdmin } from "@/lib/admin/security";
import { InputError } from "@/lib/investigations/request-input";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import type { communityReviewSchema } from "@/lib/validations/community";
import {
  buildCommunityReport,
  readCommunityReport,
  serializeCommunityCase,
  submissionMessage,
} from "./report";

async function ownedSource(id: string, userId: string) {
  const source = await prisma.forensicRecord.findUnique({ where: { id } });
  if (!source) throw new InputError("Investigasi tidak ditemukan.", 404);
  if (source.userId !== userId)
    throw new InputError("Hanya pemilik investigasi dapat mengajukan kasus.", 403);
  return serializeInvestigation(source);
}
export async function submissionPreview(id: string, userId: string) {
  const record = await ownedSource(id, userId);
  const existing = await prisma.communityReplay.findUnique({ where: { sourceRecordId: id } });
  const stored = existing ? serializeCommunityCase(existing, true) : null;
  return {
    report: stored ? stored.report : buildCommunityReport(record),
    existing: stored,
    message: stored
      ? stored.report
        ? null
        : "Snapshot pengajuan lama belum tersedia."
      : submissionMessage(record),
  };
}
export async function submitCommunityCase(id: string, userId: string) {
  const preview = await submissionPreview(id, userId);
  if (preview.existing) return { record: preview.existing, created: false };
  if (!preview.report)
    throw new InputError("Pengajuan memerlukan hasil analisis lengkap yang valid.", 409);
  try {
    const report = preview.report;
    const record = await prisma.communityReplay.create({
      data: {
        userId,
        sourceRecordId: id,
        consentedAt: new Date(),
        title: `${report.type} · ${report.scamCategory}`.slice(0, 180),
        description: report.summary,
        scamType: report.scamCategory.slice(0, 180),
        sanitizedData: report,
      },
    });
    return { record: serializeCommunityCase(record, true), created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const record = await prisma.communityReplay.findUniqueOrThrow({
        where: { sourceRecordId: id },
      });
      return { record: serializeCommunityCase(record, true), created: false };
    }
    throw error;
  }
}
export async function reviewCommunityCase(
  id: string,
  reviewerId: string,
  input: z.infer<typeof communityReviewSchema>,
) {
  return prisma.$transaction(async (tx) => {
    await lockAdmin(tx, reviewerId);
    const reason = cleanAdminReason(input.adminNotes);
    const record = await tx.communityReplay.findUnique({ where: { id } });
    if (!record) throw new InputError("Pengajuan tidak ditemukan.", 404);
    if (record.status !== "PENDING_REVIEW")
      throw new InputError("Pengajuan telah ditinjau. Muat ulang status terbaru.", 409);
    if (record.userId === reviewerId)
      throw new InputError("Pengajuan sendiri harus ditinjau admin lain.", 403);
    if (
      input.status === "APPROVED" &&
      (!record.consentedAt || !record.sourceRecordId || !readCommunityReport(record.sanitizedData))
    )
      throw new InputError(
        "Snapshot atau persetujuan tidak lengkap. Kasus ini belum dapat diterbitkan.",
        409,
      );
    const updated = await tx.communityReplay.updateMany({
      where: { id, status: "PENDING_REVIEW", reviewedAt: null },
      data: {
        status: input.status,
        adminNotes: reason,
        reviewerId,
        reviewedAt: new Date(),
      },
    });
    if (updated.count !== 1)
      throw new InputError("Status berubah saat ditinjau. Muat ulang antrean.", 409);
    await appendAudit(tx, {
      actorId: reviewerId,
      action: input.status === "APPROVED" ? "CASE_APPROVED" : "CASE_REJECTED",
      entityType: "COMMUNITY_CASE",
      entityId: id,
      reason,
      details: { privacyConfirmed: input.status === "APPROVED" },
    });
    return serializeCommunityCase(
      await tx.communityReplay.findUniqueOrThrow({ where: { id } }),
      true,
      true,
    );
  });
}
