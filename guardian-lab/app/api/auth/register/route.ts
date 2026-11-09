import { NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/access";
import {
  clientKey,
  createPending,
  OTP_COOKIE,
  pendingCookieOptions,
  rateLimit,
} from "@/lib/auth/otp/core";
import { sendOtp } from "@/lib/auth/otp/send";
import { hashPassword } from "@/lib/auth/password";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl, registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const result = registerSchema.safeParse(await readInput(request, 16384, "json"));
    if (!result.success)
      return NextResponse.json(
        { error: "Validasi data gagal", details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    if (!(await rateLimit("register-ip", clientKey(request), 100)))
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 },
      );
    const { name, email, password, phone } = result.data;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { email: true, phone: true },
    });
    if (existing)
      return NextResponse.json(
        {
          error:
            existing.email === email ? "Email sudah terdaftar." : "Nomor WhatsApp sudah terdaftar.",
          field: existing.email === email ? "email" : "phone",
        },
        { status: 409 },
      );
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: "USER", exp: 0, streakDays: 0 },
    });
    const target = getSafeRedirectUrl(result.data.redirect, PUBLIC_ROUTES.home);
    const token = await createPending(user.id, phone, "VERIFY", target);
    const sent = await sendOtp(token, request);
    const response = NextResponse.json(
      {
        success: true,
        status: "verification_required",
        redirectTo: AUTH_ROUTES.otp,
        deliveryQueued: sent.ok && sent.queued,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(OTP_COOKIE, token, pendingCookieOptions);
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...getSessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return NextResponse.json(
        { error: "Email atau nomor WhatsApp sudah terdaftar." },
        { status: 409 },
      );
    return NextResponse.json(
      {
        error:
          "Pendaftaran belum dapat diproses. Jika akun sudah dibuat, coba masuk untuk melanjutkan verifikasi.",
      },
      { status: 503 },
    );
  }
}
