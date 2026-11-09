import type { ReactNode } from "react";
import { WorkspaceMascot, type WorkspacePose } from "./workspace-mascot";
import styles from "./workspace.module.css";

export function WorkspaceEmpty({
  title,
  description,
  pose = "evidence",
  children,
}: {
  title: string;
  description: string;
  pose?: WorkspacePose;
  children?: ReactNode;
}) {
  return (
    <section className={styles.empty} data-user-reveal>
      <WorkspaceMascot pose={pose} small />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </section>
  );
}

export function WorkspaceSkeleton({
  label = "Memuat ruang kerja",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <output className={styles.skeleton} aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => `row-${index}`).map((key) => (
        <span key={key} />
      ))}
    </output>
  );
}
