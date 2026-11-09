import { listAudit } from "@/lib/admin/audit";
import { adminJson } from "@/lib/admin/http";
import { adminRoute } from "@/lib/admin/route";
import { adminQuerySchema } from "@/lib/validations/admin";
export async function GET(request: Request) {
  return adminRoute(request, async () =>
    adminJson(
      await listAudit(
        adminQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)),
      ),
    ),
  );
}
