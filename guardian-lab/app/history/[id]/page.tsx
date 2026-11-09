import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "@/components/history/history-detail.module.css";
import { HistoryDetailSkeleton } from "@/components/history/history-detail-frame";
import { HistoryDetailView } from "@/components/history/history-detail-view";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";

export const instant = false;
export const metadata: Metadata = {
  title: "Rekaman Pemeriksaan | Guardian Lab",
  description: "Lihat rekaman, status proses, dan bukti pemeriksaan investigasi.",
};

interface HistoryDetailPageProps {
  params: Promise<{ id: string }>;
}

async function HistoryDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  return <HistoryDetailView recordId={id} accessScope={`${user.id}:${user.role}`} />;
}

export default function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<HistoryDetailSkeleton />}>
        <HistoryDetailContent params={params} />
      </Suspense>
    </WorkspaceShell>
  );
}
