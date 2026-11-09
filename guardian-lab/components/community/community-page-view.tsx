"use client";
import { ShieldCheck } from "lucide-react";
import { CommunityCasesView } from "./community-cases-view";
import { CommunityHero } from "./community-hero";
import styles from "./community.module.css";

export function CommunityPageView({ scope }: { scope: string }) {
  return (
    <div className={styles.content}>
      <CommunityHero />
      <div className={styles.moderationNotice} data-user-reveal data-user-order="1">
        <span>
          <ShieldCheck aria-hidden="true" size={25} />
        </span>
        <div>
          <strong>Kasus diajukan pengguna dan ditinjau admin.</strong>
          <span>Identitas pengaju tidak ditampilkan.</span>
        </div>
      </div>
      <CommunityCasesView scope={scope} />
    </div>
  );
}
