import { Suspense } from "react";
import { AdminAuditView } from "@/components/admin/admin-audit-view";
import { AdminLoading } from "@/components/admin/admin-ui";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = { title: "Log Aktivitas Admin | Guardian Lab" };
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <AdminAuditView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}
