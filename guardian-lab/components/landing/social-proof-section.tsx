import { ArrowUpRight, BookOpen, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LANDING_SECTIONS, PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import academyReader from "@/public/landing/guardian-academy-reader.webp";
import communityHelper from "@/public/landing/guardian-community-helper.webp";
import styles from "./community.module.css";
import shared from "./landing.module.css";
import { LandingFaq } from "./landing-faq";
import { SceneReveal } from "./landing-motion";
import { PlatformStats } from "./platform-stats";

const paths = [
  {
    id: "academy",
    label: "Academy",
    icon: BookOpen,
    title: "Kenali polanya, latih instingmu.",
    description:
      "Pelajari tanda phishing dan uji pemahamanmu lewat kuis singkat. Mulai dari satu pelajaran.",
    action: "Mulai belajar",
    href: PROTECTED_ROUTES.academy,
    image: academyReader,
  },
  {
    id: "community",
    label: "Komunitas",
    icon: UsersRound,
    title: "Baca buktinya, jaga sesama.",
    description:
      "Jelajahi kasus yang diajukan pemilik investigasi dan disetujui admin. Pelajari cara memilih langkah berikutnya.",
    action: "Jelajahi kasus",
    href: PROTECTED_ROUTES.community,
    image: communityHelper,
  },
];

export function SocialProofSection() {
  return (
    <section
      id={LANDING_SECTIONS.community}
      tabIndex={-1}
      aria-labelledby="community-title"
      className={cn(shared.sectionSpacing, styles.section)}
    >
      <div className={cn(shared.container, shared.sectionContainer)}>
        <h2
          id="community-title"
          className={cn(shared.display, shared.sectionTitle)}
          data-landing-reveal
        >
          Belajar bareng, jaga sesama.
        </h2>
        <p className={shared.sectionIntro} data-landing-reveal data-landing-order="1">
          Bangun kebiasaan digital yang lebih waspada. Ada pelajaran dan pengalaman untuk
          dipelajari.
        </p>
        <div className={styles.learning}>
          {paths.map(
            ({ id, label, icon: Icon, title, description, action, href, image }, index) => (
              <article
                key={id}
                className={cn(styles.learningCard, styles[id])}
                data-landing-reveal
                data-landing-order={index}
              >
                <div className={styles.cardSurface} aria-hidden="true" />
                <div className={styles.cardCopy}>
                  <span className={styles.cardLabel}>
                    <Icon aria-hidden="true" />
                    {label}
                  </span>
                  <h3 className={cn(shared.display, styles.cardTitle)}>{title}</h3>
                  <p>{description}</p>
                  <Link href={href} className={shared.textLink}>
                    {action} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
                <SceneReveal className={styles.companion}>
                  <Image
                    src={image}
                    alt=""
                    sizes="(min-width: 900px) 175px, (min-width: 640px) 190px, 125px"
                    loading="lazy"
                    draggable={false}
                  />
                </SceneReveal>
              </article>
            ),
          )}
        </div>
        <PlatformStats />
        <LandingFaq />
      </div>
    </section>
  );
}
