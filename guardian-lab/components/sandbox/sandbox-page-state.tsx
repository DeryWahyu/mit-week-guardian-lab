"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AUTH_ROUTES } from "@/lib/routes";
import { SandboxFeatures } from "./sandbox-features";
import { SandboxIntro } from "./sandbox-intro";
import { SandboxScene } from "./sandbox-scene";
import styles from "./web-sandbox.module.css";

export function SandboxSkeleton() {
  return (
    <div className={styles.content}>
      <div className={styles.launchHero}>
        <div className={styles.heroForm}>
          <SandboxIntro />
          <output className={styles.skeleton} aria-label="Memuat Ruang Uji" aria-busy="true">
            <span />
            <span />
            <span />
            <span />
          </output>
        </div>
        <SandboxScene phase="loading" />
      </div>
      <SandboxFeatures />
    </div>
  );
}

export function SandboxProblem({ retry }: { retry: () => void }) {
  return (
    <div className={styles.content}>
      <SandboxIntro compact />
      <section className={styles.problem} role="alert">
        <span className={styles.headingIcon}>
          <CircleAlert aria-hidden="true" size={25} />
        </span>
        <h2>Ruang Uji belum dapat dimuat.</h2>
        <p>Coba muat kembali. Jika sesi masukmu telah berakhir, masuk kembali untuk melanjutkan.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={retry}>
            <RefreshCw aria-hidden="true" size={17} /> Coba lagi
          </button>
          <Link className={styles.secondaryButton} href={AUTH_ROUTES.login}>
            Masuk kembali
          </Link>
        </div>
      </section>
    </div>
  );
}
