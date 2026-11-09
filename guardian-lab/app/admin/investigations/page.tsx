import { Suspense } from "react";
import { AdminInvestigationsView } from "@/components/admin/admin-investigations-view";
import { AdminLoading } from "@/components/admin/admin-ui";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = { title: "Investigasi Admin | Guardian Lab" };
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <AdminInvestigationsView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}
