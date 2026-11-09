import { NextResponse } from "next/server";
import { z } from "zod";
import { InputError } from "@/lib/investigations/request-input";
export function adminJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}
export function adminError(error: unknown) {
  if (error && typeof error === "object" && "digest" in error) throw error;
  if (error instanceof InputError) return adminJson({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return adminJson({ error: error.issues[0]?.message ?? "Data atau filter tidak valid." }, 400);
  if (error && typeof error === "object" && "code" in error && error.code === "P2034")
    return adminJson({ error: "Data sedang berubah. Muat ulang dan coba lagi." }, 409);
  return adminJson({ error: "Layanan admin belum dapat memproses permintaan. Coba kembali." }, 503);
}
