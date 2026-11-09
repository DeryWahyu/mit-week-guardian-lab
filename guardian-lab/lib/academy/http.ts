import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InputError } from "@/lib/investigations/request-input";
export function academyError(error: unknown) {
  if ((error as { digest?: string })?.digest?.startsWith("NEXT_")) throw error;
  if (error instanceof InputError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Isian kuis belum valid. Periksa pertanyaan, pilihan, dan kunci jawaban." },
      { status: 400 },
    );
  return NextResponse.json({ error: "Academy belum dapat diakses. Coba lagi." }, { status: 503 });
}
