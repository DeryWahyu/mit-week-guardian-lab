import { createHmac, randomBytes, randomInt } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const OTP_COOKIE = "guardian_auth_pending";
const HOUR = 60 * 60 * 1000;
export const pendingCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 60,
};

function secret() {
  const value = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (!value || value.length < 32 || value.startsWith("your_session_secret"))
    throw new Error("SESSION_SECRET belum dikonfigurasi");
  return value;
}
export function digest(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function tokenFrom(request: Request) {
  return new NextRequest(request.url, { headers: request.headers }).cookies.get(OTP_COOKIE)?.value;
}
export function clientKey(request: Request) {
  if (process.env.AUTH_TRUST_PROXY !== "true") return "shared";
  const value = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return value && value.length <= 64 ? value : "shared";
}
export async function rateLimit(scope: string, value: string, limit: number) {
  const now = Date.now();
  const bucket = Math.floor(now / HOUR);
  const key = `${scope}:${digest(value)}:${bucket}`;
  const row = await prisma.authRateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((bucket + 2) * HOUR) },
    update: { count: { increment: 1 } },
  });
  if (randomInt(100) === 0)
    await Promise.all([
      prisma.authRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.authChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    ]);
  return row.count <= limit;
}
export async function reservePhoneCooldown(phoneHash: string) {
  const key = `otp-cooldown:${phoneHash}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60000);
  try {
    await prisma.authRateLimit.create({ data: { key, count: 1, expiresAt } });
    return true;
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002")
      throw error;
    const reserved = await prisma.authRateLimit.updateMany({
      where: { key, expiresAt: { lte: now } },
      data: { count: 1, expiresAt },
    });
    return reserved.count === 1;
  }
}
export async function createPending(
  userId: string | null,
  phone: string,
  purpose: "VERIFY" | "RESET",
  redirectTo = "/",
) {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction(async (tx) => {
    if (userId)
      await tx.authChallenge.updateMany({
        where: { userId, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
    await tx.authChallenge.create({
      data: {
        tokenHash: digest(`token:${token}`),
        userId,
        phoneHash: digest(`phone:${phone}`),
        purpose,
        redirectTo,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  });
  return token;
}
export async function getPending(token: string | undefined) {
  if (!token || token.length > 100) return null;
  const pending = await prisma.authChallenge.findFirst({
    where: { tokenHash: digest(`token:${token}`), consumedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  return pending?.user?.suspendedAt ? null : pending;
}
export function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}••••••${phone.slice(-3)}`;
}
export function codeDigest(tokenHash: string, purpose: string, code: string) {
  return digest(`otp:${tokenHash}:${purpose}:${code}`);
}
