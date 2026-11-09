import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  inspectSession,
  startSandboxSession,
  stopSandboxSession,
} from "@/lib/sandbox/session-manager";
import { sandboxTarget } from "@/lib/sandbox/target";

let userId = "";
let provider: ReturnType<typeof Bun.serve>;
const sessions = new Map<
  string,
  { sessionId: string; expiresAt: number; status: string; streamUrl: string }
>();
let denyDelete = false;
let holdStart = false;
let enteredStart: (() => void) | undefined;
let releaseStart: (() => void) | undefined;
let holdInspect = false;
let enteredInspect: (() => void) | undefined;
let releaseInspect: (() => void) | undefined;
const previous = { url: process.env.SANDBOX_BROKER_URL, key: process.env.SANDBOX_BROKER_KEY };
beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Sandbox test",
      email: `sandbox-${randomUUID()}@example.test`,
      passwordHash: "unused-test",
    },
  });
  userId = user.id;
  provider = Bun.serve({
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/health") return Response.json({ web: true });
      if (request.method === "POST") {
        const { sessionId } = (await request.json()) as { sessionId: string };
        if (holdStart) {
          enteredStart?.();
          await new Promise<void>((resolve) => {
            releaseStart = resolve;
          });
        }
        const result = {
          sessionId,
          expiresAt: Date.now() + 180000,
          status: "ACTIVE",
          streamUrl: `http://localhost:4010/s/${sessionId}/`,
        };
        sessions.set(sessionId, result);
        return Response.json(result);
      }
      const id = path.split("/").at(-1) ?? "";
      if (request.method === "DELETE") {
        if (denyDelete) return new Response(null, { status: 503 });
        sessions.delete(id);
        return Response.json({ destroyed: true });
      }
      const snapshot = sessions.get(id);
      if (holdInspect) {
        enteredInspect?.();
        await new Promise<void>((resolve) => {
          releaseInspect = resolve;
        });
      }
      return snapshot ? Response.json(snapshot) : new Response(null, { status: 404 });
    },
  });
  process.env.SANDBOX_BROKER_URL = provider.url.href;
  process.env.SANDBOX_BROKER_KEY = "test-broker-key-at-least-thirty-two-characters";
});
afterAll(async () => {
  process.env.SANDBOX_BROKER_URL = previous.url ?? "";
  process.env.SANDBOX_BROKER_KEY = previous.key ?? "";
  provider?.stop(true);
  await prisma.user.deleteMany({ where: { id: userId } });
});
describe("Sandbox provider lifecycle contract", () => {
  it("does not display a stopped session as active after a delayed polling response", async () => {
    const session = await startSandboxSession("web", "https://example.com/", userId);
    const record = await prisma.sandboxSession.findUniqueOrThrow({
      where: { id: session.sessionId },
    });
    const arrived = new Promise<void>((resolve) => {
      enteredInspect = resolve;
    });
    holdInspect = true;
    const pending = inspectSession(record);
    try {
      await arrived;
      await stopSandboxSession(session.sessionId, { id: userId, role: "USER" });
      holdInspect = false;
      releaseInspect?.();
      const result = await pending;
      expect(result.status).toBe("DESTROYED");
      expect(result.streamUrl).toBeNull();
    } finally {
      holdInspect = false;
      releaseInspect?.();
      await pending;
      await stopSandboxSession(session.sessionId, { id: userId, role: "USER" });
    }
  });
  it("keeps the authoritative target and validates source ownership before allocation", async () => {
    const source = await prisma.forensicRecord.create({
      data: {
        userId,
        type: "URL",
        target: "https://example.com/source",
        defangedTarget: "hxxps://example[.]com/source",
        status: "UNAVAILABLE",
      },
    });
    const count = sessions.size;
    await expect(
      startSandboxSession("web", "https://example.com/source", "another-user", undefined, {
        sourceInvestigationId: source.id,
      }),
    ).rejects.toThrow("tidak ditemukan");
    await expect(
      startSandboxSession("web", "https://example.com/other", userId, undefined, {
        sourceInvestigationId: source.id,
      }),
    ).rejects.toThrow("berbeda");
    await expect(
      startSandboxSession("web", "https://example.com/source?token=secret", userId),
    ).rejects.toThrow();
    expect(sessions.size).toBe(count);
    const result = await startSandboxSession("web", source.target, userId, undefined, {
      sourceInvestigationId: source.id,
    });
    expect(result.targetUrl).toBe(source.target);
    expect(result.sourceInvestigationId).toBe(source.id);
    const record = await prisma.sandboxSession.findUniqueOrThrow({
      where: { id: result.sessionId },
    });
    expect((await inspectSession(record)).targetUrl).toBe(source.target);
    await expect(
      startSandboxSession("web", "https://example.com/other", userId, result.sessionId),
    ).rejects.toThrow("ID sesi");
    await stopSandboxSession(result.sessionId, { id: userId, role: "USER" });
  });
  it("creates an active record only after a real provider response and reuses a request ID", async () => {
    const id = randomUUID();
    const now = Date.now();
    const result = await startSandboxSession(
      "web",
      "https://example.com/?token=private",
      userId,
      id,
      { stripParameters: true },
    );
    expect(result.status).toBe("ACTIVE");
    expect(result.isFallback).toBe(false);
    expect(result.expiresAt - now).toBeLessThanOrEqual(181000);
    expect((await prisma.sandboxSession.findUniqueOrThrow({ where: { id } })).targetUrl).toBe(
      "https://example.com/",
    );
    expect((await startSandboxSession("web", "https://example.com/", userId, id)).sessionId).toBe(
      id,
    );
    expect(await stopSandboxSession(id, { id: "another-user", role: "USER" })).toBeNull();
    denyDelete = true;
    await expect(stopSandboxSession(id, { id: userId, role: "USER" })).rejects.toThrow();
    expect((await prisma.sandboxSession.findUniqueOrThrow({ where: { id } })).status).toBe(
      "ACTIVE",
    );
    denyDelete = false;
    await stopSandboxSession(id, { id: userId, role: "USER" });
    expect((await prisma.sandboxSession.findUniqueOrThrow({ where: { id } })).status).toBe(
      "DESTROYED",
    );
  });
  it("does not allocate more than one simultaneous session to an account", async () => {
    const first = await startSandboxSession("web", "https://example.com/", userId);
    await expect(startSandboxSession("web", "https://example.com/", userId)).rejects.toThrow(
      "Selesaikan sesi",
    );
    await stopSandboxSession(first.sessionId, { id: userId, role: "USER" });
  });
  it("reconciles expired sessions and confirms provider cleanup", async () => {
    const session = await startSandboxSession("web", "https://example.com/", userId);
    const record = await prisma.sandboxSession.update({
      where: { id: session.sessionId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await inspectSession(record)).status).toBe("EXPIRED");
    expect(sessions.has(session.sessionId)).toBe(false);
  });
  it("reports UNKNOWN if the provider cannot confirm cleanup", async () => {
    const session = await startSandboxSession("web", "https://example.com/", userId);
    const record = await prisma.sandboxSession.findUniqueOrThrow({
      where: { id: session.sessionId },
    });
    const url = process.env.SANDBOX_BROKER_URL;
    process.env.SANDBOX_BROKER_URL = "";
    expect((await inspectSession(record)).status).toBe("UNKNOWN");
    process.env.SANDBOX_BROKER_URL = url;
    await stopSandboxSession(session.sessionId, { id: userId, role: "USER" });
  });
  it("never revives a stopped session when its delayed startup response arrives", async () => {
    const id = randomUUID();
    const arrived = new Promise<void>((resolve) => {
      enteredStart = resolve;
    });
    holdStart = true;
    const outcome = startSandboxSession("web", "https://example.com/", userId, id).then(
      (value) => ({ value, error: null }),
      (error: unknown) => ({ value: null, error }),
    );
    try {
      await arrived;
      await stopSandboxSession(id, { id: userId, role: "USER" });
      holdStart = false;
      releaseStart?.();
      const result = await outcome;
      expect(result.error).not.toBeNull();
      expect((await prisma.sandboxSession.findUniqueOrThrow({ where: { id } })).status).toBe(
        "DESTROYED",
      );
      expect(sessions.has(id)).toBe(false);
    } finally {
      holdStart = false;
      releaseStart?.();
      await outcome;
      await stopSandboxSession(id, { id: userId, role: "USER" });
    }
  });
});
describe("Sandbox target constraints", () => {
  it("rejects IP literals, reserved hosts, non-web ports and personal data", () => {
    for (const target of [
      "http://127.0.0.1/",
      "http://[::1]/",
      "http://local.test/",
      "https://example.com:3306/",
      "https://example.com/081234567890",
    ])
      expect(() => sandboxTarget(target)).toThrow();
  });
  it("removes query and fragment values before container creation", () => {
    expect(() =>
      sandboxTarget("https://example.com/path?email=person@example.test#secret"),
    ).toThrow();
    expect(sandboxTarget("https://example.com/path?email=person@example.test#secret", true)).toBe(
      "https://example.com/path",
    );
  });
});
