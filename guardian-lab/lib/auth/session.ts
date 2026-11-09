import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { learningStreak } from "@/lib/academy/streak";
import { prisma } from "@/lib/prisma";
import { signSessionToken, verifySessionToken } from "./jwt";

export const SESSION_COOKIE_NAME = "guardian_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  exp: number;
  streakDays: number;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSessionToken(
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
    phone: string | null;
    phoneVerifiedAt: Date | null;
    suspendedAt?: Date | null;
  },
  database: Pick<Prisma.TransactionClient, "session"> = prisma,
): Promise<string> {
  if (!user.phone || !user.phoneVerifiedAt) throw new Error("Nomor WhatsApp belum diverifikasi");
  if (user.suspendedAt) throw new Error("Akun sedang ditangguhkan");
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await database.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return token;
}

export function readSessionToken(request: Request): string | undefined {
  return new NextRequest(request.url, { headers: request.headers }).cookies.get(SESSION_COOKIE_NAME)
    ?.value;
}

export async function getCurrentUser(request?: Request): Promise<UserSession | null> {
  try {
    const token = request
      ? readSessionToken(request)
      : (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // 1. Verify cryptographic integrity of JWT
    const payload = await verifySessionToken(token);
    if (!payload?.userId) {
      return null;
    }

    // 2. Query session table directly to enforce server-side revocation and expiration
    const dbSession = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            phoneVerifiedAt: true,
            suspendedAt: true,
            exp: true,
            streakDays: true,
            lastLearningAt: true,
          },
        },
      },
    });

    // Check if session exists in DB, is not expired, and matches user
    if (
      !dbSession ||
      dbSession.expiresAt <= new Date() ||
      !dbSession.user ||
      !dbSession.user.phone ||
      !dbSession.user.phoneVerifiedAt ||
      dbSession.user.suspendedAt ||
      dbSession.user.id !== payload.userId
    ) {
      return null;
    }

    const user = dbSession.user;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: user.exp,
      streakDays: learningStreak(user.streakDays, user.lastLearningAt),
    };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return null;
  }
}

export async function requireAuth(expectedRole?: "ADMIN" | "USER"): Promise<UserSession> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new Error(`Forbidden: Insufficient privileges, expected role ${expectedRole}`);
  }

  return user;
}

export async function requireAdmin(): Promise<UserSession> {
  return requireAuth("ADMIN");
}

export async function destroySession(request: Request): Promise<void> {
  const token = readSessionToken(request);
  if (token) await prisma.session.deleteMany({ where: { token } });
}
