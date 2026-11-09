import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { sandboxError } from "@/lib/sandbox/http";
import { sandboxState } from "@/lib/sandbox/session-manager";
import { safeConnection } from "@/lib/security/connection";
export async function GET(request: Request) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    return NextResponse.json(await sandboxState(auth.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return sandboxError(error);
  }
}
