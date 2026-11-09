import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { submissionPreview, submitCommunityCase } from "@/lib/community/service";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { safeConnection } from "@/lib/security/connection";
import { communitySubmitSchema } from "@/lib/validations/community";
import { investigationIdSchema } from "@/lib/validations/investigation";

export async function GET(request: Request) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const id = investigationIdSchema.safeParse(
      new URL(request.url).searchParams.get("investigationId"),
    );
    if (!id.success) throw new InputError("ID investigasi tidak valid.");
    return NextResponse.json(await submissionPreview(id.data, auth.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return communityError(error);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const input = communitySubmitSchema.safeParse(await readInput(request, 4096, "json"));
    if (!input.success)
      throw new InputError("Pilih investigasi dan setujui pengajuan untuk ditinjau admin.");
    const result = await submitCommunityCase(input.data.investigationId, auth.user.id);
    return NextResponse.json(result.record, { status: result.created ? 201 : 200 });
  } catch (error) {
    return communityError(error);
  }
}
