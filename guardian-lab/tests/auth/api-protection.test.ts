import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { GET as progress } from "@/app/api/academy/progress/route";
import { GET as quiz } from "@/app/api/academy/quizzes/[id]/route";
import { GET as quizzes } from "@/app/api/academy/quizzes/route";
import { POST as submitQuiz } from "@/app/api/academy/submit-quiz/route";
import { PUT as review } from "@/app/api/admin/community-reviews/[id]/route";
import { GET as reviews } from "@/app/api/admin/community-reviews/route";
import { DELETE as deleteQuiz, PUT as updateQuiz } from "@/app/api/admin/quizzes/[id]/route";
import { GET as adminQuizzes, POST as createQuiz } from "@/app/api/admin/quizzes/route";
import { POST as analyzeApk } from "@/app/api/analyze-apk/route";
import { POST as analyzeQr } from "@/app/api/analyze-qr/route";
import { POST as analyzeUrl } from "@/app/api/analyze-url/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as currentProfile } from "@/app/api/auth/me/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as replayAttempt } from "@/app/api/community/replays/[id]/attempt/route";
import { GET as replay } from "@/app/api/community/replays/[id]/route";
import { GET as replays } from "@/app/api/community/replays/route";
import { POST as submitReplay } from "@/app/api/community/submit/route";
import { GET as historyDetail } from "@/app/api/history/[id]/route";
import { GET as history } from "@/app/api/history/route";
import { GET as sandboxState } from "@/app/api/sandbox/session/route";
import { POST as startSandbox } from "@/app/api/sandbox/session/start/route";
import { POST as stopSandbox } from "@/app/api/sandbox/session/stop/route";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { authSuccessSchema } from "@/lib/validations/auth";

type Context = { params: Promise<{ id: string }> };
type Handler = (request: Request, context: Context) => Promise<Response>;
const context = (id = "missing") => ({ params: Promise.resolve({ id }) });
const protectedHandlers: [string, string, Handler][] = [
  ["URL analysis", "POST", analyzeUrl],
  ["QR analysis", "POST", analyzeQr],
  ["APK analysis", "POST", analyzeApk],
  ["academy progress", "GET", progress],
  ["sandbox state", "GET", sandboxState],
  ["sandbox start", "POST", startSandbox],
  ["sandbox stop", "POST", stopSandbox],
  ["history list", "GET", history],
  ["history detail", "GET", historyDetail],
  ["quiz list", "GET", quizzes],
  ["quiz detail", "GET", quiz],
  ["quiz submit", "POST", submitQuiz],
  ["replay list", "GET", replays],
  ["replay detail", "GET", replay],
  ["replay submit", "POST", submitReplay],
  ["replay attempt", "POST", replayAttempt],
  ["admin quiz list", "GET", adminQuizzes],
  ["admin quiz create", "POST", createQuiz],
  ["admin quiz update", "PUT", updateQuiz],
  ["admin quiz delete", "DELETE", deleteQuiz],
  ["admin review list", "GET", reviews],
  ["admin review update", "PUT", review],
];

