import { z } from "zod";

export const apkManifestSchema = z.object({
  packageName: z.string().nullable(),
  versionName: z.string().nullable(),
  versionCode: z.string().nullable(),
  minSdk: z.string().nullable(),
  targetSdk: z.string().nullable(),
  label: z.string().nullable(),
  debuggable: z.boolean().nullable(),
  allowBackup: z.boolean().nullable(),
  usesCleartextTraffic: z.boolean().nullable(),
  permissions: z.array(z.string()).max(1000),
});
export const apkStaticSchema = z.object({
  schemaVersion: z.literal(1),
  engine: z.literal("JADX"),
  engineVersion: z.string(),
  status: z.enum(["EXTRACTED", "PARTIAL"]),
  extractedAt: z.iso.datetime(),
  archive: z.object({
    entryCount: z.number().int(),
    uncompressedBytes: z.number().int(),
    dexCount: z.number().int(),
    nativeLibraryCount: z.number().int(),
  }),
  manifest: apkManifestSchema,
  indicators: z.object({
    urls: z.array(z.object({ value: z.string(), source: z.string() })).max(100),
    telegramBotCount: z.number().int().nonnegative(),
    botFingerprints: z.array(z.string()).max(100),
    redactedContactCount: z.number().int().nonnegative(),
  }),
  snippets: z.array(z.object({ source: z.string(), code: z.string() })).max(8),
  coverage: z.object({
    sourceFilesRead: z.number().int(),
    sourceBytesRead: z.number().int(),
    truncated: z.boolean(),
    decompilerExitCode: z.number().nullable(),
  }),
  warnings: z.array(z.string()).max(20),
});
export type ApkStaticReport = z.infer<typeof apkStaticSchema>;
