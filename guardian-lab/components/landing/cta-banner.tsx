import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { LANDING_SECTIONS } from "@/lib/routes";
import { cn } from "@/lib/utils";
import ctaGuide from "@/public/landing/guardian-cta-guide.webp";
import styles from "./cta.module.css";
import shared from "./landing.module.css";
import { LandingLink } from "./landing-link";
import { SceneReveal } from "./landing-motion";

export function CtaBanner() {
  return (
    <section
      id={LANDING_SECTIONS.start}
      tabIndex={-1}
      aria-labelledby="closing-title"
      className={cn(shared.sectionSpacing, styles.section)}
    >
      <div className={cn(shared.container, shared.sectionContainer)}>
        <div className={styles.banner} data-landing-reveal>
          <div className={styles.surface} aria-hidden="true" />
          <div className={styles.copy}>
            <h2 id="closing-title" className={cn(shared.display, styles.title)}>
              Mulai dari
              <br />
              rasa curiga.
            </h2>
            <p>Satu tautan atau berkas bisa jadi langkah awal untuk lebih waspada.</p>
            <LandingLink className={shared.primary}>
              Mulai pemeriksaan <ArrowUpRight aria-hidden="true" />
            </LandingLink>
          </div>
          <SceneReveal className={styles.mascot}>
            <Image
              src={ctaGuide}
              alt=""
              sizes="(min-width: 768px) 245px, 140px"
              loading="lazy"
              draggable={false}
            />
          </SceneReveal>
        </div>
      </div>
    </section>
  );
}
