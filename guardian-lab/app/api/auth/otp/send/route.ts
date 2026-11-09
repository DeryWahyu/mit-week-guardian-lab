import { after, NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/access";
import { getPending, tokenFrom } from "@/lib/auth/otp/core";
import { sendOtp } from "@/lib/auth/otp/send";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  try {
    const token = tokenFrom(request);
    const pending = await getPending(token);
    if (!pending || !token)
      return NextResponse.json(
        { error: "Sesi verifikasi berakhir. Silakan mulai kembali." },
        { status: 401 },
      );
    if (pending.purpose === "RESET") {
      after(async () => {
        try {
          await sendOtp(token, request);
        } catch {
          console.error("Pengiriman ulang kode pemulihan belum dapat diproses");
        }
      });
      return NextResponse.json(
        {
          success: true,
          message: "Jika nomor dapat dihubungi, kode sedang diproses. Periksa WhatsApp kamu.",
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const result = await sendOtp(token, request);
    if (!result.ok)
      return NextResponse.json(
        {
          error:
            result.reason === "cooldown"
              ? "Tunggu 60 detik sebelum meminta kode lagi."
              : result.reason === "limited"
                ? "Terlalu banyak permintaan. Silakan coba lagi nanti."
                : "Sesi verifikasi berakhir. Silakan mulai kembali.",
        },
        { status: result.reason === "expired" ? 401 : 429 },
      );
    if (pending.purpose === "VERIFY" && !result.queued)
      return NextResponse.json(
        { error: "Kode belum dapat dikirim. Coba kirim ulang setelah 60 detik." },
        { status: 503 },
      );
    return NextResponse.json(
      {
        success: true,
        message: "Jika nomor dapat dihubungi, kode sedang diproses. Periksa WhatsApp kamu.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Permintaan belum dapat diproses. Silakan coba lagi." },
      { status: 503 },
    );
  }
}
