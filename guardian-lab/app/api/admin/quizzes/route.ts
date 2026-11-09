import { NextResponse } from "next/server";
import { adminQuizzes, saveQuiz } from "@/lib/academy/admin";
import { academyError } from "@/lib/academy/http";
import { readQuizInput } from "@/lib/academy/quiz-input";
import { authorizeRequest } from "@/lib/auth/access";
import { safeConnection } from "@/lib/security/connection";
import { adminQuizPageSchema } from "@/lib/validations/academy";
export async function GET(request: Request) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    const page = adminQuizPageSchema.parse(
      new URL(request.url).searchParams.get("page") ?? undefined,
    );
    return NextResponse.json(await adminQuizzes(page), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    const { input, thumbnail } = await readQuizInput(request);
    return NextResponse.json(await saveQuiz(input, undefined, undefined, auth.user.id, thumbnail), {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
