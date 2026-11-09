import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { getInvestigationHistory } from "@/lib/investigations/history";
import { historyQuerySchema } from "@/lib/validations/history";

export async function GET(request: Request) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  const parsed = historyQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          parsed.error.issues.find((issue) => issue.code === "custom")?.message ??
          "Filter riwayat tidak valid. Periksa tanggal atau nomor halaman.",
      },
      { status: 400 },
    );
  try {
    return NextResponse.json(await getInvestigationHistory(auth.user, parsed.data), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Riwayat gagal dimuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
