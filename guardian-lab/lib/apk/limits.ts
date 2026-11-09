export const APK_LIMITS = {
  entries: 20000,
  uncompressedBytes: 150 * 1024 * 1024,
  entryBytes: 50 * 1024 * 1024,
  manifestBytes: 2 * 1024 * 1024,
  outputBytes: 80 * 1024 * 1024,
  sourceBytes: 30 * 1024 * 1024,
  sourceFileBytes: 1024 * 1024,
  sourceFiles: 3500,
  timeoutMs: 120000,
} as const;

export class ApkExtractionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}
