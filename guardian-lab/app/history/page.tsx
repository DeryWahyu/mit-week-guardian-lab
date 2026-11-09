import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryDashboardView } from "@/components/history/history-dashboard-view";
import { HistoryPageSkeleton } from "@/components/history/history-states";
import styles from "@/components/history/history-workspace.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Riwayat Investigasi | Guardian Lab",
  description: "Status dan hasil investigasi URL, QR, serta APK yang tersimpan.",
};

async function HistoryContent() {
  const user = await requirePageUser();
  return <HistoryDashboardView accessScope={`${user.id}:${user.role}`} />;
}

export default function HistoryPage() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<HistoryPageSkeleton />}>
        <HistoryContent />
      </Suspense>
    </WorkspaceShell>
  );
}
