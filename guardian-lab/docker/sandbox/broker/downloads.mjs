import { createHash } from "node:crypto";
import { Writable } from "node:stream";
import { z } from "zod";
export const downloadSchema = z.object({
  id: z.uuid(),
  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 ** 2),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const indexSchema = z.object({ ready: z.literal(true), items: z.array(downloadSchema).max(4) });
async function readFile(container, fileName, limit) {
  const command = await container.exec({
    Cmd: ["python3", "/guardian-read-file.py", fileName],
    AttachStdout: true,
    AttachStderr: true,
  });
  const source = await command.start({ hijack: true, stdin: false });
  const chunks = [];
  let length = 0;
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      source.destroy();
      reject(error);
    };
    const timer = setTimeout(() => fail(new Error("Download read timed out")), 10000);
    const output = new Writable({
      write(chunk, _encoding, callback) {
        length += chunk.length;
        if (length > limit) fail(new Error("Download too large"));
        else chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    const errors = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    source.on("error", fail);
    output.on("error", fail);
    container.modem.demuxStream(source, output, errors);
    source.on("end", async () => {
      if (settled) return;
      try {
        const status = await command.inspect();
        if (status.ExitCode !== 0) {
          const error = new Error("Quarantined file unavailable");
          error.statusCode = 404;
          return fail(error);
        }
        settled = true;
        clearTimeout(timer);
        resolve(Buffer.concat(chunks, length));
      } catch (error) {
        fail(error);
      }
    });
  });
}
export async function refreshDownloads(session) {
  const bytes = await readFile(session.containers.at(-1), "index.json", 16384);
  session.downloads = indexSchema.parse(JSON.parse(bytes.toString("utf8"))).items;
}
let busy = false;
export async function readDownload(session, id) {
  if (busy) {
    const error = new Error("Transfer busy");
    error.status = 429;
    throw error;
  }
  busy = true;
  try {
    await refreshDownloads(session);
    const item = session.downloads.find((file) => file.id === id);
    if (!item) {
      const error = new Error("Missing download");
      error.status = 404;
      throw error;
    }
    const bytes = await readFile(session.containers.at(-1), `${item.id}.apk`, 50 * 1024 ** 2);
    if (
      bytes.length !== item.size ||
      createHash("sha256").update(bytes).digest("hex") !== item.sha256
    )
      throw new Error("Quarantined file changed");
    return bytes;
  } finally {
    busy = false;
  }
}
