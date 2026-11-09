import Image from "next/image";
import { cn } from "@/lib/utils";
import history from "@/public/features/guardian-history.webp";
import sandbox from "@/public/features/guardian-sandbox.webp";
import share from "@/public/features/guardian-share.webp";
import success from "@/public/features/guardian-success.webp";
import academy from "@/public/landing/guardian-academy-reader.webp";
import apk from "@/public/landing/guardian-apk-inspector.webp";
import community from "@/public/landing/guardian-community-helper.webp";
import evidence from "@/public/landing/guardian-evidence-reader.webp";
import styles from "./workspace.module.css";

const poses = { academy, apk, community, evidence, history, sandbox, share, success };
export type WorkspacePose = keyof typeof poses;
export type WorkspaceReaction = "idle" | "ready" | "busy" | "success" | "error";

export function WorkspaceMascot({
  pose,
  reaction = "idle",
  small = false,
}: {
  pose: WorkspacePose;
  reaction?: WorkspaceReaction;
  small?: boolean;
}) {
  return (
    <div
      className={cn(styles.artwork, small && styles.smallArtwork)}
      aria-hidden="true"
      data-reaction={reaction}
    >
      <div className={styles.artworkSurface} />
      <Image
        key={`${pose}:${reaction}`}
        src={poses[pose]}
        alt=""
        sizes={small ? "160px" : "(min-width: 768px) 340px, 150px"}
        className={styles.mascot}
      />
    </div>
  );
}
