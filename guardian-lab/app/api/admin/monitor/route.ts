import { adminJson } from "@/lib/admin/http";
import { getAdminMonitor } from "@/lib/admin/monitor";
import { adminRoute } from "@/lib/admin/route";
export async function GET(request: Request) {
  return adminRoute(request, async () => adminJson(await getAdminMonitor()));
}
