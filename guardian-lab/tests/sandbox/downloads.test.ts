import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { POST as analyze } from "@/app/api/sandbox/session/[id]/downloads/[downloadId]/analyze/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sandboxState } from "@/lib/sandbox/session-manager";
import { investigationSchema } from "@/lib/validations/investigation";

const users: string[] = [];
let sessionId = "",
  sourceId = "",
  token = "",
  otherToken = "",
  downloads = 0;
const artifactId = randomUUID(),
  badArtifactId = randomUUID();
const bytes = readFileSync(new URL("../fixtures/apk/resources-only.apk", import.meta.url));
let provider: ReturnType<typeof Bun.serve>;
const previous = { url: process.env.SANDBOX_BROKER_URL, key: process.env.SANDBOX_BROKER_KEY };
const context = (downloadId = artifactId) => ({
  params: Promise.resolve({ id: sessionId, downloadId }),
});
function request(cookie = token) {
  return new Request("http://localhost/api/sandbox/test", {
    method: "POST",
    headers: { cookie: `${SESSION_COOKIE_NAME}=${cookie}` },
  });
}
beforeAll(async () => {
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({
      data: {
        email: `quarantine-${randomUUID()}@example.test`,
        name: "Quarantine fixture",
        passwordHash: "unused",
        phone: `+628130000000${i}`,
        phoneVerifiedAt: new Date(),
      },
    });
    users.push(user.id);
    const cookie = await createSessionToken(user);
    if (!i) token = cookie;
    else otherToken = cookie;
  }
  const source = await prisma.forensicRecord.create({
    data: {
      userId: users[0],
      type: "URL",
      target: "https://example.com/",
      defangedTarget: "hxxps://example[.]com/",
      status: "UNAVAILABLE",
    },
  });
  sourceId = source.id;
  const session = await prisma.sandboxSession.create({
    data: {
      id: randomUUID(),
      userId: users[0],
      type: "WEB",
      targetUrl: "https://example.com/",
      sourceInvestigationId: sourceId,
      expiresAt: new Date(Date.now() + 180000),
    },
  });
  sessionId = session.id;
  provider = Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      if (path === "/health") return Response.json({ web: true });
      if (path.endsWith(`/downloads/${artifactId}`)) {
        downloads++;
        return new Response(new Uint8Array(bytes));
      }
      if (path.endsWith(`/downloads/${badArtifactId}`)) return new Response("not an APK");
      if (path.includes("/downloads/")) return new Response(null, { status: 404 });
      return Response.json({
        sessionId,
        status: "ACTIVE",
        expiresAt: session.expiresAt.getTime(),
        streamUrl: "http://localhost:4010/",
        downloads: [
          {
            id: artifactId,
            size: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
          },
        ],
      });
    },
  });
  process.env.SANDBOX_BROKER_URL = provider.url.href;
  process.env.SANDBOX_BROKER_KEY = "quarantine-test-key-at-least-thirty-two-characters";
});
afterAll(async () => {
  process.env.SANDBOX_BROKER_URL = previous.url ?? "";
  process.env.SANDBOX_BROKER_KEY = previous.key ?? "";
  provider?.stop(true);
  await prisma.user.deleteMany({ where: { id: { in: users } } });
});
describe("Quarantined APK to canonical static investigation", () => {
  it("requires the session owner and rejects missing artifacts without creating records", async () => {
    expect((await analyze(request(""), context())).status).toBe(401);
    expect((await analyze(request(otherToken), context())).status).toBe(404);
    expect((await analyze(request(), context(randomUUID()))).status).toBe(410);
    expect(downloads).toBe(0);
    expect(await prisma.sandboxDownloadAnalysis.count({ where: { sessionId } })).toBe(0);
  });
  it("extracts actual APK facts, keeps provenance and never fabricates an AI result", async () => {
    const response = await analyze(request(), context());
    expect(response.status).toBe(201);
    const record = investigationSchema.parse(await response.json());
    expect(record.status).toBe("UNAVAILABLE");
    expect(record.riskScore).toBeNull();
    expect(record.inputMetadata.sourceInvestigationId).toBe(sourceId);
    expect(record.inputMetadata.sourceSandboxSessionId).toBe(sessionId);
    expect(record.inputMetadata.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    expect(record.inputMetadata.apkStatic).toBeTruthy();
    const again = await analyze(request(), context());
    expect(again.status).toBe(200);
    expect((await again.json()).id).toBe(record.id);
    expect(downloads).toBe(1);
    expect(
      await prisma.sandboxDownloadAnalysis.count({ where: { sessionId, downloadId: artifactId } }),
    ).toBe(1);
  }, 15000);
  it("records failed extraction as a real failed investigation", async () => {
    const response = await analyze(request(), context(badArtifactId));
    expect(response.status).toBe(422);
    const record = investigationSchema.parse(await response.json());
    expect(record.status).toBe("FAILED");
    expect(record.riskScore).toBeNull();
  });
  it("retains result links after expiry and never fetches a new expired download", async () => {
    await prisma.sandboxSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED", expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await analyze(request(), context())).status).toBe(200);
    expect((await analyze(request(), context(randomUUID()))).status).toBe(410);
    const state = await sandboxState(users[0]);
    expect(state.session?.targetUrl).toBe("https://example.com/");
    expect(state.session?.sourceInvestigationId).toBe(sourceId);
    expect(state.session?.downloadAnalyses.length).toBe(2);
  });
});
