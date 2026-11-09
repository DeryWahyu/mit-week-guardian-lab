import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InputError } from "@/lib/investigations/request-input";
export function sandboxError(error: unknown) {
  if ((error as { digest?: string })?.digest?.startsWith("NEXT_")) throw error;
  if (error instanceof InputError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json({ error: "Isian sesi sandbox tidak valid." }, { status: 400 });
  return NextResponse.json(
    { error: "Sandbox belum dapat diakses. Periksa status sesi kembali." },
    { status: 503 },
  );
}
