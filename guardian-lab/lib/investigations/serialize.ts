import type { ForensicRecord } from "@prisma/client";
import { investigationSchema } from "@/lib/validations/investigation";
import { defangTarget, sanitizeEvidence, sanitizeInvestigationText } from "./privacy";

/** Whitelisted DTO shared by detail and history, without relation/account data. */
export function serializeInvestigation(record: ForensicRecord) {
  const target = sanitizeInvestigationText(record.target);
  return investigationSchema.parse({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    startedAt: record.startedAt?.toISOString() ?? null,
    finishedAt: record.finishedAt?.toISOString() ?? null,
    target,
    defangedTarget: defangTarget(target),
    summary: record.summary === null ? null : sanitizeInvestigationText(record.summary),
    scamCategory:
      record.scamCategory === null ? null : sanitizeInvestigationText(record.scamCategory),
    errorMessage:
      record.errorMessage === null ? null : sanitizeInvestigationText(record.errorMessage),
    technicalEvidence:
      record.technicalEvidence === null ? null : sanitizeEvidence(record.technicalEvidence),
    inputMetadata: record.inputMetadata === null ? null : sanitizeEvidence(record.inputMetadata),
    deceptionTricks:
      record.deceptionTricks === null ? null : sanitizeEvidence(record.deceptionTricks),
  });
}
