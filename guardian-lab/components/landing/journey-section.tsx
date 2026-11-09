import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { LANDING_SECTIONS } from "@/lib/routes";
import { cn } from "@/lib/utils";
import evidenceReader from "@/public/landing/guardian-evidence-reader.webp";
import explorer from "@/public/landing/guardian-explorer.webp";
import inputGuide from "@/public/landing/guardian-input-guide.webp";
import styles from "./journey.module.css";
import shared from "./landing.module.css";
import { LandingLink } from "./landing-link";
import { SceneReveal } from "./landing-motion";

const steps = [
  {
    title: "Pilih inputmu",
    description: "Masukkan tautan, unggah gambar QR, atau pilih APK yang ingin diperiksa.",
    image: inputGuide,
  },
  {
    title: "Baca informasi yang tersedia",
    description: "Perhatikan status, bukti, dan keterbatasan hasil sebelum mengambil keputusan.",
    image: evidenceReader,
  },
  {
    title: "Pilih langkah berikutnya",
    description: "Gunakan sandbox bila perlu. Hasil lengkap bisa dibagikan melalui Share Card.",
    image: explorer,
  },
];

export function JourneySection() {
  return (
    <section
      id={LANDING_SECTIONS.journey}
      tabIndex={-1}
      aria-labelledby="journey-title"
      className={cn(shared.sectionSpacing, styles.section)}
    >
      <div className={cn(shared.container, shared.sectionContainer)}>
        <h2
          id="journey-title"
          className={cn(shared.display, shared.sectionTitle)}
          data-landing-reveal
        >
          Tiga langkah, lebih terarah.
        </h2>
        <p className={shared.sectionIntro} data-landing-reveal data-landing-order="1">
          Tak harus langsung tahu semuanya. Guardian menemanimu, satu langkah setiap kali.
        </p>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} data-landing-reveal data-landing-order={index}>
              <SceneReveal className={styles.illustration}>
                <Image src={step.image} alt="" sizes="160px" loading="lazy" draggable={false} />
              </SceneReveal>
              <div className={styles.stepCopy}>
                <span className={styles.number} aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <LandingLink className={shared.textLink}>
          Mulai dari pemeriksaan <ArrowUpRight aria-hidden="true" />
        </LandingLink>
      </div>
    </section>
  );
}
