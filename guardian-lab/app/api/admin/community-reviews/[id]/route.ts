import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { communityError } from "@/lib/community/api";
import { reviewCommunityCase } from "@/lib/community/service";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { communityReviewSchema } from "@/lib/validations/community";
import { investigationIdSchema } from "@/lib/validations/investigation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) return auth.error;
    const id = investigationIdSchema.safeParse((await params).id);
    if (!id.success) throw new InputError("ID pengajuan tidak valid.");
    const input = communityReviewSchema.safeParse(await readInput(request, 8192, "json"));
    if (!input.success)
      throw new InputError(
        "Persetujuan memerlukan konfirmasi privasi. Setiap keputusan memerlukan alasan minimal 10 karakter.",
      );
    return NextResponse.json(await reviewCommunityCase(id.data, auth.user.id, input.data));
  } catch (error) {
    return communityError(error);
  }
}