function request(method = "GET", token?: string, body: unknown = {}) {
  return new Request("http://localhost:3000/api/verification", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `${SESSION_COOKIE_NAME}=${token}` } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

describe("Authenticated feature access", () => {
  const ownedUsers: string[] = [];
  let first: { id: string; token: string };
  let second: { id: string; token: string };
  let admin: { id: string; token: string };

  async function identity(role: "USER" | "ADMIN" = "USER") {
    const id = `access_${crypto.randomUUID()}`;
    const user = await prisma.user.create({
      data: {
        id,
        email: `${id}@example.invalid`,
        name: "Access check",
        role,
        passwordHash: await hashPassword("Fixture1234"),
        phone: `+62812${Math.floor(10000000 + Math.random() * 90000000)}`,
        phoneVerifiedAt: new Date(),
      },
    });
    ownedUsers.push(id);
    return { id, token: await createSessionToken(user) };
  }

  beforeAll(async () => {
    first = await identity();
    second = await identity();
    admin = await identity("ADMIN");
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: ownedUsers } } });
  });

  it.each(protectedHandlers)(
    "rejects guests before executing %s",
    async (_label, method, handler) => {
      expect((await handler(request(method), context())).status).toBe(401);
    },
  );

  it.each(protectedHandlers.filter(([label]) => label.startsWith("admin")))(
    "rejects a user from %s",
    async (_label, method, handler) => {
      expect((await handler(request(method, first.token), context())).status).toBe(403);
    },
  );

  it("uses the current database role after an admin is demoted", async () => {
    const formerAdmin = await identity("ADMIN");
    await prisma.user.update({ where: { id: formerAdmin.id }, data: { role: "USER" } });
    expect((await adminQuizzes(request("GET", formerAdmin.token))).status).toBe(403);
  });

  it("rejects a revoked session and a database-expired session", async () => {
    const revoked = await identity();
    await prisma.session.deleteMany({ where: { token: revoked.token } });
    expect((await history(request("GET", revoked.token))).status).toBe(401);
    const expired = await identity();
    await prisma.session.update({
      where: { token: expired.token },
      data: { expiresAt: new Date(0) },
    });
    expect((await history(request("GET", expired.token))).status).toBe(401);
  });

  it("limits forensic history to the owner while allowing admin review", async () => {
    const record = await prisma.forensicRecord.create({
      data: {
        userId: first.id,
        target: "https://example.invalid",
        type: "URL",
        riskLevel: "LOW",
        riskScore: 0,
        scamCategory: "Access fixture",
        summary: "Access fixture",
        deceptionTricks: [],
        technicalEvidence: {},
        defangedTarget: "hxxps://example[.]invalid",
      },
    });
    expect((await historyDetail(request("GET", second.token), context(record.id))).status).toBe(
      403,
    );
    expect((await historyDetail(request("GET", first.token), context(record.id))).status).toBe(200);
    expect((await historyDetail(request("GET", admin.token), context(record.id))).status).toBe(200);
    const listed: { records: { userId: string }[] } = await (
      await history(request("GET", second.token))
    ).json();
    expect(listed.records.every((item) => item.userId === second.id)).toBe(true);
  });

  it("prevents users from stopping another user's sandbox", async () => {
    const session = await prisma.sandboxSession.create({
      data: {
        userId: first.id,
        type: "WEB",
        targetUrl: "https://example.invalid",
        expiresAt: new Date(Date.now() + 180000),
      },
    });
    expect(
      (await stopSandbox(request("POST", second.token, { sessionId: session.id }))).status,
    ).toBe(404);
    expect(
      (await prisma.sandboxSession.findUniqueOrThrow({ where: { id: session.id } })).status,
    ).toBe("ACTIVE");
    expect(
      (await stopSandbox(request("POST", first.token, { sessionId: session.id }))).status,
    ).toBe(503);
  });

  it("keeps unapproved community cases private", async () => {
    const pending = await prisma.communityReplay.create({
      data: {
        userId: first.id,
        title: "Pending check",
        description: "Sanitized evidence",
        scamType: "URL",
        sanitizedData: {},
      },
    });
    expect((await replay(request("GET", second.token), context(pending.id))).status).toBe(404);
    expect((await replay(request("GET", first.token), context(pending.id))).status).toBe(200);
    expect((await replay(request("GET", admin.token), context(pending.id))).status).toBe(200);
    expect((await replayAttempt(request("POST", first.token), context(pending.id))).status).toBe(
      404,
    );
  });

  it("rejects cross-origin authenticated mutations", async () => {
    const attempted = request("POST", first.token, { url: "https://example.invalid" });
    attempted.headers.set("Origin", "https://untrusted.example");
    expect((await analyzeUrl(attempted)).status).toBe(403);
  });

  it("always registers a user even if the payload requests admin privileges", async () => {
    const email = `registration_${crypto.randomUUID()}@example.invalid`;
    const response = await register(
      request("POST", undefined, {
        name: "New Guardian",
        email,
        phone: "+6281234567891",
        password: "Fixture1234",
        role: "ADMIN",
      }),
    );
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.status).toBe("verification_required");
    expect(result.redirectTo).toBe("/otp");
    const created = await prisma.user.findUniqueOrThrow({ where: { email } });
    ownedUsers.push(created.id);
    expect(created.role).toBe("USER");
  });

  it("returns role-specific destinations from the actual login handler", async () => {
    for (const [account, target] of [
      [first, "/"],
      [admin, "/admin"],
    ] as const) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: account.id } });
      const response = await login(
        request("POST", undefined, {
          email: user.email,
          password: "Fixture1234",
          redirect: "/history",
        }),
      );
      expect(response.status).toBe(200);
      expect(authSuccessSchema.parse(await response.json()).redirectTo).toBe(target);
    }
  });

  it("returns validation errors for malformed auth JSON", async () => {
    for (const handler of [login, register]) {
      const response = await handler(
        new Request("http://localhost:3000/api/auth/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        }),
      );
      expect(response.status).toBe(400);
    }
  });

  it("rejects malformed cookie encodings without a server error", async () => {
    expect((await currentProfile(request("GET", "%E0%A4"))).status).toBe(401);
    expect((await currentProfile(request("GET", "%ZZ"))).status).toBe(401);
  });

  it("rolls registration back if session creation fails", async () => {
    const originalSecret = process.env.SESSION_SECRET;
    const originalAuthSecret = process.env.AUTH_SECRET;
    const email = `rollback_${crypto.randomUUID()}@example.invalid`;
    try {
      process.env.SESSION_SECRET = "short";
      delete process.env.AUTH_SECRET;
      const response = await register(
        request("POST", undefined, {
          email,
          name: "Rollback Guardian",
          phone: "+6281234567892",
          password: "Fixture1234",
        }),
      );
      expect(response.status).toBe(503);
      expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
    } finally {
      if (originalSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = originalSecret;
      if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = originalAuthSecret;
      await prisma.user.deleteMany({ where: { email } });
    }
  });
});
