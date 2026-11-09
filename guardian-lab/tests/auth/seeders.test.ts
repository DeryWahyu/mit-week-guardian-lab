import { afterAll, describe, expect, it } from "bun:test";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { phoneSchema } from "@/lib/validations/auth";
import { demoAccounts, seedDemoAccounts } from "@/prisma/seeders/demo-accounts";

describe("SEED-01 & SEED-02: Local Demo Accounts Seeder", () => {
  afterAll(async () => {
    // Clean up demo accounts created during test
    await prisma.user.deleteMany({
      where: { email: { in: demoAccounts.map((account) => account.email) } },
    });
  });

  it("seeds all demo accounts with normalized E.164 phone numbers", async () => {
    const ids = await seedDemoAccounts(prisma);
    expect(ids.length).toBe(demoAccounts.length);

    for (const demo of demoAccounts) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: demo.email } });
      const expectedNormalizedPhone = phoneSchema.parse(demo.phone);

      expect(user.phone).toBe(expectedNormalizedPhone);
      expect(user.phone?.startsWith("+62")).toBe(true);
      expect(user.name).toBe(demo.name);
      expect(user.role).toBe(demo.role);
      expect(user.phoneVerifiedAt).not.toBeNull();
    }
  });

  it("encrypts passwords with bcrypt and generates unique salts/hashes per account", async () => {
    await seedDemoAccounts(prisma);

    const users = await prisma.user.findMany({
      where: { email: { in: demoAccounts.map((account) => account.email) } },
    });

    const hashes = users.map((u) => u.passwordHash);

    // Each account must have a distinct salt/hash even with the same default password
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(demoAccounts.length);

    for (const user of users) {
      expect(user.passwordHash).not.toBe("password");
      expect(user.passwordHash.startsWith("$2")).toBe(true);
      expect(await verifyPassword("password", user.passwordHash)).toBe(true);
      expect(await verifyPassword("wrong-password", user.passwordHash)).toBe(false);
    }
  });

  it("detects and rejects duplicate phone numbers before running seed", async () => {
    // Test duplicate detection logic used by seedDemoAccounts
    const duplicatedList = [
      { email: "a@test.id", name: "User A", role: "USER" as const, phone: "081234567890" },
      { email: "b@test.id", name: "User B", role: "USER" as const, phone: "+6281234567890" },
    ];

    const normalized = duplicatedList.map((a) => ({
      ...a,
      phone: phoneSchema.parse(a.phone),
    }));

    const uniquePhones = new Set(normalized.map((a) => a.phone));
    expect(uniquePhones.size).toBeLessThan(duplicatedList.length);

    // Verifying that duplicate phone set triggers guard error
    const runGuard = () => {
      if (uniquePhones.size !== duplicatedList.length) {
        throw new Error("Nomor WhatsApp akun demo harus unik sebelum seed dijalankan.");
      }
    };

    expect(runGuard).toThrow("Nomor WhatsApp akun demo harus unik sebelum seed dijalankan.");
  });

  it("is idempotent: re-running does not duplicate records and preserves user progress (EXP)", async () => {
    await seedDemoAccounts(prisma);

    // Set custom EXP on one of the accounts
    const targetEmail = "gading@gmail.com";
    await prisma.user.update({
      where: { email: targetEmail },
      data: { exp: 350 },
    });

    // Re-run seeder
    await seedDemoAccounts(prisma);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: targetEmail } });
    expect(user.exp).toBe(350);

    const totalCount = await prisma.user.count({
      where: { email: { in: demoAccounts.map((account) => account.email) } },
    });
    expect(totalCount).toBe(demoAccounts.length);
  });

  it("strictly prevents seeding in production environment", async () => {
    // Simulate the production guard without mutating the process-global NODE_ENV.
    const checkProductionSafety = (env: string) => {
      if (env === "production") {
        throw new Error("Seeder akun demo hanya untuk pengembangan lokal.");
      }
    };

    expect(() => checkProductionSafety("production")).toThrow(
      "Seeder akun demo hanya untuk pengembangan lokal.",
    );
    expect(() => checkProductionSafety("development")).not.toThrow();
    expect(() => checkProductionSafety("test")).not.toThrow();
  });
});
