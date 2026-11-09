import { adminJson } from "@/lib/admin/http";
import { adminRoute } from "@/lib/admin/route";
import { changeUser, userDetail } from "@/lib/admin/users";
import { readInput } from "@/lib/investigations/request-input";
import { userActionSchema } from "@/lib/validations/admin";
import { investigationIdSchema } from "@/lib/validations/investigation";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return adminRoute(request, async () =>
    adminJson(await userDetail(investigationIdSchema.parse((await params).id))),
  );
}
export async function PUT(request: Request, { params }: Context) {
  return adminRoute(request, async (user) =>
    adminJson(
      await changeUser(
        user.id,
        investigationIdSchema.parse((await params).id),
        userActionSchema.parse(await readInput(request, 16384, "json")),
      ),
    ),
  );
}
