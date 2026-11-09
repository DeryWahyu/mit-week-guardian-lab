import { NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOrigin } from "@/lib/auth/access";
import {
  clientKey,
  codeDigest,
  digest,
  getPending,
  OTP_COOKIE,
  pendingCookieOptions,
  rateLimit,
  tokenFrom,
} from "@/lib/auth/otp/core";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES } from "@/lib/routes";

const inputSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const input = inputSchema.safeParse(await readInput(request, 2048, "json"));
    if (!input.success)
      return NextResponse.json({ error: "Masukkan enam digit kode OTP." }, { status: 400 });
    if (!(await rateLimit("otp-verify-ip", clientKey(request), 300)))
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 },
      );
    const pendingToken = tokenFrom(request);
    const pending = await getPending(pendingToken);
    if (!pending || !["VERIFY", "RESET"].includes(pending.purpose))
      return NextResponse.json(
        { error: "Sesi verifikasi berakhir. Silakan mulai kembali." },
        { status: 401 },
      );
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const attempted = await tx.authChallenge.updateMany({
        where: {
          id: pending.id,
          purpose: pending.purpose,
          consumedAt: null,
          expiresAt: { gt: now },
          codeExpiresAt: { gt: now },
          attempts: { lt: 5 },
          codeHash: { not: null },
        },
        data: { attempts: { increment: 1 } },
      });
      if (!attempted.count) return null;
      const user = pending.userId
        ? await tx.user.findUnique({ where: { id: pending.userId } })
        : null;
      if (!user?.phone || digest(`phone:${user.phone}`) !== pending.phoneHash) return null;
      const codeHash = codeDigest(pending.tokenHash, pending.purpose, input.data.code);
      if (pending.purpose === "RESET") {
        const claimed = await tx.authChallenge.updateMany({
          where: {
            id: pending.id,
            purpose: "RESET",
            consumedAt: null,
            codeHash,
            codeExpiresAt: { gt: now },
          },
          data: {
            purpose: "RESET_READY",
            codeHash: null,
            codeExpiresAt: null,
            expiresAt: new Date(now.getTime() + 600000),
          },
        });
        return claimed.count ? { redirectTo: AUTH_ROUTES.resetPassword, token: null } : null;
      }
      const claimed = await tx.authChallenge.updateMany({
        where: {
          id: pending.id,
          purpose: "VERIFY",
          consumedAt: null,
          codeHash,
          codeExpiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (!claimed.count) return null;
      const matching = await tx.user.updateMany({
        where: { id: user.id, phone: user.phone, suspendedAt: null },
        data: { phoneVerifiedAt: now, lastActiveAt: now },
      });
      if (!matching.count) throw new Error("Nomor akun berubah");
      const updated = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      const sessionToken = await createSessionToken(updated, tx);
      return {
        redirectTo: getPostLoginRedirect(updated.role, pending.redirectTo),
        token: sessionToken,
      };
    });
    if (!result)
      return NextResponse.json(
        {
          error:
            "Kode salah, kedaluwarsa, atau batas percobaan tercapai. Minta kode baru jika perlu.",
        },
        { status: 400 },
      );
    const response = NextResponse.json(
      { success: true, redirectTo: result.redirectTo },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    if (result.token) {
      response.cookies.set(SESSION_COOKIE_NAME, result.token, getSessionCookieOptions());
      response.cookies.set(OTP_COOKIE, "", { ...pendingCookieOptions, maxAge: 0 });
    } else if (pendingToken) {
      response.cookies.set(OTP_COOKIE, pendingToken, { ...pendingCookieOptions, maxAge: 600 });
    }
    return response;
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json(
      { error: "Verifikasi belum dapat diproses. Coba lagi." },
      { status: 503 },
    );
  }
}
