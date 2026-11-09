import { NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/access";
import { digest, OTP_COOKIE, tokenFrom } from "@/lib/auth/otp/core";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    await destroySession(request);
    const pending = tokenFrom(request);
    if (pending)
      await prisma.authChallenge.deleteMany({ where: { tokenHash: digest(`token:${pending}`) } });

    const response = NextResponse.json({
      success: true,
      message: "Berhasil keluar dari akun.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(OTP_COOKIE);

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan internal pada server",
      },
      { status: 500 },
    );
  }
}
