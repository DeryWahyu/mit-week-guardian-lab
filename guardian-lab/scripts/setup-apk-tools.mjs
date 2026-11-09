import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import yauzl from "yauzl";

const config = JSON.parse(
  await readFile(new URL("../lib/apk/toolchain.json", import.meta.url), "utf8"),
);
const destination = resolve(".tools/jadx");
await mkdir(resolve(destination, "lib"), { recursive: true });
async function download() {
  const response = await fetch(config.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`JADX download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const bytes = process.argv[2] ? await readFile(resolve(process.argv[2])) : await download();
if (createHash("sha256").update(bytes).digest("hex") !== config.sha256)
  throw new Error("JADX checksum mismatch");
const files = [];
await new Promise((resolveZip, reject) => {
  yauzl.fromBuffer(
    bytes,
    { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
    (error, zip) => {
      if (error) return reject(error);
      zip.on("error", reject);
      zip.on("entry", (entry) => {
        if (!/^lib\/[a-zA-Z0-9._+-]+\.jar$/.test(entry.fileName)) return zip.readEntry();
        const path = resolve(destination, entry.fileName);
        zip.openReadStream(entry, async (streamError, stream) => {
          if (streamError) return reject(streamError);
          try {
            await mkdir(dirname(path), { recursive: true });
            await pipeline(stream, createWriteStream(path));
            const hash = createHash("sha256")
              .update(await readFile(path))
              .digest("hex");
            files.push({ path: entry.fileName, sha256: hash });
            zip.readEntry();
          } catch (failure) {
            zip.close();
            reject(failure);
          }
        });
      });
      zip.on("end", resolveZip);
      zip.readEntry();
    },
  );
});
if (!files.length) throw new Error("JADX release contains no libraries");
await writeFile(
  resolve(destination, "verified.json"),
  JSON.stringify({ version: config.version, archiveSha256: config.sha256, files }, null, 2),
);
console.log(`JADX ${config.version} installed with verified SHA-256 (${files.length} libraries).`);
