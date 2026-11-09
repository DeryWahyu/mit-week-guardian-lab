import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-ui";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = { title: "Pengguna Admin | Guardian Lab" };
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <AdminUsersView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}
