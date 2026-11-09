import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { readInput } from "@/lib/investigations/request-input";
import { sandboxError } from "@/lib/sandbox/http";
import { stopSandboxSession } from "@/lib/sandbox/session-manager";
import { sandboxStopSchema } from "@/lib/validations/sandbox";
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const body = sandboxStopSchema.parse(await readInput(request, 1000, "json"));
    const result = await stopSandboxSession(body.sessionId, auth.user);
    return result
      ? NextResponse.json(result)
      : NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  } catch (error) {
    return sandboxError(error);
  }
}
