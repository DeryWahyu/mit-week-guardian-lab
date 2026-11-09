import { NextResponse } from "next/server";
import { academyError } from "@/lib/academy/http";
import { quizList } from "@/lib/academy/quiz";
import { authorizeRequest } from "@/lib/auth/access";
import { safeConnection } from "@/lib/security/connection";
export async function GET(request: Request) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    return NextResponse.json(await quizList(auth.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
