import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { safeConnection } from "@/lib/security/connection";

export async function GET(request: Request) {
  await safeConnection();
  const user = await getCurrentUser(request);
  const headers = { "Cache-Control": "private, no-store" };
  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null, error: "Sesi tidak ditemukan atau telah kedaluwarsa" },
      { status: 401, headers },
    );
  }
  return NextResponse.json({ authenticated: true, ...user, user }, { headers });
}
