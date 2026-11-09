import { ArrowRight, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./community.module.css";
import { CommunityIllustration } from "./community-illustration";

export function CommunityHero() {
  return (
    <section className={styles.hero} aria-labelledby="community-title" data-user-reveal>
      <div className={styles.heroCopy}>
        <h1 id="community-title">
          Belajar dari kasus,
          <span>saling menjaga.</span>
        </h1>
        <p>
          Telusuri bukti dari kasus yang ditinjau. Ajukan hasil pemeriksaan untuk membantu Guardian
          lain.
        </p>
        <div className={styles.heroActions}>
          <Link href={PROTECTED_ROUTES.history} className={styles.primaryButton}>
            <FilePlus2 aria-hidden="true" size={23} />
            Ajukan dari riwayat
            <ArrowRight aria-hidden="true" size={21} />
          </Link>
          <Link href={PROTECTED_ROUTES.leaderboard} className={styles.secondaryButton}>
            <FeatureIcon name="rank" size="inline" />
            Peringkat Guardian
          </Link>
        </div>
      </div>
      <CommunityIllustration />
    </section>
  );
}
