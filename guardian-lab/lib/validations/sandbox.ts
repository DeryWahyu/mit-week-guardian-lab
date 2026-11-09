import { z } from "zod";
import { scanUrlSchema } from "./analysis-input";
export const quarantinedDownloadSchema = z.object({
  id: z.uuid(),
  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export const sandboxStartSchema = z
  .object({
    type: z.enum(["web", "android"]),
    target: scanUrlSchema.optional(),
    sessionId: z.uuid().optional(),
    stripParameters: z.boolean().default(false),
    sourceInvestigationId: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[\w-]+$/)
      .optional(),
  })
  .strict();
export const sandboxStopSchema = z
  .object({
    sessionId: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[\w-]+$/),
  })
  .strict();
export const sandboxSessionSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["STARTING", "ACTIVE", "EXPIRED", "DESTROYED", "FAILED", "UNKNOWN"]),
  expiresAt: z.number(),
  serverTime: z.number(),
  streamUrl: z.url().nullable(),
  isFallback: z.literal(false),
  viewport: z.literal("desktop"),
  targetUrl: z.string(),
  sourceInvestigationId: z.string().nullable(),
  downloads: z.array(quarantinedDownloadSchema).max(4).default([]),
  downloadAnalyses: z.array(z.object({ downloadId: z.string(), recordId: z.string() })).default([]),
});
export const sandboxStateSchema = z.object({
  available: z.boolean(),
  androidAvailable: z.literal(false),
  message: z.string(),
  session: sandboxSessionSchema.nullable(),
});
