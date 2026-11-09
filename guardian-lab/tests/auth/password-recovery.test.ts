import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { randomInt, randomUUID } from "node:crypto";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as forgotPassword } from "@/app/api/auth/password/forgot/route";
import { POST as resetPassword } from "@/app/api/auth/password/reset/route";
import { digest, OTP_COOKIE } from "@/lib/auth/otp/core";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES } from "@/lib/routes";
import { clearOtpDeliveries, getOtpCode } from "../helpers/otp-delivery";

describe("AUTH-UI-03 & AUTH-OTP-01..04: Password Recovery Lifecycle", () => {
  let sentOtpCode = "";

  const testPhone = `+62812${randomInt(10000000, 99999999)}`;
  const testEmail = `recovery-${randomUUID()}@example.test`;
  const initialPassword = "OldPassword123!";
  let userId = "";

  beforeEach(async () => {
    clearOtpDeliveries();
    await prisma.authChallenge.deleteMany({ where: { userId } });
    await prisma.authRateLimit.deleteMany({
      where: { key: { contains: digest(`phone:${testPhone}`) } },
    });
  });

  // The account is created once so reset tests can verify session invalidation.
  async function createRecoveryUser() {
    const user = await prisma.user.create({
      data: {
        name: "Recovery Candidate",
        email: testEmail,
        phone: testPhone,
        phoneVerifiedAt: new Date(),
        passwordHash: await hashPassword(initialPassword),
        role: "USER",
      },
    });
    userId = user.id;
  }

  beforeEach(async () => {
    if (!userId) await createRecoveryUser();
  });

  afterAll(async () => {
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.authChallenge.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });

  it("returns an identical generic response for both registered and unregistered phones", async () => {
    const unregisteredPhone = `+62819${randomInt(10000000, 99999999)}`;

    // 1. Request with registered phone
    const registeredRes = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: testPhone }),
      }),
    );

    expect(registeredRes.status).toBe(200);
    const regBody = await registeredRes.json();
    expect(regBody.success).toBe(true);
    expect(regBody.redirectTo).toBe(AUTH_ROUTES.otp);
    expect(regBody.message).toBe("Jika nomor terdaftar dan dapat dihubungi, kode sedang diproses.");
    expect(registeredRes.headers.get("set-cookie")).toContain(OTP_COOKIE);

    // 2. Request with unregistered phone
    const unregisteredRes = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: unregisteredPhone }),
      }),
    );

    expect(unregisteredRes.status).toBe(200);
    const unregBody = await unregisteredRes.json();
    expect(unregBody.success).toBe(true);
    expect(unregBody.redirectTo).toBe(AUTH_ROUTES.otp);
    expect(unregBody.message).toBe(
      "Jika nomor terdaftar dan dapat dihubungi, kode sedang diproses.",
    );
    expect(unregisteredRes.headers.get("set-cookie")).toContain(OTP_COOKIE);
  });

  it("rejects malformed phone numbers with 400 Bad Request", async () => {
    const response = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: "not-a-phone-number" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("nomor WhatsApp");
  });

  it("transitions challenge to RESET_READY upon valid OTP verification", async () => {
    // Initiate forgot password
    const forgotRes = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: testPhone }),
      }),
    );

    expect(forgotRes.status).toBe(200);
    const setCookie = forgotRes.headers.get("set-cookie") || "";
    const pendingTokenMatch = setCookie.match(new RegExp(`${OTP_COOKIE}=([^;]+)`));
    expect(pendingTokenMatch).toBeTruthy();
    const pendingToken = pendingTokenMatch![1];

    // Wait for asynchronous OTP dispatch to complete and capture code
    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(testPhone);
    expect(sentOtpCode).toMatch(/^\d{6}$/);

    // Verify code
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
    expect(verifyBody.redirectTo).toBe(AUTH_ROUTES.resetPassword);

    // Verify challenge in DB has transitioned to RESET_READY
    const updatedChallenge = await prisma.authChallenge.findFirstOrThrow({
      where: { userId, purpose: "RESET_READY" },
    });
    expect(updatedChallenge.purpose).toBe("RESET_READY");
    expect(updatedChallenge.codeHash).toBeNull();
    expect(updatedChallenge.consumedAt).toBeNull();
  });

  it("enforces password policy rules and byte limit on /api/auth/password/reset", async () => {
    // 1. Initiate forgot password and complete OTP verification to reach RESET_READY
    const forgotRes = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: testPhone }),
      }),
    );
    const token = forgotRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];

    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(testPhone);
    expect(sentOtpCode).toMatch(/^\d{6}$/);

    const verifyRes = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${token}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );
    expect(verifyRes.status).toBe(200);

    const attemptReset = async (password: string, confirmPassword: string) => {
      return resetPassword(
        new Request("http://localhost:3000/api/auth/password/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
            Cookie: `${OTP_COOKIE}=${token}`,
          },
          body: JSON.stringify({ password, confirmPassword }),
        }),
      );
    };

    // 1. Too short (< 8 chars)
    const shortRes = await attemptReset("Ab1!", "Ab1!");
    expect(shortRes.status).toBe(400);

    // 2. Missing numbers
    const noNumRes = await attemptReset("LettersOnlyHere!", "LettersOnlyHere!");
    expect(noNumRes.status).toBe(400);

    // 3. Exceeding bcrypt 72 byte limit
    const tooLong = `A1${"a".repeat(71)}`;
    const longRes = await attemptReset(tooLong, tooLong);
    expect(longRes.status).toBe(400);

    // 4. Mismatched confirmPassword
    const mismatchRes = await attemptReset("ValidPass123!", "MismatchPass123!");
    expect(mismatchRes.status).toBe(400);
  });

  it("successfully updates password, invalidates all prior sessions and challenges, and rejects replay", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // 1. Create two active sessions for the user prior to reset
    const activeSessionToken1 = await createSessionToken(user);
    const activeSessionToken2 = await createSessionToken(user);
    expect(await prisma.session.count({ where: { userId } })).toBeGreaterThanOrEqual(2);

    // 2. Complete flow: forgot password -> OTP verify
    const forgotRes = await forgotPassword(
      new Request("http://localhost:3000/api/auth/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ phone: testPhone }),
      }),
    );
    const token = forgotRes.headers
      .get("set-cookie")!
      .match(new RegExp(`${OTP_COOKIE}=([^;]+)`))![1];

    await new Promise((resolve) => setTimeout(resolve, 50));
    sentOtpCode = getOtpCode(testPhone);
    expect(sentOtpCode).toMatch(/^\d{6}$/);

    const verifyRes = await verifyOtp(
      new Request("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${token}`,
        },
        body: JSON.stringify({ code: sentOtpCode }),
      }),
    );
    expect(verifyRes.status).toBe(200);

    // 3. Submit valid new password
    const newPassword = "BrandNewPassword2026!";
    const resetRes = await resetPassword(
      new Request("http://localhost:3000/api/auth/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${token}`,
        },
        body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
      }),
    );

    expect(resetRes.status).toBe(200);
    const body = await resetRes.json();
    expect(body.success).toBe(true);
    expect(body.redirectTo).toContain("/login");

    // Cookies must be cleared
    const cookieHeader = resetRes.headers.get("set-cookie") || "";
    expect(cookieHeader).toContain(`${OTP_COOKIE}=;`);
    expect(cookieHeader).toContain(`${SESSION_COOKIE_NAME}=;`);

    // 4. Verify password was updated in DB and matches newPassword
    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword(newPassword, updatedUser.passwordHash)).toBe(true);
    expect(await verifyPassword(initialPassword, updatedUser.passwordHash)).toBe(false);

    // 5. Invalidation check: All old sessions must be revoked from database
    const sessionCount = await prisma.session.count({ where: { userId } });
    expect(sessionCount).toBe(0);

    // Session tokens can no longer authenticate
    const session1User = await getCurrentUser(
      new Request("http://localhost:3000", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${activeSessionToken1}` },
      }),
    );
    expect(session1User).toBeNull();
    const session2User = await getCurrentUser(
      new Request("http://localhost:3000", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${activeSessionToken2}` },
      }),
    );
    expect(session2User).toBeNull();

    // 6. Invalidation check: All challenges for the user are deleted
    const remainingChallenges = await prisma.authChallenge.count({ where: { userId } });
    expect(remainingChallenges).toBe(0);

    // 7. Replay prevention: submitting reset again with the same token is rejected
    const replayRes = await resetPassword(
      new Request("http://localhost:3000/api/auth/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Cookie: `${OTP_COOKIE}=${token}`,
        },
        body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
      }),
    );
    expect(replayRes.status).toBe(401);
  });
});
