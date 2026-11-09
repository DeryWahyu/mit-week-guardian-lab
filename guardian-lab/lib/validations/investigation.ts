import { z } from "zod";
import { matchesUrlModel, urlModelEvidenceSchema } from "./guardian-ml";

export const investigationIdSchema = z
  .string()
  .min(1)
  .max(191)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const investigationStatusSchema = z.enum([
  "RECEIVED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "UNAVAILABLE",
]);
export const scanTypeSchema = z.enum(["URL", "QR", "APK"]);
export const riskLevelSchema = z.enum([
  "SAFE",
  "WARNING",
  "DANGEROUS",
  "PHISHING",
  "MALWARE",
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
]);
const technicalEvidenceSchema = z
  .object({
    urlModel: urlModelEvidenceSchema.optional(),
    entropy: z.number().nonnegative().optional(),
    typosquatTarget: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    c2Endpoints: z.array(z.string()).optional(),
    botTokens: z.array(z.string()).optional(),
    suspiciousDexStrings: z.array(z.string()).optional(),
  })
  .catchall(z.json());

export const investigationResultSchema = z
  .object({
    riskLevel: riskLevelSchema,
    riskScore: z.number().int().min(0).max(100),
    scamCategory: z.string().trim().min(1).max(191),
    summary: z.string().trim().min(1).max(20000),
    deceptionTricks: z.array(z.string().max(2000)).max(50),
    technicalEvidence: technicalEvidenceSchema,
    analysisSource: z
      .string()
      .trim()
      .min(1)
      .max(191)
      .refine((value) => value !== "LEGACY_UNVERIFIED"),
    modelVersion: z.string().trim().min(1).max(191),
  })
  .refine(matchesUrlModel, "Hasil model URL memerlukan bukti dan metadata yang konsisten.");
export const investigationSchema = z.object({
  id: investigationIdSchema,
  userId: z.string(),
  target: z.string(),
  type: scanTypeSchema,
  status: investigationStatusSchema,
  riskLevel: riskLevelSchema.nullable(),
  riskScore: z.number().int().min(0).max(100).nullable(),
  scamCategory: z.string().nullable(),
  summary: z.string().nullable(),
  deceptionTricks: z.array(z.string()),
  technicalEvidence: technicalEvidenceSchema,
  inputMetadata: z.record(z.string(), z.json()),
  analysisSource: z.string().nullable(),
  modelVersion: z.string().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  defangedTarget: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
});
export type Investigation = z.infer<typeof investigationSchema>;
export type InvestigationStatus = z.infer<typeof investigationStatusSchema>;
export type InvestigationResult = z.infer<typeof investigationResultSchema>;
