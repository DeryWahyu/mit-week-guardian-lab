import { exportAdminReport } from "@/lib/admin/reports";
import { adminRoute } from "@/lib/admin/route";
import { readInput } from "@/lib/investigations/request-input";
import { adminRangeSchema } from "@/lib/validations/admin";
export async function POST(request: Request) {
  return adminRoute(request, async (user) => {
    const result = await exportAdminReport(
      user.id,
      adminRangeSchema.strict().parse(await readInput(request, 4096, "json")),
    );
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
