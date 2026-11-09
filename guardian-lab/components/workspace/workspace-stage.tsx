import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WorkspaceMascot, type WorkspacePose, type WorkspaceReaction } from "./workspace-mascot";
import styles from "./workspace.module.css";

export function WorkspaceStage({
  title,
  description,
  pose,
  children,
  compact = false,
  reaction,
  tone = "cyan",
}: {
  title: string;
  description: string;
  pose: WorkspacePose;
  children?: ReactNode;
  compact?: boolean;
  reaction?: WorkspaceReaction;
  tone?: "cyan" | "lavender" | "yellow";
}) {
  return (
    <section
      className={cn(styles.stage, compact && styles.compactStage)}
      data-tone={tone}
      data-user-reveal
    >
      <div className={styles.stageSurface} />
      <div className={styles.stageCopy}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {children && <div className={styles.stageControls}>{children}</div>}
      </div>
      <WorkspaceMascot pose={pose} reaction={reaction} small={compact} />
    </section>
  );
}
