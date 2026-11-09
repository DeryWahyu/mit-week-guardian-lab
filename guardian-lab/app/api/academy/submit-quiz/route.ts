import { NextResponse } from "next/server";
import { academyError } from "@/lib/academy/http";
import { submitQuiz } from "@/lib/academy/submit";
import { authorizeRequest } from "@/lib/auth/access";
import { readInput } from "@/lib/investigations/request-input";
import { quizSubmissionSchema } from "@/lib/validations/academy";
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const input = quizSubmissionSchema.parse(await readInput(request, 32000, "json"));
    return NextResponse.json(await submitQuiz(auth.user.id, input), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return academyError(error);
  }
}
