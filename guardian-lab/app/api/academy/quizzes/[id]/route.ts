import { NextResponse } from "next/server";
import { academyError } from "@/lib/academy/http";
import { quizDetail } from "@/lib/academy/quiz";
import { authorizeRequest } from "@/lib/auth/access";
import { safeConnection } from "@/lib/security/connection";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    return NextResponse.json(await quizDetail(id, auth.user.id, auth.user.role === "ADMIN"), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
