import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { getCommunityCase } from "@/lib/community/queries";
import { InputError } from "@/lib/investigations/request-input";
import { safeConnection } from "@/lib/security/connection";
import { investigationIdSchema } from "@/lib/validations/investigation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await safeConnection();
  try {
    const auth = await authorizeRequest(request);
    if (auth.error) return auth.error;
    const id = investigationIdSchema.safeParse((await params).id);
    if (!id.success) throw new InputError("ID kasus tidak valid.");
    return NextResponse.json(await getCommunityCase(id.data, auth.user), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return communityError(error);
  }
}
