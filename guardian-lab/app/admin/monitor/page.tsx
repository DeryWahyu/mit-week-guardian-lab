import { Suspense } from "react";
import { AdminMonitorView } from "@/components/admin/admin-monitor-view";
import { AdminLoading } from "@/components/admin/admin-ui";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = { title: "Monitor Layanan Admin | Guardian Lab" };
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <AdminMonitorView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}
