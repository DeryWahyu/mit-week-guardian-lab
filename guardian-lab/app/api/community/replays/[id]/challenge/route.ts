import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { getCommunityChallenge } from "@/lib/community/challenge";
import { safeConnection } from "@/lib/security/connection";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await safeConnection();
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(await getCommunityChallenge((await params).id, auth.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return communityError(error);
  }
}
