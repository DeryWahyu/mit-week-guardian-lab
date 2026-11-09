import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import mascot from "@/public/features/guardian-success.webp";
import shared from "./community.module.css";
import styles from "./leaderboard-hero.module.css";

export function LeaderboardHero() {
  return (
    <header className={styles.header} data-user-reveal>
      <Link href={PROTECTED_ROUTES.community} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" size={16} />
        Kembali ke komunitas
      </Link>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <h1>
            Setiap langkah belajar,<span>layak diapresiasi.</span>
          </h1>
          <p>
            Terus asah kepekaanmu dan kumpulkan EXP. Rayakan perjalanan belajar bersama Guardian
            lainnya.
          </p>
          <div className={styles.actions}>
            <Link href={PROTECTED_ROUTES.academy} className={shared.primaryButton}>
              <BookOpen aria-hidden="true" size={21} />
              Lanjutkan belajar
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <a href="#peringkat" className={styles.exploreLink}>
              Lihat peringkat
              <ArrowDown aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.cyanShape} />
          <div className={styles.lavenderShape} />
          <div className={styles.speech}>
            <span>Terus belajar,</span>
            <span>terus bertumbuh.</span>
          </div>
          <FeatureIcon name="rank" className={styles.trophy} />
          <Image
            src={mascot}
            alt=""
            className={styles.mascot}
            sizes="(max-width: 700px) 230px, 300px"
          />
          <svg
            className={styles.rays}
            viewBox="0 0 42 40"
            fill="none"
            focusable="false"
            aria-hidden="true"
          >
            <path
              d="M7 21L11 5M18 25L30 10M24 34L39 27"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <p className={styles.privacy}>
        <ShieldCheck aria-hidden="true" size={23} />
        <span>
          <strong>Belajar bersama, identitas tetap terjaga.</strong> Peringkat ditampilkan
          menggunakan alias Guardian.
        </span>
      </p>
    </header>
  );
}
