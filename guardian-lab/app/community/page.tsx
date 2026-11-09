import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityPageView } from "@/components/community/community-page-view";
import { CommunityPageSkeleton } from "@/components/community/community-states";
import styles from "@/components/community/community.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kasus Komunitas | Guardian Lab",
  description: "Pelajari temuan tersimpan yang telah melalui moderasi admin.",
};
async function CommunityContent() {
  const user = await requirePageUser();
  return <CommunityPageView scope={`${user.id}:${user.role}`} />;
}
export default function CommunityPage() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<CommunityPageSkeleton />}>
        <CommunityContent />
      </Suspense>
    </WorkspaceShell>
  );
}
