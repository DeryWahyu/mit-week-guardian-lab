import { NextResponse } from "next/server";
import { learningStreak } from "@/lib/academy/streak";
import { rejectCrossOrigin } from "@/lib/auth/access";
import {
  clientKey,
  createPending,
  OTP_COOKIE,
  pendingCookieOptions,
  rateLimit,
} from "@/lib/auth/otp/core";
import { sendOtp } from "@/lib/auth/otp/send";
import { verifyPassword } from "@/lib/auth/password";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl, loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const result = loginSchema.safeParse(await readInput(request, 16384, "json"));
    if (!result.success)
      return NextResponse.json(
        { error: "Validasi data gagal", details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    const [ipAllowed, accountAllowed] = await Promise.all([
      rateLimit("login-ip", clientKey(request), 300),
      rateLimit("login-account", result.data.email, 20),
    ]);
    if (!ipAllowed || !accountAllowed)
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 },
      );
    const user = await prisma.user.findUnique({ where: { email: result.data.email } });
    if (!user || !(await verifyPassword(result.data.password, user.passwordHash)))
      return NextResponse.json({ error: "Email atau password tidak sesuai" }, { status: 401 });
    if (user.suspendedAt)
      return NextResponse.json(
        { error: "Akun sedang ditangguhkan. Hubungi pengelola untuk bantuan akses." },
        { status: 403 },
      );
    if (!user.phoneVerifiedAt) {
      if (!user.phone)
        return NextResponse.json(
          { error: "Akun belum memiliki nomor WhatsApp. Hubungi pengelola untuk bantuan akses." },
          { status: 403 },
        );
      const target = getSafeRedirectUrl(result.data.redirect, PUBLIC_ROUTES.home);
      const token = await createPending(user.id, user.phone, "VERIFY", target);
      const sent = await sendOtp(token, request);
      const response = NextResponse.json(
        {
          success: true,
          status: "verification_required",
          redirectTo: AUTH_ROUTES.otp,
          deliveryQueued: sent.ok && sent.queued,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
      response.cookies.set(OTP_COOKIE, token, pendingCookieOptions);
      response.cookies.set(SESSION_COOKIE_NAME, "", { ...getSessionCookieOptions(), maxAge: 0 });
      return response;
    }
    const now = new Date();
    const resultSession = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: {
          id: user.id,
          passwordHash: user.passwordHash,
          phoneVerifiedAt: { not: null },
          suspendedAt: null,
        },
        data: { lastActiveAt: now },
      });
      if (!updated.count) return null;
      const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      return { user: current, token: await createSessionToken(current, tx) };
    });
    if (!resultSession)
      return NextResponse.json(
        { error: "Sesi akun berubah. Silakan masuk kembali." },
        { status: 401 },
      );
    const current = resultSession.user;
    const userProfile = {
      id: current.id,
      email: current.email,
      name: current.name,
      role: current.role,
      exp: current.exp,
      streakDays: learningStreak(current.streakDays, current.lastLearningAt),
    };
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        user: userProfile,
        redirectTo: getPostLoginRedirect(current.role, result.data.redirect),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(SESSION_COOKIE_NAME, resultSession.token, getSessionCookieOptions());
    response.cookies.set(OTP_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Login belum dapat diproses. Coba lagi." }, { status: 503 });
  }
}
