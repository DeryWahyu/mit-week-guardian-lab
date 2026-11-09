import { adminJson } from "@/lib/admin/http";
import { adminRoute } from "@/lib/admin/route";
import { listUsers } from "@/lib/admin/users";
import { adminQuerySchema } from "@/lib/validations/admin";
export async function GET(request: Request) {
  return adminRoute(request, async () =>
    adminJson(
      await listUsers(
        adminQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)),
      ),
    ),
  );
}
