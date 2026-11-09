import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { z } from "zod";
import { readDownload } from "./downloads.mjs";
import { create, destroy, readiness, reap, reconcile, sessions } from "./runtime.mjs";
import { describe, startStream } from "./stream.mjs";

const secret = process.env.SANDBOX_BROKER_KEY;
if (!secret || secret.length < 32)
  throw new Error("SANDBOX_BROKER_KEY requires at least 32 characters.");
const input = z.object({ sessionId: z.uuid(), targetUrl: z.url().max(16384) });
async function body(request) {
  let value = "";
  for await (const chunk of request) {
    value += chunk;
    if (value.length > 18000) throw new Error("Payload terlalu besar.");
  }
  return JSON.parse(value);
}
function authenticated(request) {
  const token = request.headers.authorization;
  const expected = `Bearer ${secret}`;
  return (
    token?.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  );
}
await reconcile();
let sweeping = false;
setInterval(async () => {
  if (sweeping) return;
  sweeping = true;
  try {
    await reap();
  } catch {
    console.error("Sandbox cleanup will be retried.");
  } finally {
    sweeping = false;
  }
}, 2000);
startStream();
createServer(async (request, response) => {
  const json = (status, value) =>
    response
      .writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      .end(JSON.stringify(value));
  if (!authenticated(request)) return json(401, { error: "Unauthorized" });
  try {
    if (request.method === "GET" && request.url === "/health") return json(200, await readiness());
    if (request.method === "POST" && request.url === "/sessions") {
      const data = input.parse(await body(request));
      const url = new URL(data.targetUrl);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        (url.port && !["80", "443"].includes(url.port))
      )
        return json(400, { error: "Tautan tidak diizinkan." });
      return json(201, describe(await create(data.sessionId, data.targetUrl)));
    }
    const fileMatch = request.url?.match(/^\/sessions\/([\w-]+)\/downloads\/([\w-]+)$/);
    if (fileMatch && request.method === "GET") {
      const session = sessions.get(fileMatch[1]);
      if (!session?.ready || session.stopping || session.expiresAt <= Date.now())
        return json(404, { error: "Sesi berakhir." });
      const bytes = await readDownload(session, z.uuid().parse(fileMatch[2]));
      return response
        .writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Length": bytes.length,
          "Cache-Control": "no-store",
        })
        .end(bytes);
    }
    const match = request.url?.match(/^\/sessions\/([\w-]+)$/);
    if (!match) return json(404, { error: "Not found" });
    if (request.method === "DELETE") {
      await destroy(match[1]);
      return json(200, { destroyed: true });
    }
    const s = sessions.get(match[1]);
    if (!s || s.expiresAt <= Date.now()) return json(404, { error: "Sesi berakhir." });
    return json(200, describe(s));
  } catch (error) {
    return json(error instanceof z.ZodError ? 400 : (error.status ?? 503), {
      error: "Container sandbox belum tersedia. Coba lagi.",
    });
  }
}).listen(4011, "0.0.0.0");
