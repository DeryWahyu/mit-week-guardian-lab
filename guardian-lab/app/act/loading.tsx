import { SharePageSkeleton } from "@/components/act/share-page-skeleton";
import styles from "@/components/act/share-workspace.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <SharePageSkeleton />
    </WorkspaceShell>
  );
}
