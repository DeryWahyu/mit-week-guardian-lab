import { Suspense } from "react";
import { AdminReportsView } from "@/components/admin/admin-reports-view";
import { AdminLoading } from "@/components/admin/admin-ui";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = { title: "Laporan Admin | Guardian Lab" };
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <AdminReportsView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}
