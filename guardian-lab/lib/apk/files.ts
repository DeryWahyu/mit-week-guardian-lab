import type { Dirent } from "node:fs";
import { lstat, readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { APK_LIMITS, ApkExtractionError } from "./limits";

export function assertInside(root: string, path: string) {
  const child = relative(resolve(root), resolve(path));
  if (!child || child === ".." || child.startsWith(`..${sep}`) || child.includes(":"))
    throw new ApkExtractionError(
      "APK_OUTPUT_REJECTED",
      "Hasil ekstraksi memiliki jalur yang tidak aman.",
    );
}
export async function listOutput(root: string) {
  const pending = [root],
    files: { path: string; size: number; source: string }[] = [];
  let bytes = 0,
    entries = 0;
  while (pending.length) {
    const directory = pending.pop();
    if (!directory) break;
    let items: Dirent[];
    try {
      items = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    for (const item of items) {
      if (++entries > APK_LIMITS.entries)
        throw new ApkExtractionError(
          "APK_OUTPUT_LIMIT",
          "Jumlah berkas hasil ekstraksi melebihi batas.",
        );
      const path = join(directory, item.name);
      assertInside(root, path);
      const info = await lstat(path);
      if (info.isSymbolicLink())
        throw new ApkExtractionError(
          "APK_OUTPUT_REJECTED",
          "Hasil ekstraksi mengandung tautan berkas yang tidak diizinkan.",
        );
      if (info.isDirectory()) pending.push(path);
      else if (info.isFile()) {
        bytes += info.size;
        if (bytes > APK_LIMITS.outputBytes)
          throw new ApkExtractionError(
            "APK_OUTPUT_LIMIT",
            "Ukuran hasil ekstraksi melebihi batas.",
          );
        files.push({ path, size: info.size, source: relative(root, path).split(sep).join("/") });
      }
    }
  }
  return files;
}
export async function readBoundedText(path: string, limit: number) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > limit)
    throw new ApkExtractionError(
      "APK_OUTPUT_LIMIT",
      "Berkas hasil ekstraksi melebihi batas pembacaan.",
    );
  const bytes = await readFile(path);
  if (bytes.length > limit)
    throw new ApkExtractionError("APK_OUTPUT_LIMIT", "Hasil ekstraksi terlalu besar.");
  return bytes.toString("utf8");
}
