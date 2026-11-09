import { NextResponse } from "next/server";
import { InputError } from "@/lib/investigations/request-input";

export function communityError(error: unknown) {
  if (error instanceof InputError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "digest" in error) throw error;
  console.error("Community request failed.");
  return NextResponse.json(
    { error: "Permintaan komunitas belum berhasil. Silakan coba lagi." },
    { status: 500 },
  );
}
