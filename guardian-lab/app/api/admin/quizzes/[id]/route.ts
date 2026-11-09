import { NextResponse } from "next/server";
import { archiveQuiz, saveQuiz } from "@/lib/academy/admin";
import { academyError } from "@/lib/academy/http";
import { readQuizInput } from "@/lib/academy/quiz-input";
import { authorizeRequest } from "@/lib/auth/access";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    const { id } = await params;
    const { revision, input, thumbnail } = await readQuizInput(request, true);
    return NextResponse.json(await saveQuiz(input, id, revision, auth.user.id, thumbnail), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    const { id } = await params;
    return NextResponse.json(await archiveQuiz(id, auth.user.id));
  } catch (error) {
    return academyError(error);
  }
}
