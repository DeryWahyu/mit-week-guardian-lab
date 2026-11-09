import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import casebook from "@/public/features/academy-casebook.webp";
import styles from "./academy-overview.module.css";

export function AcademyCaseCard() {
  return (
    <section className={styles.caseCard} aria-labelledby="academy-case-title">
      <h2 id="academy-case-title">
        <FeatureIcon name="casebook" />
        Belajar dari kasus
      </h2>
      <p>Lihat pola penipuan dari kasus komunitas.</p>
      <Link href={PROTECTED_ROUTES.community} className={styles.caseLink}>
        Jelajahi kasus
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
      <Image src={casebook} alt="" className={styles.caseArtwork} sizes="180px" />
    </section>
  );
}
