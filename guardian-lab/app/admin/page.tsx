import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton";
import { DashboardView } from "@/components/admin/dashboard-view";
import { getAdminDashboard } from "@/lib/admin/dashboard";
import { requirePageUser } from "@/lib/auth/page-access";

export const metadata = {
  title: "Dashboard Admin | Guardian Lab",
  description: "Ringkasan investigasi, aktivitas sandbox, dan moderasi komunitas Guardian Lab.",
};

async function DashboardContent() {
  const user = await requirePageUser("ADMIN");
  return <DashboardView scope={`${user.id}:${user.role}`} data={await getAdminDashboard()} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
