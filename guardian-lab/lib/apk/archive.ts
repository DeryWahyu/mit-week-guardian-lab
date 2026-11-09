import CRC32 from "crc-32";
import yauzl from "yauzl";
import { APK_LIMITS, ApkExtractionError } from "./limits";

/** Inspect and fully stream entries without writing archive paths to disk. */
export function inspectApkArchive(bytes: Buffer) {
  return new Promise<{
    entryCount: number;
    uncompressedBytes: number;
    dexCount: number;
    nativeLibraryCount: number;
  }>((resolve, reject) => {
    yauzl.fromBuffer(
      bytes,
      { lazyEntries: true, strictFileNames: true, validateEntrySizes: true },
      (error, zip) => {
        if (error)
          return reject(
            new ApkExtractionError(
              "APK_INVALID_ARCHIVE",
              "Berkas bukan arsip APK yang dapat dibaca.",
            ),
          );
        const names = new Set<string>();
        let size = 0,
          entries = 0,
          dex = 0,
          native = 0,
          manifest = false,
          settled = false;
        function fail(message: string) {
          if (settled) return;
          settled = true;
          zip.close();
          reject(new ApkExtractionError("APK_ARCHIVE_REJECTED", message));
        }
        zip.on("error", () => fail("Struktur arsip APK rusak atau tidak didukung."));
        zip.on("entry", (entry: yauzl.Entry) => {
          const name = entry.fileName;
          entries++;
          size += entry.uncompressedSize;
          if (
            entries > APK_LIMITS.entries ||
            size > APK_LIMITS.uncompressedBytes ||
            entry.uncompressedSize > APK_LIMITS.entryBytes
          )
            return fail("Isi arsip APK melebihi batas pemeriksaan.");
          if (
            name.length > 512 ||
            [...name].some((char) => char.charCodeAt(0) < 32) ||
            names.has(name.toLowerCase()) ||
            /[\\:]/.test(name) ||
            name.includes("//") ||
            name
              .split("/")
              .some(
                (part) =>
                  part === ".." ||
                  part === "." ||
                  part !== part.trim() ||
                  part.endsWith(".") ||
                  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
              ) ||
            name.startsWith("/") ||
            ((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000
          )
            return fail("Arsip memiliki jalur atau entri yang tidak aman.");
          names.add(name.toLowerCase());
          if (entry.isEncrypted() || ![0, 8].includes(entry.compressionMethod))
            return fail("Arsip terenkripsi atau kompresinya tidak didukung.");
          if (
            entry.uncompressedSize > 1024 * 1024 &&
            entry.uncompressedSize / Math.max(entry.compressedSize, 1) > 200
          )
            return fail("Rasio kompresi APK melebihi batas pemeriksaan.");
          if (name === "AndroidManifest.xml") {
            manifest = true;
            if (entry.uncompressedSize > APK_LIMITS.manifestBytes)
              return fail("Manifest APK terlalu besar.");
          }
          if (/^classes(?:\d+)?\.dex$/.test(name)) dex++;
          if (/^lib\/[^/]+\/[^/]+\.so$/.test(name)) native++;
          if (name.endsWith("/")) return zip.readEntry();
          zip.openReadStream(entry, (streamError, stream) => {
            if (streamError) return fail("Isi arsip APK tidak dapat dibaca.");
            let actual = 0,
              checksum = 0;
            stream.on("data", (chunk) => {
              actual += chunk.length;
              checksum = CRC32.buf(chunk, checksum) >>> 0;
              if (actual > entry.uncompressedSize || actual > APK_LIMITS.entryBytes) {
                stream.destroy();
                fail("Ukuran isi APK tidak sesuai metadata arsip.");
              }
            });
            stream.on("error", () =>
              fail("Isi arsip APK rusak atau ukuran dekompresinya tidak sesuai."),
            );
            stream.on("end", () => {
              if (checksum !== entry.crc32)
                return fail("Checksum isi APK tidak cocok. Berkas mungkin rusak.");
              if (!settled) zip.readEntry();
            });
          });
        });
        zip.on("end", () => {
          if (settled) return;
          settled = true;
          if (!manifest)
            return reject(
              new ApkExtractionError(
                "APK_MANIFEST_MISSING",
                "AndroidManifest.xml tidak ditemukan. Pilih berkas APK tunggal, bukan ZIP/APKS/XAPK.",
              ),
            );
          resolve({
            entryCount: entries,
            uncompressedBytes: size,
            dexCount: dex,
            nativeLibraryCount: native,
          });
        });
        zip.readEntry();
      },
    );
  });
}
