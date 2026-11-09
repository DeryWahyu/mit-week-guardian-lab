import { z } from "zod";
import { matchesUrlModel, urlModelEvidenceSchema } from "./guardian-ml";
import { investigationIdSchema, riskLevelSchema, scanTypeSchema } from "./investigation";

export const communityStatusSchema = z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]);
export const communityReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    type: scanTypeSchema,
    target: z.string(),
    riskLevel: riskLevelSchema,
    riskScore: z.number().int().min(0).max(100),
    scamCategory: z.string(),
    summary: z.string(),
    deceptionTricks: z.array(z.string()),
    technicalEvidence: z.object({
      urlModel: urlModelEvidenceSchema.optional(),
      entropy: z.number().nonnegative().optional(),
      permissions: z.array(z.string()).optional(),
      c2Endpoints: z.array(z.string()).optional(),
    }),
    analysisSource: z
      .string()
      .min(1)
      .refine((value) => value !== "LEGACY_UNVERIFIED"),
    modelVersion: z.string().min(1),
    analyzedAt: z.iso.datetime(),
  })
  .refine(
    matchesUrlModel,
    "Snapshot model URL harus mempertahankan indikator dan metadata aslinya.",
  );
export type CommunityReport = z.infer<typeof communityReportSchema>;
export const communityCaseSchema = z.object({
  id: investigationIdSchema,
  title: z.string(),
  description: z.string(),
  scamType: z.string(),
  status: communityStatusSchema,
  report: communityReportSchema.nullable(),
  createdAt: z.iso.datetime(),
  reviewedAt: z.iso.datetime().nullable(),
  withdrawnAt: z.iso.datetime().nullable().optional(),
  withdrawalReason: z.string().nullable().optional(),
  sourceRecordId: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  canReview: z.boolean().optional(),
  canPractice: z.boolean().default(false),
});
export type CommunityCase = z.infer<typeof communityCaseSchema>;
export const communityListSchema = z.object({
  items: z.array(communityCaseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export const communityQuerySchema = z.object({
  view: z.enum(["published", "mine"]).default("published"),
  status: communityStatusSchema.optional(),
  type: scanTypeSchema.optional(),
  q: z.string().trim().max(150).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(30).default(12),
  withdrawn: z.enum(["yes", "no"]).optional(),
});
export const communitySubmitSchema = z
  .object({
    investigationId: investigationIdSchema,
    consent: z.literal(true),
  })
  .strict();
export const communityReviewSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("APPROVED"),
      privacyConfirmed: z.literal(true),
      adminNotes: z.string().trim().min(10).max(1000),
    })
    .strict(),
  z
    .object({ status: z.literal("REJECTED"), adminNotes: z.string().trim().min(10).max(1000) })
    .strict(),
]);
export const communityPreviewSchema = z.object({
  report: communityReportSchema.nullable(),
  existing: communityCaseSchema.nullable(),
  message: z.string().nullable(),
});
export const communityErrorSchema = z.object({ error: z.string().max(500) });
