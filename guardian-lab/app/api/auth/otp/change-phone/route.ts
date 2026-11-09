import { NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOrigin } from "@/lib/auth/access";
import { clientKey, digest, getPending, rateLimit, tokenFrom } from "@/lib/auth/otp/core";
import { sendOtp } from "@/lib/auth/otp/send";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { AUTH_ROUTES } from "@/lib/routes";
import { phoneSchema } from "@/lib/validations/auth";

const schema = z.object({ phone: phoneSchema });
export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const input = schema.safeParse(await readInput(request, 2048, "json"));
    if (!input.success)
      return NextResponse.json({ error: "Masukkan nomor WhatsApp yang valid." }, { status: 400 });
    const token = tokenFrom(request);
    const pending = await getPending(token);
    if (
      !token ||
      !pending ||
      pending.purpose !== "VERIFY" ||
      !pending.user?.phone ||
      pending.user.phoneVerifiedAt
    )
      return NextResponse.json(
        { error: "Sesi verifikasi berakhir. Silakan masuk kembali." },
        { status: 401 },
      );
    if (!(await rateLimit("change-phone-ip", clientKey(request), 30)))
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 },
      );
    const userId = pending.user.id;
    const oldPhone = pending.user.phone;
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.authChallenge.updateMany({
        where: { id: pending.id, purpose: "VERIFY", consumedAt: null, expiresAt: { gt: now } },
        data: {
          phoneHash: digest(`phone:${input.data.phone}`),
          codeHash: null,
          codeExpiresAt: null,
          deliveryStatus: null,
          lastSentAt: null,
          attempts: 0,
        },
      });
      if (!claimed.count) throw new Error("Sesi tidak aktif");
      const updated = await tx.user.updateMany({
        where: { id: userId, phone: oldPhone, phoneVerifiedAt: null },
        data: { phone: input.data.phone },
      });
      if (!updated.count) throw new Error("Nomor akun berubah");
      await tx.authChallenge.updateMany({
        where: { userId, id: { not: pending.id }, consumedAt: null },
        data: { consumedAt: now },
      });
    });
    const result = await sendOtp(token, request);
    return NextResponse.json(
      {
        success: true,
        redirectTo: AUTH_ROUTES.otp,
        message:
          result.ok && result.queued
            ? "Nomor diperbarui. Kode sedang diproses."
            : "Nomor diperbarui. Kode belum dapat dikirim; coba kirim ulang setelah jeda.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar." }, { status: 409 });
    return NextResponse.json(
      { error: "Nomor atau kode belum dapat diproses. Kembali ke verifikasi atau masuk kembali." },
      { status: 503 },
    );
  }
}
