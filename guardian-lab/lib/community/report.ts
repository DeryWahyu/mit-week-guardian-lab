import type { CommunityReplay } from "@prisma/client";
import { getInvestigationMessage, getInvestigationResult } from "@/lib/investigations/presentation";
import { refangUrl } from "@/lib/security/defang";
import { sanitizeShareText } from "@/lib/share-card/content";
import { communityCaseSchema, communityReportSchema } from "@/lib/validations/community";
import type { UrlModelEvidence } from "@/lib/validations/guardian-ml";
import type { Investigation } from "@/lib/validations/investigation";

function publicModelEvidence(model?: UrlModelEvidence) {
  if (!model) return {};
  return {
    urlModel: {
      ...model,
      human: {
        ...model.human,
        title: sanitizeShareText(model.human.title),
        explanation: sanitizeShareText(model.human.explanation),
      },
    },
  };
}

export function buildCommunityReport(record: Investigation) {
  const result = getInvestigationResult(record);
  if (!result) return null;
  const evidence = result.technicalEvidence;
  const origins = (evidence.c2Endpoints ?? []).flatMap((endpoint) => {
    try {
      const url = new URL(refangUrl(endpoint));
      return ["http:", "https:"].includes(url.protocol) ? [sanitizeShareText(url.origin)] : [];
    } catch {
      return [];
    }
  });
  return communityReportSchema.parse({
    schemaVersion: 1,
    type: record.type,
    target: sanitizeShareText(record.target),
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    scamCategory: sanitizeShareText(result.scamCategory),
    summary: sanitizeShareText(result.humanFriendlySummary),
    deceptionTricks: [...new Set(result.deceptionTricks.map(sanitizeShareText).filter(Boolean))],
    technicalEvidence: {
      ...publicModelEvidence(evidence.urlModel),
      ...(typeof evidence.entropy === "number" ? { entropy: evidence.entropy } : {}),
      ...(evidence.permissions
        ? {
            permissions: evidence.permissions.filter((p) =>
              /^android\.permission\.[A-Z0-9_]+$/.test(p),
            ),
          }
        : {}),
      ...(origins.length ? { c2Endpoints: [...new Set(origins)] } : {}),
    },
    analysisSource: sanitizeShareText(record.analysisSource ?? ""),
    modelVersion: sanitizeShareText(record.modelVersion ?? ""),
    analyzedAt: record.finishedAt ?? record.updatedAt,
  });
}

export function submissionMessage(record: Investigation) {
  return buildCommunityReport(record) ? null : getInvestigationMessage(record);
}

export function readCommunityReport(value: unknown) {
  const parsed = communityReportSchema.safeParse(value);
  if (!parsed.success) return null;
  const report = parsed.data;
  return {
    ...report,
    target: sanitizeShareText(report.target),
    summary: sanitizeShareText(report.summary),
    scamCategory: sanitizeShareText(report.scamCategory),
    analysisSource: sanitizeShareText(report.analysisSource),
    modelVersion: sanitizeShareText(report.modelVersion),
    deceptionTricks: report.deceptionTricks.map(sanitizeShareText),
    technicalEvidence: {
      ...report.technicalEvidence,
      ...publicModelEvidence(report.technicalEvidence.urlModel),
      permissions: report.technicalEvidence.permissions?.filter((p) =>
        /^android\.permission\.[A-Z0-9_]+$/.test(p),
      ),
      c2Endpoints: report.technicalEvidence.c2Endpoints?.map(sanitizeShareText),
    },
  };
}

export function serializeCommunityCase(
  record: CommunityReplay,
  privateView = false,
  admin = false,
) {
  return communityCaseSchema.parse({
    id: record.id,
    title: sanitizeShareText(record.title),
    description: sanitizeShareText(record.description),
    scamType: sanitizeShareText(record.scamType),
    status: record.status,
    canPractice:
      record.status === "APPROVED" &&
      !record.withdrawnAt &&
      Boolean(
        record.sourceRecordId && record.consentedAt && readCommunityReport(record.sanitizedData),
      ),
    report: readCommunityReport(record.sanitizedData),
    createdAt: record.createdAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    withdrawnAt: record.withdrawnAt?.toISOString() ?? null,
    ...(privateView
      ? {
          sourceRecordId: record.sourceRecordId,
          adminNotes: record.adminNotes ? sanitizeShareText(record.adminNotes) : null,
          withdrawalReason: record.withdrawalReason
            ? sanitizeShareText(record.withdrawalReason)
            : null,
        }
      : {}),
    ...(admin ? { canReview: record.status === "PENDING_REVIEW" } : {}),
  });
}
