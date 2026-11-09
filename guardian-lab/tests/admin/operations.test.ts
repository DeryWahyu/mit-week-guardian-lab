import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";
import { PUT as saveReview } from "@/app/api/admin/investigations/[id]/route";
import { PUT as userAction, GET as userDetail } from "@/app/api/admin/users/[id]/route";
import { GET as users } from "@/app/api/admin/users/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me } from "@/app/api/auth/me/route";
import * as audit from "@/lib/admin/audit";
import { cleanAdminReason } from "@/lib/admin/security";
import { changeUser } from "@/lib/admin/users";
import { prisma } from "@/lib/prisma";
import { adminUserDetailSchema, adminUsersSchema } from "@/lib/validations/admin";
import { cleanupUsers, context, fixtureUser, request, tokenFor } from "./helpers";

const ids: string[] = [];
let actorId = "",
  actorToken = "",
  userId = "",
  userToken = "";
beforeAll(async () => {
  const actor = await fixtureUser("ADMIN"),
    user = await fixtureUser();
  ids.push(actor.id, user.id);
  actorId = actor.id;
  userId = user.id;
  actorToken = await tokenFor(actorId);
  userToken = await tokenFor(userId);
});
afterAll(() => cleanupUsers(ids));
async function change(id: string, action: string, extra: Record<string, unknown> = {}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  return userAction(
    request(`/api/admin/users/${id}`, actorToken, "PUT", {
      action,
      reason: "Administrasi akun pada fixture terisolasi.",
      revision: user.updatedAt.toISOString(),
      ...extra,
    }),
    context(id),
  );
}
describe("Admin access and account integrity", () => {
  it("blocks guests, USER and foreign origins before returning account data", async () => {
    expect((await users(request("/api/admin/users"))).status).toBe(401);
    expect((await users(request("/api/admin/users", userToken))).status).toBe(403);
    const req = request(`/api/admin/users/${userId}`, actorToken, "PUT", {});
    req.headers.set("Origin", "https://foreign.test");
    expect((await userAction(req, context(userId))).status).toBe(403);
  });
  it("returns masked contacts and sessions without credentials", async () => {
    const res = await users(request(`/api/admin/users?q=${userId}`, actorToken));
    expect(res.status).toBe(200);
    const data = adminUsersSchema.parse(await res.json());
    expect(data.items.map((u) => u.id)).toEqual([userId]);
    const detail = await userDetail(
      request(`/api/admin/users/${userId}`, actorToken),
      context(userId),
    );
    const value = adminUserDetailSchema.parse(await detail.json());
    expect(value.phone).not.toBe(
      (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).phone,
    );
    expect(value.sessions).toBeGreaterThan(0);
    const json = JSON.stringify(value);
    for (const key of ["passwordHash", "codeHash", "tokenHash", userToken])
      expect(json).not.toContain(key);
  });
  it("enforces suspension, revokes sessions/challenges and restores without changing EXP", async () => {
    const challenge = await prisma.authChallenge.create({
      data: {
        userId,
        tokenHash: "a".repeat(64),
        phoneHash: "b".repeat(64),
        purpose: "VERIFY",
        redirectTo: "/",
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(
      (
        await change(userId, "SUSPEND", {
          reason: "Tinjau kontak audit@example.test password=FixtureSecret2026 otp:123456",
        })
      ).status,
    ).toBe(200);
    expect(await prisma.session.count({ where: { userId } })).toBe(0);
    expect(
      (await prisma.authChallenge.findUniqueOrThrow({ where: { id: challenge.id } })).consumedAt,
    ).not.toBeNull();
    expect((await me(request("/api/auth/me", userToken))).status).toBe(401);
    const auth = await login(
      request("/api/auth/login", "", "POST", {
        email: before.email,
        password: "AdminFixture2026!",
      }),
    );
    expect(auth.status).toBe(403);
    const log = await prisma.adminAuditLog.findFirstOrThrow({
      where: { entityId: userId, action: "USER_SUSPEND" },
    });
    for (const secret of ["audit@example.test", "FixtureSecret2026", "123456"])
      expect(log.reason).not.toContain(secret);
    expect((await change(userId, "RESTORE")).status).toBe(200);
    const restored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(restored.exp).toBe(before.exp);
    expect(restored.phoneVerifiedAt).toEqual(before.phoneVerifiedAt);
    expect(restored.suspendedAt).toBeNull();
    userToken = await tokenFor(userId);
  });
  it("rejects stale revisions and refuses changes to the actor's own account", async () => {
    const stale = (
      await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    ).updatedAt.toISOString();
    expect((await change(userId, "REVOKE_SESSIONS")).status).toBe(200);
    expect(
      (
        await userAction(
          request(`/api/admin/users/${userId}`, actorToken, "PUT", {
            action: "SUSPEND",
            reason: "Fixture stale revision must not apply.",
            revision: stale,
          }),
          context(userId),
        )
      ).status,
    ).toBe(409);
    expect((await change(actorId, "SUSPEND")).status).toBe(409);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).suspendedAt).toBeNull();
  });
  it("rolls back account/session changes when audit persistence fails", async () => {
    const session = await tokenFor(userId);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const hook = spyOn(audit, "appendAudit").mockRejectedValue(
      new Error("Simulated audit write failure"),
    );
    try {
      await expect(
        changeUser(actorId, userId, {
          action: "SUSPEND",
          revision: before.updatedAt.toISOString(),
          reason: "Fixture audit rollback verification.",
        }),
      ).rejects.toThrow();
    } finally {
      hook.mockRestore();
    }
    const after = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(after.suspendedAt).toBeNull();
    expect(after.updatedAt).toEqual(before.updatedAt);
    expect(await prisma.session.count({ where: { token: session } })).toBe(1);
  });
  it("blocks promoting an unverified user and permits suspending an unverified admin", async () => {
    const unverified = await fixtureUser("USER", false);
    const pendingAdmin = await fixtureUser("ADMIN", false);
    ids.push(unverified.id, pendingAdmin.id);
    expect((await change(unverified.id, "SET_ROLE", { role: "ADMIN" })).status).toBe(409);
    expect((await change(pendingAdmin.id, "SUSPEND")).status).toBe(200);
  });
  it("concurrent cross-demotions preserve an active administrator and recheck the actor", async () => {
    const a = await fixtureUser("ADMIN"),
      b = await fixtureUser("ADMIN");
    ids.push(a.id, b.id);
    const others = await prisma.user.findMany({
      where: { role: "ADMIN", suspendedAt: null, id: { notIn: [a.id, b.id] } },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((x) => x.id) } },
      data: { suspendedAt: new Date() },
    });
    try {
      const results = await Promise.allSettled([
        changeUser(a.id, b.id, {
          action: "SET_ROLE",
          role: "USER",
          reason: "Fixture concurrent role transition.",
          revision: b.updatedAt.toISOString(),
        }),
        changeUser(b.id, a.id, {
          action: "SET_ROLE",
          role: "USER",
          reason: "Fixture concurrent role transition.",
          revision: a.updatedAt.toISOString(),
        }),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(
        await prisma.user.count({
          where: { id: { in: [a.id, b.id] }, role: "ADMIN", suspendedAt: null },
        }),
      ).toBe(1);
    } finally {
      await prisma.user.updateMany({
        where: { id: { in: others.map((x) => x.id) } },
        data: { suspendedAt: null },
      });
    }
  });
  it("persists reviews separately, preserves model output and rejects stale saves", async () => {
    const source = await prisma.forensicRecord.create({
      data: {
        userId,
        type: "URL",
        target: "https://example.test/",
        defangedTarget: "hxxps://example[.]test/",
        status: "UNAVAILABLE",
      },
    });
    const before = await prisma.forensicRecord.findUniqueOrThrow({ where: { id: source.id } });
    const body = {
      status: "NEEDS_REVIEW",
      note: "Fixture needs further evidence review.",
      revision: null,
    };
    expect(
      (
        await saveReview(
          request(`/api/admin/investigations/${source.id}`, actorToken, "PUT", body),
          context(source.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await saveReview(
          request(`/api/admin/investigations/${source.id}`, actorToken, "PUT", body),
          context(source.id),
        )
      ).status,
    ).toBe(409);
    expect(await prisma.forensicRecord.findUniqueOrThrow({ where: { id: source.id } })).toEqual(
      before,
    );
    expect(
      await prisma.adminAuditLog.count({
        where: { entityId: source.id, action: "INVESTIGATION_REVIEW" },
      }),
    ).toBe(1);
  });
  it("requires useful sanitized reasons", () => {
    expect(() => cleanAdminReason("short")).toThrow();
    expect(
      cleanAdminReason("Alasan OTP 123456 dan authorization: Bearer secretfixture123"),
    ).not.toContain("secretfixture123");
  });
});
