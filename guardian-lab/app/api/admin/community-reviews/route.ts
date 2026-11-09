import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { listCommunityCases } from "@/lib/community/queries";
import { safeConnection } from "@/lib/security/connection";

export async function GET(request: Request) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    return NextResponse.json(await listCommunityCases(request, auth.user, true), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return communityError(error);
  }
}
