import { type ReactNode, Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton";
import { requirePageUser } from "@/lib/auth/page-access";

async function AuthorizedAdmin({ children }: { children: ReactNode }) {
  const user = await requirePageUser("ADMIN");
  return <AdminShell user={user}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl p-8">
          <DashboardSkeleton />
        </div>
      }
    >
      <AuthorizedAdmin>{children}</AuthorizedAdmin>
    </Suspense>
  );
}
