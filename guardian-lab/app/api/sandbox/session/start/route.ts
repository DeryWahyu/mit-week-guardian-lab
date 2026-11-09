import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { readInput } from "@/lib/investigations/request-input";
import { sandboxError } from "@/lib/sandbox/http";
import { startSandboxSession } from "@/lib/sandbox/session-manager";
import { sandboxStartSchema } from "@/lib/validations/sandbox";
export const maxDuration = 70;
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const body = sandboxStartSchema.parse(await readInput(request, 18000, "json"));
    return NextResponse.json(
      await startSandboxSession(body.type, body.target, auth.user.id, body.sessionId, {
        ...body,
        role: auth.user.role,
      }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return sandboxError(error);
  }
}
