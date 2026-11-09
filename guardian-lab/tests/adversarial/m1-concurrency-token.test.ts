/**
 * Guardian Lab: Milestone 1 Iteration 2 Adversarial Concurrency & Token Tampering Stress Harness
 *
 * Verifies:
 * 1. Database integrity under concurrency (simultaneous registrations, duplicate email checks, case-insensitive collision).
 * 2. MySQL column limits: Text columns (65,535 bytes) and Session.token VARCHAR(500) boundary vs JWT lengths.
 * 3. Token tampering resistance: corrupt signature, modified claims, future issued-at, expired token.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomInt } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as authMeGET } from "@/app/api/auth/me/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

const TEST_PREFIX = "challenger_it2_";
const UNIQUE_ID = Date.now().toString(36);

function makeEmail(suffix: string): string {
  return `${TEST_PREFIX}${UNIQUE_ID}_${suffix}@guardianlab.test`;
}

function makePhone(): string {
  return `+62812${randomInt(10_000_000, 99_999_999)}`;
}

describe("Milestone 1 Iteration 2 Adversarial Concurrency & Token Stress Harness", () => {
  beforeAll(async () => {
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: TEST_PREFIX } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: TEST_PREFIX } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  // =========================================================================
  // 1. CONCURRENCY & DATABASE INTEGRITY
  // =========================================================================
  describe("1. Concurrency & Database Integrity", () => {
    it("preserves MySQL integrity during 10 simultaneous registrations with identical email", async () => {
      const email = makeEmail("simultaneous_identical");
      const password = "Password123!";
      const phone = makePhone();

      // Launch 10 simultaneous registration requests
      const promises = Array.from({ length: 10 }).map((_, index) => {
        const req = new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Concurrent User ${index}`,
            email,
            phone,
            password,
          }),
        });
        return registerPOST(req);
      });

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);

      // Exactly ONE request must succeed (HTTP 201)
      const successCount = statuses.filter((s) => s === 201).length;
      expect(successCount).toBe(1);

      // All remaining requests must fail (either 409 Conflict or 500 on unhandled P2002 race)
      const non201Count = statuses.filter((s) => s !== 201).length;
      expect(non201Count).toBe(9);

      // CRITICAL DATABASE INTEGRITY: Exactly 1 user record created in MySQL
      const userCount = await prisma.user.count({
        where: { email },
      });
      expect(userCount).toBe(1);

      // Clean up
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    });

    it("enforces case-insensitive duplicate registration under concurrency", async () => {
      const baseEmail = makeEmail("simultaneous_casing");
      const password = "Password123!";
      const phone = makePhone();

      const variations = [
        baseEmail.toLowerCase(),
        baseEmail.toUpperCase(),
        baseEmail.charAt(0).toUpperCase() + baseEmail.slice(1),
        baseEmail.toLowerCase(),
      ];

      const promises = variations.map((emailVar, index) => {
        const req = new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Case User ${index}`,
            email: emailVar,
            phone,
            password,
          }),
        });
        return registerPOST(req);
      });

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);

      // Exactly 1 must succeed
      expect(statuses.filter((s) => s === 201).length).toBe(1);

      // Exactly 1 user in MySQL
      const count = await prisma.user.count({
        where: { email: baseEmail.toLowerCase() },
      });
      expect(count).toBe(1);

      // Clean up
      await prisma.session.deleteMany({
        where: { user: { email: baseEmail.toLowerCase() } },
      });
      await prisma.user.deleteMany({ where: { email: baseEmail.toLowerCase() } });
    });

    it("handles sequential duplicate registrations with case variation returning HTTP 409", async () => {
      const email = makeEmail("seq_case");
      const password = "Password123!";
      const phone = makePhone();

      // Register with uppercase
      const res1 = await registerPOST(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Initial User",
            email: email.toUpperCase(),
            phone,
            password,
          }),
        }),
      );
      expect(res1.status).toBe(201);

      // Duplicate registration with lowercase
      const res2 = await registerPOST(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Duplicate User",
            email: email.toLowerCase(),
            phone,
            password,
          }),
        }),
      );
      expect(res2.status).toBe(409);
      const data2 = await res2.json();
      expect(data2.error).toContain("Email sudah terdaftar");

      // Login succeeds with mixed case
      const resLogin = await loginPOST(
        new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toUpperCase(),
            password,
          }),
        }),
      );
      expect(resLogin.status).toBe(200);

      // Clean up
      await prisma.session.deleteMany({
        where: { user: { email: email.toLowerCase() } },
      });
      await prisma.user.deleteMany({ where: { email: email.toLowerCase() } });
    });
  });

  // =========================================================================
  // 2. COLUMN BOUNDS & PAYLOAD LIMITS
  // =========================================================================
  describe("2. Column Bounds & Payload Limits", () => {
    it("handles payloads up to 60,000 characters in MySQL Text column", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Payload Tester",
          email: makeEmail("payload_tester"),
          passwordHash: "hash123",
        },
      });

      const payload60k = "D".repeat(60000);
      const record = await prisma.forensicRecord.create({
        data: {
          userId: user.id,
          target: payload60k,
          type: "URL",
          riskLevel: "SAFE",
          riskScore: 0,
          scamCategory: "TEST",
          summary: "Summary of 60k payload",
          deceptionTricks: [],
          technicalEvidence: {},
          defangedTarget: payload60k,
        },
      });

      expect(record.id).toBeDefined();
      expect(record.target.length).toBe(60000);

      await prisma.forensicRecord.delete({ where: { id: record.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("verifies MySQL TEXT 65,535 byte boundary rejection (P2000) for oversized payload", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Oversized Tester",
          email: makeEmail("oversized_tester"),
          passwordHash: "hash123",
        },
      });

      let threwP2000 = false;
      try {
        await prisma.forensicRecord.create({
          data: {
            userId: user.id,
            target: "E".repeat(70000), // > 65,535 bytes
            type: "URL",
            riskLevel: "SAFE",
            riskScore: 0,
            scamCategory: "TEST",
            summary: "Oversized",
            deceptionTricks: [],
            technicalEvidence: {},
            defangedTarget: "defanged",
          },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === "P2000") {
          threwP2000 = true;
        }
      }
      expect(threwP2000).toBe(true);

      await prisma.user.delete({ where: { id: user.id } });
    });

    it("empirically demonstrates JWT token length overflow vulnerability against Session.token VARCHAR(500)", async () => {
      const user = await prisma.user.create({
        data: {
          name: "JWT Length Tester",
          email: makeEmail("jwt_length_tester"),
          passwordHash: "hash123",
        },
      });

      // Standard JWT (short email & name) fits well within 500 characters
      const standardToken = await signSessionToken({
        userId: user.id,
        email: "short@guardianlab.id",
        name: "Standard Name",
        role: "USER",
      });
      expect(standardToken.length).toBeLessThan(400);

      // Long valid email (130 chars) + 50 chars name (max per registerSchema)
      const longValidEmail = `analyst.${"a".repeat(110)}@cyberdefense.org`;
      const longValidName = "B".repeat(50);

      const overflowToken = await signSessionToken({
        userId: user.id,
        email: longValidEmail,
        name: longValidName,
        role: "ADMIN",
      });

      // Verified finding: Token length exceeds 500 characters
      expect(overflowToken.length).toBeGreaterThan(500);

      // Demonstrates that inserting this token into Session.token (VARCHAR 500) fails with P2000
      let threwP2000 = false;
      try {
        await prisma.session.create({
          data: {
            userId: user.id,
            token: overflowToken,
            expiresAt: new Date(Date.now() + 60000),
          },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === "P2000") {
          threwP2000 = true;
        }
      }
      expect(threwP2000).toBe(true);

      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  // =========================================================================
  // 3. TOKEN TAMPERING RESISTANCE
  // =========================================================================
  describe("3. Token Tampering Resistance", () => {
    it("rejects corrupted token signature", async () => {
      const validToken = await signSessionToken({
        userId: "usr_tamper_01",
        email: "tamper@test.com",
        name: "Tamper User",
        role: "USER",
      });

      const parts = validToken.split(".");
      expect(parts.length).toBe(3);

      // Corrupt signature bytes
      const corruptedToken = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -6)}ZZZZZZ`;
      const verified = await verifySessionToken(corruptedToken);
      expect(verified).toBeNull();
    });

    it("rejects modified claims (privilege escalation USER -> ADMIN)", async () => {
      const validToken = await signSessionToken({
        userId: "usr_tamper_02",
        email: "tamper2@test.com",
        name: "Tamper User 2",
        role: "USER",
      });

      const parts = validToken.split(".");
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      claims.role = "ADMIN";
      const forgedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");

      const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;
      const verified = await verifySessionToken(forgedToken);
      expect(verified).toBeNull();
    });

    it("empirically records that verifySessionToken accepts future issued-at unless maxTokenAge is enforced", async () => {
      const secret = new TextEncoder().encode(
        process.env.SESSION_SECRET ||
          process.env.AUTH_SECRET ||
          "guardian-lab-default-session-secret-key-32-bytes",
      );

      // Token issued 2 hours in the future
      const futureIatToken = await new SignJWT({
        userId: "usr_future_iat",
        email: "future@guardianlab.test",
        name: "Future IAT",
        role: "USER",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(Math.floor(Date.now() / 1000) + 7200)
        .setExpirationTime(Math.floor(Date.now() / 1000) + 14400)
        .sign(secret);

      // Observation: verifySessionToken does not reject future iat because maxTokenAge is not configured
      const verified = await verifySessionToken(futureIatToken);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("usr_future_iat");

      // Verify that jose with maxTokenAge properly detects and rejects future iat
      let maxAgeThrew = false;
      try {
        await jwtVerify(futureIatToken, secret, {
          algorithms: ["HS256"],
          maxTokenAge: "7d",
        });
      } catch (err: unknown) {
        const msg = (err as Error).message;
        if (msg.includes("timestamp check failed")) {
          maxAgeThrew = true;
        }
      }
      expect(maxAgeThrew).toBe(true);

      // Defense-in-depth: unpersisted future token is rejected by /api/auth/me with HTTP 401
      const req = new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `guardian_session=${futureIatToken}` },
      });
      const res = await authMeGET(req);
      expect(res.status).toBe(401);
    });

    it("rejects expired token cryptographically and at the database layer", async () => {
      const secret = new TextEncoder().encode(
        process.env.SESSION_SECRET ||
          process.env.AUTH_SECRET ||
          "guardian-lab-default-session-secret-key-32-bytes",
      );

      // 1. Expired JWT
      const expiredJwt = await new SignJWT({
        userId: "usr_expired_01",
        email: "expired@test.com",
        name: "Expired User",
        role: "USER",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
        .sign(secret);

      const verified = await verifySessionToken(expiredJwt);
      expect(verified).toBeNull();

      // 2. Valid JWT but expired in MySQL Session table
      const user = await prisma.user.create({
        data: {
          name: "DB Expired User",
          email: makeEmail("db_expired_user"),
          passwordHash: "hash123",
        },
      });

      const validJwt = await signSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Insert session that expired 1 minute ago in DB
      const dbSession = await prisma.session.create({
        data: {
          userId: user.id,
          token: validJwt,
          expiresAt: new Date(Date.now() - 60000),
        },
      });

      const req = new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `guardian_session=${validJwt}` },
      });
      const res = await authMeGET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain("kedaluwarsa");

      // Clean up
      await prisma.session.delete({ where: { id: dbSession.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
