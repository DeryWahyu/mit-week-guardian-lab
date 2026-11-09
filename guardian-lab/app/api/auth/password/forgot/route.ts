import { after, NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOrigin } from "@/lib/auth/access";
import {
  clientKey,
  createPending,
  OTP_COOKIE,
  pendingCookieOptions,
  rateLimit,
} from "@/lib/auth/otp/core";
import { sendOtp } from "@/lib/auth/otp/send";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl, phoneSchema } from "@/lib/validations/auth";

const inputSchema = z.object({ phone: phoneSchema, redirect: z.string().optional() });
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const input = inputSchema.safeParse(await readInput(request, 2048, "json"));
    if (!input.success)
      return NextResponse.json({ error: "Masukkan nomor WhatsApp yang valid." }, { status: 400 });
    if (!(await rateLimit("forgot-ip", clientKey(request), 100)))
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 },
      );
    const user = await prisma.user.findUnique({
      where: { phone: input.data.phone },
      select: { id: true },
    });
    const target = getSafeRedirectUrl(input.data.redirect, PUBLIC_ROUTES.home);
    const token = await createPending(user?.id ?? null, input.data.phone, "RESET", target);
    after(async () => {
      try {
        await sendOtp(token, request);
      } catch {
        console.error("Pengiriman kode pemulihan belum dapat diproses");
      }
    });
    const response = NextResponse.json(
      {
        success: true,
        redirectTo: AUTH_ROUTES.otp,
        message: "Jika nomor terdaftar dan dapat dihubungi, kode sedang diproses.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(OTP_COOKIE, token, pendingCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json(
      { error: "Permintaan belum dapat diproses. Coba lagi." },
      { status: 503 },
    );
  }
}
