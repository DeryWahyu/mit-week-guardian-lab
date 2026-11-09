import { adminJson } from "@/lib/admin/http";
import { getAdminReport } from "@/lib/admin/reports";
import { adminRoute } from "@/lib/admin/route";
import { adminRangeSchema } from "@/lib/validations/admin";
export async function GET(request: Request) {
  return adminRoute(request, async () =>
    adminJson(
      await getAdminReport(
        adminRangeSchema.parse(Object.fromEntries(new URL(request.url).searchParams)),
      ),
    ),
  );
}
