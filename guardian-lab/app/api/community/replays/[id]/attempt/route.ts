import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { getCommunityChallenge, submitCommunityChallenge } from "@/lib/community/challenge";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { communityChallengeSubmissionSchema } from "@/lib/validations/community-challenge";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await getCommunityChallenge(id, auth.user.id);
    const input = communityChallengeSubmissionSchema.safeParse(
      await readInput(request, 16000, "json"),
    );
    if (!input.success)
      throw new InputError(
        "Isian latihan kasus tidak valid. Muat ulang lalu jawab seluruh pertanyaan.",
      );
    return NextResponse.json(await submitCommunityChallenge(id, auth.user.id, input.data), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return communityError(error);
  }
}
