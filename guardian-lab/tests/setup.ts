import { afterAll, beforeAll, mock, setDefaultTimeout } from "bun:test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import * as nextServer from "next/server";
import { ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE } from "./e2e/fixtures/user-fixtures";
import { recordOtpDelivery } from "./helpers/otp-delivery";

setDefaultTimeout(30000);

mock.module("next/server", () => ({
  ...nextServer,
  after: (fn: () => unknown) => {
    void Promise.resolve()
      .then(fn)
      .catch(() => {});
  },
}));

// Keep OTP tests deterministic without replacing globalThis.fetch in individual files.
// The production Fonnte adapter remains unmodified; only the Bun test module is mocked.
mock.module("@/lib/auth/otp/fonnte", () => ({
  sendWhatsApp: async (phone: string, code: string) => {
    recordOtpDelivery(phone, code);
    return true;
  },
}));

// Unit tests never execute an external container runtime. Dedicated runtime verification is separate.
process.env.SANDBOX_BROKER_URL = "";
const originalUrl = process.env.DATABASE_URL;
if (!originalUrl)
  throw new Error("DATABASE_URL diperlukan untuk menyiapkan database pengujian MySQL.");
const databaseName = `guardian_lab_test_${Date.now()}_${process.pid}`;
const testUrl = new URL(originalUrl);
testUrl.pathname = `/${databaseName}`;
process.env.DATABASE_URL = testUrl.toString();

const administrator = new PrismaClient({ datasources: { db: { url: originalUrl } } });
let databaseCreated = false;

beforeAll(async () => {
  await administrator.$executeRawUnsafe(
    `CREATE DATABASE ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  databaseCreated = true;
  const migration = Bun.spawn([process.execPath, "x", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [output, errors, exitCode] = await Promise.all([
    new Response(migration.stdout).text(),
    new Response(migration.stderr).text(),
    migration.exited,
  ]);
  if (exitCode !== 0)
    throw new Error(
      `Migrasi test gagal: ${(errors || output).replaceAll(testUrl.toString(), "[DATABASE_URL]")}`,
    );
  const { prisma } = await import("../lib/prisma");
  const fixtures = [ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE];
  for (let index = 0; index < fixtures.length; index++) {
    const user = fixtures[index];
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: user.exp,
        streakDays: user.streakDays,
        passwordHash: await hash(user.passwordPlainText, 4),
        phone: `+628120000000${index + 1}`,
        phoneVerifiedAt: new Date(),
      },
    });
  }
});

afterAll(async () => {
  const { prisma } = await import("../lib/prisma");
  await prisma.$disconnect();
  try {
    if (databaseCreated && /^guardian_lab_test_\d+_\d+$/.test(databaseName)) {
      await administrator.$executeRawUnsafe(`DROP DATABASE ${databaseName}`);
    }
  } finally {
    await administrator.$disconnect();
  }
});
