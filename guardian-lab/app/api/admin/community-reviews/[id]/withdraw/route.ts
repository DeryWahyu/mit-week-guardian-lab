import { z } from "zod";
import { adminJson } from "@/lib/admin/http";
import { withdrawCommunityCase } from "@/lib/admin/moderation";
import { adminRoute } from "@/lib/admin/route";
import { readInput } from "@/lib/investigations/request-input";
import { adminReasonSchema } from "@/lib/validations/admin";
import { investigationIdSchema } from "@/lib/validations/investigation";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute(request, async (user) => {
    const input = z
      .object({ reason: adminReasonSchema })
      .strict()
      .parse(await readInput(request, 8192, "json"));
    return adminJson(
      await withdrawCommunityCase(
        user.id,
        investigationIdSchema.parse((await params).id),
        input.reason,
      ),
    );
  });
}
