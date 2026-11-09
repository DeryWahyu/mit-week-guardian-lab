import { CommunityPageSkeleton } from "@/components/community/community-states";
import styles from "@/components/community/community.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { cn } from "@/lib/utils";
export default function Loading() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <CommunityPageSkeleton />
    </WorkspaceShell>
  );
}
