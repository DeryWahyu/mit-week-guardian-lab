import { adminJson } from "@/lib/admin/http";
import { listAdminInvestigations } from "@/lib/admin/investigations";
import { adminRoute } from "@/lib/admin/route";
import { adminInvestigationQuerySchema } from "@/lib/validations/admin";
export async function GET(request: Request) {
  return adminRoute(request, async () =>
    adminJson(
      await listAdminInvestigations(
        adminInvestigationQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)),
      ),
    ),
  );
}
