import { NextResponse } from "next/server";
import { getPlatformOverview } from "@/lib/community/ranking";
import { safeConnection } from "@/lib/security/connection";
export async function GET() {
  await safeConnection();
  try {
    return NextResponse.json(await getPlatformOverview(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Statistik belum dapat dimuat." }, { status: 503 });
  }
}
