import { afterAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { randomInt, randomUUID } from "node:crypto";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as register } from "@/app/api/auth/register/route";
import { digest, OTP_COOKIE, rateLimit, reservePhoneCooldown } from "@/lib/auth/otp/core";
import { getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES } from "@/lib/routes";
import { clearOtpDeliveries, getOtpCode } from "../helpers/otp-delivery";

describe("AUTH-FLOW-01 & AUTH-OTP-01..04: WhatsApp OTP Verification Lifecycle", () => {
  let sentOtpCode = "";
  const createdUserIds: string[] = [];

  beforeEach(async () => {
    sentOtpCode = "";
    clearOtpDeliveries();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.authChallenge.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  it("completes registration, delivers WhatsApp OTP, and issues session cookie upon verification", async () => {
    const email = `recruit-${randomUUID()}@example.test`;
    const phone = `0813${randomInt(10000000, 99999999)}`;
    const password = "RecruitPassword123!";

    // 1. Register new user
    const registerRes = await register(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "Recruit Candidate",
          email,
          phone,
          password,
        }),
      }),
    );

    expect(registerRes.status).toBe(201);
    const regBody = await registerRes.json();
    expect(regBody.success).toBe(true);
    expect(regBody.status).toBe("verification_required");
    expect(regBody.redirectTo).toBe(AUTH_ROUTES.otp);
    expect(regBody.deliveryQueued).toBe(true);

    // Extract pending cookie
    const setCookie = registerRes.headers.get("set-cookie") || "";
    expect(setCookie).toContain(OTP_COOKIE);
    const pendingTokenMatch = setCookie.match(new RegExp(`${OTP_COOKIE}=([^;]+)`));
    expect(pendingTokenMatch).toBeTruthy();
    const pendingToken = pendingTokenMatch![1];

    // Verify user created with unverified phone
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(user.id);
    expect(user.phoneVerifiedAt).toBeNull();
    expect(user.role).toBe("USER");

    // 2. Wait for background WhatsApp delivery and verify OTP code was received
    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(phone);
    expect(sentOtpCode).toMatch(/^\d{6}$/);

    // 3. Verify OTP code
    const verifyRes = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );

    expect(verifyRes.status).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.success).toBe(true);
    expect(verifyBody.redirectTo).toBe("/");

    // Full session cookie issued, pending cookie revoked
    const verifyCookies = verifyRes.headers.get("set-cookie") || "";
    expect(verifyCookies).toContain(SESSION_COOKIE_NAME);
    expect(verifyCookies).toContain(`${OTP_COOKIE}=;`);

    // Verify DB state
    const verifiedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(verifiedUser.phoneVerifiedAt).not.toBeNull();

    const challenge = await prisma.authChallenge.findUniqueOrThrow({
      where: { tokenHash: digest(`token:${pendingToken}`) },
    });
    expect(challenge.consumedAt).not.toBeNull();

    // Verify session token works with getCurrentUser
    const sessionTokenMatch = verifyCookies.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    expect(sessionTokenMatch).toBeTruthy();
    const sessionToken = sessionTokenMatch![1];

    const currentSessionUser = await getCurrentUser(
      new Request("http://localhost:3000", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
      }),
    );
    expect(currentSessionUser?.id).toBe(user.id);
    expect(currentSessionUser?.email).toBe(email);
  });

  it("strictly rejects replay of an already consumed OTP challenge", async () => {
    const email = `replay-${randomUUID()}@example.test`;
    const phone = `0814${randomInt(10000000, 99999999)}`;
    const password = "ReplayPassword123!";

    const registerRes = await register(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ name: "Replay Tester", email, phone, password }),
      }),
    );
    const pendingToken = registerRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(user.id);

    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(phone);

    // First verification succeeds
    const firstVerify = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );
    expect(firstVerify.status).toBe(200);

    // Second verification with identical token & code is rejected
    const replayVerify = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );
    expect(replayVerify.status).toBe(401);
  });

  it("enforces max 5 failed attempts limit before permanently locking the challenge", async () => {
    const email = `lockout-${randomUUID()}@example.test`;
    const phone = `0815${randomInt(10000000, 99999999)}`;
    const password = "LockoutPassword123!";

    const registerRes = await register(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ name: "Lockout Tester", email, phone, password }),
      }),
    );
    const pendingToken = registerRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(user.id);

    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(phone);
    const correctCode = sentOtpCode;

    // Fail 5 times with incorrect codes
    for (let i = 1; i <= 5; i++) {
      const failRes = await verifyOtp(
        new Request("http://localhost:3000/api/auth/otp/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
            Cookie: `${OTP_COOKIE}=${pendingToken}`,
          },
          body: JSON.stringify({ code: "000000" }),
        }),
      );
      expect(failRes.status).toBe(400);

      const challenge = await prisma.authChallenge.findUniqueOrThrow({
        where: { tokenHash: digest(`token:${pendingToken}`) },
      });
      expect(challenge.attempts).toBe(i);
    }

    // 6th attempt with the CORRECT code is now blocked due to reached limit
    const lockedRes = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: correctCode }),
      }),
    );
    expect(lockedRes.status).toBe(400);
    const body = await lockedRes.json();
    expect(body.error).toContain("percobaan");
  });

  it("rejects expired OTP code (past 10 minutes lifespan)", async () => {
    const email = `expired-${randomUUID()}@example.test`;
    const phone = `0816${randomInt(10000000, 99999999)}`;
    const password = "ExpiredPassword123!";

    const registerRes = await register(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ name: "Expired Tester", email, phone, password }),
      }),
    );
    const pendingToken = registerRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(user.id);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Manually backdate codeExpiresAt by 15 minutes
    await prisma.authChallenge.update({
      where: { tokenHash: digest(`token:${pendingToken}`) },
      data: { codeExpiresAt: new Date(Date.now() - 15 * 60 * 1000) },
    });

    sentOtpCode = getOtpCode(phone);

    const expiredRes = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );

    expect(expiredRes.status).toBe(400);
    const body = await expiredRes.json();
    expect(body.error).toContain("kedaluwarsa");
  });

  it("enforces cross-session 60-second cooldown via reservePhoneCooldown", async () => {
    const dummyPhoneHash = digest(`phone:+62817${randomInt(10000000, 99999999)}`);

    // First reservation succeeds
    const firstReserve = await reservePhoneCooldown(dummyPhoneHash);
    expect(firstReserve).toBe(true);

    // Immediate second reservation fails due to active cooldown
    const secondReserve = await reservePhoneCooldown(dummyPhoneHash);
    expect(secondReserve).toBe(false);

    // Simulate expiration of cooldown
    await prisma.authRateLimit.update({
      where: { key: `otp-cooldown:${dummyPhoneHash}` },
      data: { expiresAt: new Date(Date.now() - 5000) },
    });

    // Reservation succeeds after cooldown expires
    const thirdReserve = await reservePhoneCooldown(dummyPhoneHash);
    expect(thirdReserve).toBe(true);
  });

  it("enforces phone rate limiting of 5 per hour and IP rate limiting of 100 per hour", async () => {
    const dummyPhoneHash = digest(`phone:+62818${randomInt(10000000, 99999999)}`);
    const dummyIp = `192.168.1.${randomInt(1, 250)}`;

    // Phone: first 5 succeed, 6th fails
    for (let i = 1; i <= 5; i++) {
      const allowed = await rateLimit("otp-phone", dummyPhoneHash, 5);
      expect(allowed).toBe(true);
    }
    const phoneLimited = await rateLimit("otp-phone", dummyPhoneHash, 5);
    expect(phoneLimited).toBe(false);

    // IP: first 100 succeed, 101st fails
    for (let i = 1; i <= 100; i++) {
      const allowed = await rateLimit("otp-ip", dummyIp, 100);
      expect(allowed).toBe(true);
    }
    const ipLimited = await rateLimit("otp-ip", dummyIp, 100);
    expect(ipLimited).toBe(false);
  });

  it("never logs plain OTP codes or raw challenge tokens", async () => {
    const logSpy = spyOn(console, "log");
    const infoSpy = spyOn(console, "info");
    const warnSpy = spyOn(console, "warn");
    const errorSpy = spyOn(console, "error");

    const email = `logging-${randomUUID()}@example.test`;
    const phone = `0819${randomInt(10000000, 99999999)}`;
    const password = "LoggingPassword123!";

    const registerRes = await register(
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
        body: JSON.stringify({ name: "Logging Tester", email, phone, password }),
      }),
    );
    const pendingToken = registerRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    createdUserIds.push(user.id);

    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(phone);
    const rawOtp = sentOtpCode;

    await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${pendingToken}`,
        },
        body: JSON.stringify({ code: rawOtp }),
      }),
    );

    // Check all recorded logs
    const allLogs = [
      ...logSpy.mock.calls,
      ...infoSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ]
      .flat()
      .map(String)
      .join(" ");

    expect(allLogs).not.toContain(rawOtp);
    expect(allLogs).not.toContain(pendingToken);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
