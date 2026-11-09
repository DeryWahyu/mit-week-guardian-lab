import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { apkStaticSchema } from "@/lib/validations/apk-static";
import { inspectApkArchive } from "./archive";
import { listOutput, readBoundedText } from "./files";
import { createIndicatorScanner } from "./indicators";
import { runJadx } from "./jadx";
import { APK_LIMITS, ApkExtractionError } from "./limits";
import { parseApkManifest } from "./manifest";
import toolchain from "./toolchain.json";

export async function extractApk(bytes: Buffer, signal?: AbortSignal) {
  const archive = await inspectApkArchive(bytes);
  const tempRoot = resolve(tmpdir()),
    directory = await mkdtemp(join(tempRoot, `guardian-apk-${process.pid}-`));
  if (dirname(directory) !== tempRoot || !basename(directory).startsWith("guardian-apk-"))
    throw new Error("Unexpected APK workspace");
  try {
    const input = join(directory, "input.apk");
    await writeFile(input, bytes, { mode: 0o600 });
    const exitCode = await runJadx(input, directory, signal);
    const files = await listOutput(join(directory, "output"));
    const manifestFile = files.find((file) => file.source === "resources/AndroidManifest.xml");
    if (!manifestFile)
      throw new ApkExtractionError(
        "APK_DECOMPILE_FAILED",
        "JADX belum berhasil membaca manifest APK. Berkas mungkin rusak atau formatnya tidak didukung.",
      );
    const manifestText = await readBoundedText(manifestFile.path, APK_LIMITS.manifestBytes);
    const stringsFile = files.find((file) => file.source === "resources/res/values/strings.xml");
    const strings =
      stringsFile && stringsFile.size <= APK_LIMITS.manifestBytes
        ? await readBoundedText(stringsFile.path, APK_LIMITS.manifestBytes)
        : undefined;
    const manifest = parseApkManifest(manifestText, strings);
    const scanner = createIndicatorScanner();
    scanner.scan(manifestText, manifestFile.source);
    let count = 1,
      scannedBytes = Buffer.byteLength(manifestText),
      truncated = false,
      appCodeTruncated = false;
    const packagePath = manifest.packageName?.replace(/\./g, "/");
    const sources = files
      .filter(
        (file) => file.path !== manifestFile.path && /\.(java|xml|txt|json)$/.test(file.source),
      )
      .sort((a, b) => {
        const priority = (source: string) =>
          packagePath && source.startsWith(`sources/${packagePath}/`)
            ? 0
            : source === "resources/res/values/strings.xml"
              ? 1
              : 2;
        return priority(a.source) - priority(b.source) || a.source.localeCompare(b.source);
      });
    for (const file of sources) {
      if (signal?.aborted)
        throw new ApkExtractionError(
          "APK_CANCELLED",
          "Permintaan ekstraksi terputus sebelum selesai.",
        );
      if (
        count >= APK_LIMITS.sourceFiles ||
        scannedBytes + file.size > APK_LIMITS.sourceBytes ||
        file.size > APK_LIMITS.sourceFileBytes
      ) {
        truncated = true;
        if (packagePath && file.source.startsWith(`sources/${packagePath}/`)) {
          appCodeTruncated = true;
        }
        continue;
      }
      const content = await readBoundedText(file.path, APK_LIMITS.sourceFileBytes);
      scannedBytes += Buffer.byteLength(content);
      count++;
      scanner.scan(content, file.source);
    }
    const found = scanner.result();
    truncated ||= found.truncated;
    const warnings: string[] = [];
    if (exitCode !== 0 && exitCode !== 3)
      warnings.push(
        "Sebagian kode tidak berhasil didekompilasi. Temuan hanya mencakup bagian yang terbaca.",
      );
    if (!archive.dexCount)
      warnings.push(
        "Tidak ditemukan berkas classes.dex. Pemeriksaan hanya mencakup manifest dan resource yang terbaca.",
      );
    if (appCodeTruncated)
      warnings.push("Pembacaan sumber kode aplikasi dipersingkat karena batas pemeriksaan.");
    if (manifest.label?.startsWith("@"))
      warnings.push("Label aplikasi masih berupa referensi resource yang belum terselesaikan.");
    return apkStaticSchema.parse({
      schemaVersion: 1,
      engine: "JADX",
      engineVersion: toolchain.version,
      status: warnings.length ? "PARTIAL" : "EXTRACTED",
      extractedAt: new Date().toISOString(),
      archive,
      manifest,
      indicators: found.indicators,
      snippets: found.snippets,
      coverage: {
        sourceFilesRead: count,
        sourceBytesRead: scannedBytes,
        truncated,
        decompilerExitCode: exitCode,
      },
      warnings,
    });
  } finally {
    // Only directories created by this job, directly inside the OS temp directory.
    await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
