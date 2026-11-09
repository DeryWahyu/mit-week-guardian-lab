import { ArrowUpRight, FileCode2, Link2, Share2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LANDING_SECTIONS, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import apkInspector from "@/public/landing/guardian-apk-inspector.webp";
import protect from "@/public/landing/guardian-protect.webp";
import recognize from "@/public/landing/guardian-recognize.webp";
import share from "@/public/landing/guardian-share.webp";
import shared from "./landing.module.css";
import { LandingLink } from "./landing-link";
import { SceneReveal } from "./landing-motion";
import styles from "./pillars.module.css";

const features = [
  {
    id: "links",
    title: "Baca tautan & QR",
    image: recognize,
    icon: Link2,
    description: "Mulai dari alamat yang kamu terima, termasuk tautan di dalam gambar kode QR.",
    action: "Periksa tautan",
    tab: "url" as const,
  },
  {
    id: "apk",
    title: "Bedah file APK",
    image: apkInspector,
    icon: FileCode2,
    description: "Lihat izin dan temuan statis aplikasi Android tanpa memasangnya di perangkatmu.",
    action: "Periksa APK",
    href: PROTECTED_ROUTES.apk,
  },
  {
    id: "sandbox",
    title: "Jelajahi sandbox",
    image: protect,
    icon: ShieldCheck,
    description: "Lihat isi tautan lewat browser terisolasi yang berjalan terpisah di server.",
    action: "Buka sandbox",
    href: PUBLIC_ROUTES.sandboxWeb,
  },
  {
    id: "share",
    title: "Bagikan peringatan",
    image: share,
    icon: Share2,
    description: "Ubah hasil yang sudah lengkap menjadi Share Card untuk keluarga dan teman.",
    action: "Buka Share Card",
    href: PUBLIC_ROUTES.act,
  },
];

export function PillarsSection() {
  return (
    <section
      id={LANDING_SECTIONS.features}
      tabIndex={-1}
      aria-labelledby="pillars-title"
      className={cn(shared.sectionSpacing, styles.section)}
    >
      <div className={cn(shared.container, shared.sectionContainer)}>
        <div className={styles.heading} data-landing-reveal>
          <h2 id="pillars-title" className={cn(shared.display, shared.sectionTitle)}>
            Kenali dulu, baru melangkah.
          </h2>
          <p className={shared.sectionIntro}>
            Dari tautan yang bikin ragu sampai berbagi peringatan. Pilih langkah yang kamu butuhkan.
          </p>
        </div>
        <div className={styles.grid}>
          {features.map(
            ({ id, title, image, icon: Icon, description, action, tab, href }, index) => (
              <article
                key={id}
                className={cn(styles.card, styles[id])}
                data-landing-reveal
                data-landing-order={index}
              >
                <div className={styles.surface} aria-hidden="true" />
                <div className={styles.content}>
                  <h3>
                    <Icon aria-hidden="true" />
                    {title}
                  </h3>
                  <p>{description}</p>
                  {href ? (
                    <Link href={href} className={styles.action}>
                      {action}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  ) : (
                    <LandingLink tab={tab} className={styles.action}>
                      {action}
                      <ArrowUpRight aria-hidden="true" />
                    </LandingLink>
                  )}
                </div>
                <SceneReveal className={styles.mascot}>
                  <Image
                    src={image}
                    alt=""
                    sizes="(min-width: 768px) 185px, (min-width: 375px) 130px, 105px"
                    loading="lazy"
                    draggable={false}
                  />
                </SceneReveal>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
