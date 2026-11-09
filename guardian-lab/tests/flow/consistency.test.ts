import { afterAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as ranking } from "@/app/api/community/leaderboard/route";
import { GET as overview } from "@/app/api/platform/overview/route";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { isNavigationActive } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { platformOverviewSchema, rankingSchema } from "@/lib/validations/platform";
import { demoAccounts, seedDemoAccounts } from "@/prisma/seeders/demo-accounts";

const ids: string[] = [];
afterAll(async () => {
  await prisma.user.deleteMany({
    where: { OR: [{ id: { in: ids } }, { email: { in: demoAccounts.map((a) => a.email) } }] },
  });
});
describe("Navigation matches page and tab", () => {
  it("selects Gateway for URL/QR and APK only on its own tab", () => {
    for (const tab of ["url", "qr", "apk"]) {
      const search = new URLSearchParams({ tab });
      expect(isNavigationActive(PUBLIC_ROUTES.home, "/", search)).toBe(tab !== "apk");
      expect(isNavigationActive(PUBLIC_ROUTES.homeWithTab("apk"), "/", search)).toBe(tab === "apk");
    }
  });
  it("never marks APK active on protected feature pages", () => {
    for (const path of ["/academy", "/history/record", "/sandbox/web", "/community/leaderboard"])
      expect(
        isNavigationActive(PUBLIC_ROUTES.homeWithTab("apk"), path, new URLSearchParams()),
      ).toBe(false);
  });
});
describe("Requested local account seeder", () => {
  it("creates the four requested roles and bcrypt passwords without invented progress", async () => {
    const accounts = await seedDemoAccounts(prisma);
    ids.push(...accounts);
    for (const expected of demoAccounts) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: expected.email } });
      expect(user.role).toBe(expected.role);
      expect(user.exp).toBe(0);
      expect(await verifyPassword("password", user.passwordHash)).toBe(true);
      expect(user.passwordHash).not.toBe("password");
      const response = await login(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: expected.email, password: "password" }),
        }),
      );
      expect(response.status).toBe(200);
      expect((await response.json()).redirectTo).toBe(expected.role === "ADMIN" ? "/admin" : "/");
    }
  });
  it("is idempotent and preserves investigation, EXP, updates official profile and retains valid sessions", async () => {
    const dery = await prisma.user.update({
      where: { email: "dery@gmail.com" },
      data: { exp: 17, name: "Custom Dery" },
    });
    const record = await prisma.forensicRecord.create({
      data: {
        userId: dery.id,
        type: "URL",
        target: "https://example.test/",
        defangedTarget: "hxxps://example[.]test/",
        status: "UNAVAILABLE",
      },
    });
    const token = await createSessionToken(dery);
    await seedDemoAccounts(prisma);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: dery.id } });
    expect(saved.name).toBe("Dery Wahyu Perdana");
    expect(saved.role).toBe("USER");
    expect(saved.phone).toBe("+6282377341268");
    expect(saved.exp).toBe(17);
    expect(await prisma.forensicRecord.count({ where: { id: record.id } })).toBe(1);
    expect(await prisma.session.count({ where: { token } })).toBe(1);
  });
  it("does not increment a learning streak merely by logging in", async () => {
    const lastLearningAt = new Date(Date.now() - 86_400_000);
    const user = await prisma.user.update({
      where: { email: "rafli@gmail.com" },
      data: { streakDays: 3, lastLearningAt, lastActiveAt: lastLearningAt },
    });
    const response = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: "password" }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).user.streakDays).toBe(3);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.streakDays).toBe(3);
    expect(saved.lastLearningAt).toEqual(lastLearningAt);
  });
});
describe("Database-backed public statistics and private ranking", () => {
  it("excludes legacy approvals without a published snapshot from the case count", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "dery@gmail.com" } });
    const source = await prisma.forensicRecord.findFirstOrThrow({ where: { userId: user.id } });
    const before = platformOverviewSchema.parse(await (await overview()).json());
    await prisma.communityReplay.create({
      data: {
        userId: user.id,
        sourceRecordId: source.id,
        consentedAt: new Date(),
        status: "APPROVED",
        title: "Legacy counter fixture",
        description: "Legacy approval without snapshot",
        scamType: "PHISHING",
        sanitizedData: {},
      },
    });
    const after = platformOverviewSchema.parse(await (await overview()).json());
    expect(after.cases).toBe(before.cases);
  });
  it("reflects actual new submissions and never returns identity or example counters", async () => {
    const before = platformOverviewSchema.parse(await (await overview()).json());
    const user = await prisma.user.create({
      data: {
        name: "Private ranking identity",
        email: `ranking-${randomUUID()}@example.test`,
        passwordHash: "unused",
        phone: "+6281299991111",
        phoneVerifiedAt: new Date(),
        exp: 99999,
      },
    });
    ids.push(user.id);
    await prisma.forensicRecord.createMany({
      data: ["URL", "APK"].map((type) => ({
        userId: user.id,
        type: type as "URL" | "APK",
        target: "fixture",
        defangedTarget: "fixture",
      })),
    });
    const response = await overview();
    const text = await response.text();
    const after = platformOverviewSchema.parse(JSON.parse(text));
    expect(after.links).toBe(before.links + 1);
    expect(after.apks).toBe(before.apks + 1);
    expect(after.ranking[0].exp).toBe(99999);
    for (const privateValue of [user.name, user.email, user.id])
      expect(text).not.toContain(privateValue);
    expect(after.ranking[0].alias).toMatch(/^Guardian [A-F0-9]{6}$/);
    const guest = await ranking(new Request("http://localhost/api/community/leaderboard"));
    expect(guest.status).toBe(401);
    const token = await createSessionToken(user);
    const authenticated = await ranking(
      new Request("http://localhost/api/community/leaderboard?page=1", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      }),
    );
    const list = rankingSchema.parse(await authenticated.json());
    expect(list.items[0].isCurrentUser).toBe(true);
  });
});
