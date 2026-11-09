import { NextResponse } from "next/server";
import { getPending, maskPhone, tokenFrom } from "@/lib/auth/otp/core";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const pending = await getPending(tokenFrom(request));
  if (!pending)
    return NextResponse.json(
      { error: "Sesi verifikasi berakhir. Silakan mulai kembali." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  const cooldown = await prisma.authRateLimit.findUnique({
    where: { key: `otp-cooldown:${pending.phoneHash}` },
  });
  return NextResponse.json(
    {
      purpose: pending.purpose,
      maskedPhone:
        pending.purpose === "VERIFY" && pending.user?.phone ? maskPhone(pending.user.phone) : null,
      deliveryStatus: pending.purpose === "VERIFY" ? pending.deliveryStatus : null,
      resendAt: cooldown?.expiresAt.toISOString() || null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
