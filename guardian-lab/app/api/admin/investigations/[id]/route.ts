import { adminJson } from "@/lib/admin/http";
import { adminInvestigationDetail, saveInvestigationReview } from "@/lib/admin/investigations";
import { adminRoute } from "@/lib/admin/route";
import { readInput } from "@/lib/investigations/request-input";
import { investigationReviewSchema } from "@/lib/validations/admin";
import { investigationIdSchema } from "@/lib/validations/investigation";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return adminRoute(request, async () =>
    adminJson(await adminInvestigationDetail(investigationIdSchema.parse((await params).id))),
  );
}
export async function PUT(request: Request, { params }: Context) {
  return adminRoute(request, async (user) =>
    adminJson(
      await saveInvestigationReview(
        user.id,
        investigationIdSchema.parse((await params).id),
        investigationReviewSchema.parse(await readInput(request, 16384, "json")),
      ),
    ),
  );
}
