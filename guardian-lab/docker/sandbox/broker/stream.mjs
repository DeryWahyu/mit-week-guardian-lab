import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import httpProxy from "http-proxy";
import { sessions } from "./runtime.mjs";

const secret = process.env.SANDBOX_BROKER_KEY;
const origin = new URL(process.env.SANDBOX_PUBLIC_URL);
export function ticket(session) {
  return createHmac("sha256", secret).update(`${session.id}:${session.expiresAt}`).digest("hex");
}
function equal(a, b) {
  return (
    typeof a === "string" &&
    a.length === b.length &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function describe(session) {
  const stream = new URL(`/s/${session.id}/`, origin);
  stream.searchParams.set("ticket", ticket(session));
  stream.searchParams.set("autoconnect", "1");
  stream.searchParams.set("resize", "scale");
  stream.searchParams.set("path", `s/${session.id}/websockify`);
  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    status: session.ready ? "ACTIVE" : "STARTING",
    streamUrl: session.ready ? stream.href : null,
    downloads: session.downloads ?? [],
  };
}
const proxy = httpProxy.createProxyServer({
  ws: true,
  secure: false,
  changeOrigin: true,
  proxyTimeout: 10000,
});
proxy.on("error", (_error, _request, response) => {
  if ("writeHead" in response && !response.headersSent)
    response.writeHead(502).end("Stream terputus.");
  else response.destroy();
});
proxy.on("proxyRes", (upstream) => {
  delete upstream.headers["set-cookie"];
  delete upstream.headers["cross-origin-embedder-policy"];
  delete upstream.headers["cross-origin-opener-policy"];
  upstream.headers["cache-control"] = "private, no-store";
  upstream.headers["referrer-policy"] = "no-referrer";
  upstream.headers["content-security-policy"] =
    `frame-ancestors ${process.env.SANDBOX_APP_ORIGIN};`;
});
function authorize(request) {
  const url = new URL(request.url, origin);
  let checkedPath = url.pathname;
  try {
    for (let i = 0; i < 3; i++) checkedPath = decodeURIComponent(checkedPath);
  } catch {
    return null;
  }
  if (
    !request.method ||
    !["GET", "HEAD"].includes(request.method) ||
    /(?:^|\/)(?:downloads|uploads|pdf|printer)(?:\/|$)/i.test(checkedPath) ||
    checkedPath.includes("\\") ||
    checkedPath.includes("\0")
  )
    return null;
  const match = url.pathname.match(/^\/s\/([\w-]+)\//);
  const s = match && sessions.get(match[1]);
  if (!s?.ready || s.stopping || s.expiresAt <= Date.now()) return null;
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`guardian_stream_${s.id}=`))
    ?.split("=")[1];
  const incoming = url.searchParams.get("ticket");
  if (!equal(incoming || cookie, ticket(s))) return null;
  if (
    request.headers.origin &&
    ![origin.origin, process.env.SANDBOX_APP_ORIGIN].includes(request.headers.origin)
  )
    return null;
  request.url = url.pathname.slice(`/s/${s.id}`.length) + url.search;
  request.headers.authorization = `Basic ${Buffer.from(`kasm_user:${s.password}`).toString("base64")}`;
  request.headers.origin = s.target;
  delete request.headers.cookie;
  return { s, incoming };
}
export function startStream() {
  const server = createServer((request, response) => {
    const access = authorize(request);
    if (!access)
      return response.writeHead(403, { "Cache-Control": "no-store" }).end("Sesi tidak tersedia.");
    if (access.incoming)
      response.setHeader(
        "Set-Cookie",
        `guardian_stream_${access.s.id}=${ticket(access.s)}; HttpOnly; SameSite=Strict; Path=/s/${access.s.id}/; Max-Age=${Math.max(0, Math.floor((access.s.expiresAt - Date.now()) / 1000))}${origin.protocol === "https:" ? "; Secure" : ""}`,
      );
    proxy.web(request, response, { target: access.s.target });
  });
  server.on("upgrade", (request, socket, head) => {
    const access = authorize(request);
    if (!access) return socket.destroy();
    proxy.ws(request, socket, head, { target: access.s.target });
  });
  server.listen(4010, "0.0.0.0");
}
