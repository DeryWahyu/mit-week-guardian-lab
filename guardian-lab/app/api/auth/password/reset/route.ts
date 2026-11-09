import { NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOrigin } from "@/lib/auth/access";
import {
  digest,
  getPending,
  OTP_COOKIE,
  pendingCookieOptions,
  tokenFrom,
} from "@/lib/auth/otp/core";
import { hashPassword } from "@/lib/auth/password";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES } from "@/lib/routes";
import { newPasswordSchema } from "@/lib/validations/auth";

const inputSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok",
  });
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const input = inputSchema.safeParse(await readInput(request, 4096, "json"));
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues[0]?.message || "Password tidak valid." },
        { status: 400 },
      );
    const pending = await getPending(tokenFrom(request));
    if (
      !pending ||
      pending.purpose !== "RESET_READY" ||
      !pending.user?.phone ||
      digest(`phone:${pending.user.phone}`) !== pending.phoneHash
    )
      return NextResponse.json(
        { error: "Sesi reset berakhir. Mulai kembali dari lupa password." },
        { status: 401 },
      );
    const userId = pending.user.id;
    const phone = pending.user.phone;
    const passwordHash = await hashPassword(input.data.password);
    const now = new Date();
    const verifiedAt = pending.user.phoneVerifiedAt ?? now;
    const changed = await prisma.$transaction(async (tx) => {
      const claim = await tx.authChallenge.updateMany({
        where: { id: pending.id, purpose: "RESET_READY", consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (!claim.count) return false;
      const updated = await tx.user.updateMany({
        where: { id: userId, phone, suspendedAt: null },
        data: { passwordHash, phoneVerifiedAt: verifiedAt },
      });
      if (!updated.count) throw new Error("Nomor akun berubah");
      await tx.session.deleteMany({ where: { userId } });
      await tx.authChallenge.deleteMany({ where: { userId } });
      return true;
    });
    if (!changed)
      return NextResponse.json(
        { error: "Sesi reset berakhir. Mulai kembali dari lupa password." },
        { status: 401 },
      );
    const response = NextResponse.json(
      { success: true, redirectTo: AUTH_ROUTES.loginWithRedirect(pending.redirectTo) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(OTP_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...getSessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Password belum dapat diubah. Coba lagi." }, { status: 503 });
  }
}
