import { ScanLine } from "lucide-react";
import type { ReactNode } from "react";
import { LANDING_SECTIONS } from "@/lib/routes";
import { cn } from "@/lib/utils";
import styles from "./hero.module.css";
import { HeroBackdrop } from "./hero-backdrop";
import shared from "./landing.module.css";

export function HeroSection({ children }: { children: ReactNode }) {
  return (
    <section
      id={LANDING_SECTIONS.home}
      tabIndex={-1}
      aria-labelledby="landing-title"
      data-hero-stage
      className={styles.hero}
    >
      <HeroBackdrop />
      <div className={cn(shared.container, styles.stage)}>
        <div className={styles.composition}>
          <p className={cn(shared.display, styles.wordmark)} aria-hidden="true">
            GUARDIAN LAB
          </p>
          <div className={styles.intro}>
            <h1 id="landing-title" className={cn(shared.display, styles.title)}>
              Sebelum klik,
              <br />
              <span className={styles.titleAccent}>cek dulu.</span>
            </h1>
            <p>
              Periksa <strong>tautan yang bikin ragu.</strong> Baca <strong>kode QR</strong> tanpa
              membuka situsnya di perangkatmu.
            </p>
          </div>
          <div className={styles.supportCopy}>
            <p className={styles.supportEyebrow}>
              <ScanLine size={14} aria-hidden="true" />
              Langkah lebih bijak
            </p>
            <h2 className={cn(shared.display, styles.supportTitle)}>
              Kenali polanya.
              <br />
              <span>Pahami risikonya.</span>
            </h2>
            <p className={styles.supportDescription}>
              Temukan indikasi mencurigakan dan baca alasannya sebelum membuka tautan.
            </p>
          </div>
          <section
            id="periksa"
            tabIndex={-1}
            aria-label="Meja pemeriksaan"
            className={styles.formSlot}
          >
            {children}
          </section>
        </div>
      </div>
    </section>
  );
}
