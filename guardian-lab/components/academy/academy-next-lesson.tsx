import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { difficultyLabels } from "@/lib/academy/labels";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./academy-hero.module.css";
import { type AcademyQuiz, academyTopics } from "./academy-presentation";

export function AcademyNextLesson({ quiz }: { quiz?: AcademyQuiz }) {
  if (!quiz) return null;
  const { icon } = academyTopics[quiz.category];
  return (
    <section className={styles.nextLesson} aria-labelledby="next-lesson-title">
      <FeatureIcon name={icon} className={styles.nextIcon} />
      <div>
        <p>{quiz.isCompleted ? "Perdalam pemahamanmu" : "Mulai dari sini"}</p>
        <h2 id="next-lesson-title">{quiz.title}</h2>
        <span>
          {quiz.questionCount} soal · {difficultyLabels[quiz.difficulty] ?? quiz.difficulty}
          {quiz.isCompleted ? " · EXP sudah diperoleh" : ` · ${quiz.expReward} EXP`}
        </span>
      </div>
      <Link
        href={PROTECTED_ROUTES.academyLesson(quiz.id)}
        className={styles.nextButton}
        aria-label={`${quiz.isCompleted ? "Latihan ulang" : "Mulai latihan"}: ${quiz.title}`}
      >
        {quiz.isCompleted ? <CircleCheck aria-hidden="true" size={17} /> : null}
        {quiz.isCompleted ? "Latihan ulang" : "Mulai latihan"}
        <ArrowRight aria-hidden="true" size={17} />
      </Link>
    </section>
  );
}
