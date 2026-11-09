import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "@/components/community/community-case.module.css";
import { CommunityCaseDetail } from "@/components/community/community-case-detail";
import { CommunityCaseSkeleton } from "@/components/community/community-case-states";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail Kasus Komunitas | Guardian Lab",
  description: "Snapshot pemeriksaan dan status moderasi kasus komunitas.",
};
async function CaseContent({ params }: { params: Promise<{ replayId: string }> }) {
  const user = await requirePageUser();
  const { replayId } = await params;
  return (
    <CommunityCaseDetail
      key={replayId}
      id={replayId}
      scope={`${user.id}:${user.role}`}
      admin={user.role === "ADMIN"}
    />
  );
}
export default function CommunityReplayPage({ params }: { params: Promise<{ replayId: string }> }) {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<CommunityCaseSkeleton />}>
        <CaseContent params={params} />
      </Suspense>
    </WorkspaceShell>
  );
}
