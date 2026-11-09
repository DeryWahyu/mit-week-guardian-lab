import { ArrowDown } from "lucide-react";
import Image from "next/image";
import reader from "@/public/landing/guardian-academy-reader.webp";
import { AcademyNextLesson } from "./academy-next-lesson";
import type { AcademyQuiz } from "./academy-presentation";
import styles from "./academy-hero.module.css";

export function AcademyHero({ next }: { next?: AcademyQuiz }) {
  return (
    <header className={styles.hero} data-user-reveal>
      <div className={styles.heroCopy}>
        <h1>
          Latih kepekaanmu,
          <span>kenali jebakannya.</span>
        </h1>
        <p>Latihan singkat untuk memahami tautan, pesan, dan izin aplikasi.</p>
        <AcademyNextLesson quiz={next} />
        <a href="#latihan" className={styles.exploreLink}>
          Jelajahi semua latihan
          <ArrowDown aria-hidden="true" size={16} />
        </a>
      </div>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.sceneBackdrop} />
        <div className={styles.sceneAccent} />
        <div className={styles.sceneNote}>
          <span>Belajar sedikit,</span>
          <span>lebih waspada.</span>
        </div>
        <div className={styles.reader}>
          <Image src={reader} alt="" sizes="(max-width: 700px) 240px, 380px" />
        </div>
      </div>
    </header>
  );
}
