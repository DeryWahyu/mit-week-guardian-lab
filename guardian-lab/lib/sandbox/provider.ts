import { z } from "zod";
import { InputError } from "@/lib/investigations/request-input";
import { quarantinedDownloadSchema } from "@/lib/validations/sandbox";

const providerSessionSchema = z.object({
  sessionId: z.string(),
  expiresAt: z.number(),
  status: z.enum(["STARTING", "ACTIVE"]),
  streamUrl: z.url().nullable(),
  downloads: z.array(quarantinedDownloadSchema).max(4).default([]),
});
async function brokerFetch(path: string, method = "GET", body?: unknown) {
  const key = process.env.SANDBOX_BROKER_KEY;
  const base = process.env.SANDBOX_BROKER_URL;
  if (!base || !key || key.length < 32)
    throw new InputError("Sandbox belum tersedia. Coba kembali setelah layanan diaktifkan.", 503);
  try {
    const response = await fetch(new URL(path, base), {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(method === "POST" ? 65000 : 10000),
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (response.status === 429)
      throw new InputError("Transfer sandbox sedang digunakan. Coba kembali sebentar lagi.", 429);
    if (!response.ok) throw new Error("Provider unavailable");
    return response;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError(
      "Layanan sandbox belum dapat dihubungi. Status pembersihan belum terkonfirmasi.",
      503,
    );
  }
}
export async function brokerRequest(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<unknown> {
  const response = await brokerFetch(path, method, body);
  return response ? response.json() : null;
}
export async function providerDownload(sessionId: string, downloadId: string) {
  const response = await brokerFetch(
    `/sessions/${encodeURIComponent(sessionId)}/downloads/${encodeURIComponent(downloadId)}`,
  );
  if (!response?.body)
    throw new InputError("Unduhan sudah tidak tersedia. Sesi mungkin telah berakhir.", 410);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 50 * 1024 * 1024) {
        await reader.cancel();
        throw new InputError("Unduhan melebihi batas 50 MB.", 413);
      }
      chunks.push(Buffer.from(chunk.value));
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new InputError("Unduhan kosong.", 422);
  return Buffer.concat(chunks, size);
}
export async function providerSession(id: string) {
  const raw = await brokerRequest(`/sessions/${encodeURIComponent(id)}`);
  return raw ? providerSessionSchema.parse(raw) : null;
}
export async function providerStart(sessionId: string, targetUrl: string) {
  return providerSessionSchema.parse(
    await brokerRequest("/sessions", "POST", { sessionId, targetUrl }),
  );
}
export async function providerStop(id: string) {
  await brokerRequest(`/sessions/${encodeURIComponent(id)}`, "DELETE");
}
export async function sandboxAvailable() {
  try {
    const health = z.object({ web: z.boolean() }).parse(await brokerRequest("/health"));
    return health.web;
  } catch {
    return false;
  }
}
