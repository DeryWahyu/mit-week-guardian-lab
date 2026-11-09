import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth/access";
import { analyzeSandboxDownload } from "@/lib/sandbox/analyze-download";
import { sandboxError } from "@/lib/sandbox/http";
export const maxDuration = 70;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; downloadId: string }> },
) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  try {
    const { id, downloadId } = z.object({ id: z.uuid(), downloadId: z.uuid() }).parse(await params);
    const result = await analyzeSandboxDownload(id, downloadId, auth.user.id, request.signal);
    return NextResponse.json(result.record, {
      status: result.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return sandboxError(error);
  }
}
