import { ArrowLeft, ChartNoAxesColumnIncreasing, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { difficultyLabels } from "@/lib/academy/labels";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { type AcademyLesson, academyTopics } from "./academy-presentation";
import { AcademyTopicArt } from "./academy-topic-art";
import styles from "./quiz-lesson.module.css";

export function QuizLessonHeader({
  quiz,
  passed = false,
}: {
  quiz: AcademyLesson;
  passed?: boolean;
}) {
  const topic = academyTopics[quiz.category];
  const completed = quiz.isCompleted || passed;
  return (
    <>
      <Link href={PROTECTED_ROUTES.academy} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" size={18} />
        Kembali ke Belajar
      </Link>
      <header className={styles.lessonHeader} data-user-reveal>
        <div className={styles.lessonIntro}>
          <p className={styles.lessonTopic}>
            <FeatureIcon name={topic.icon} size="inline" />
            {topic.label}
          </p>
          <h1>{quiz.title}</h1>
          <p className={styles.lessonDescription}>{quiz.description}</p>
          <ul className={styles.lessonMeta}>
            <li>
              <FeatureIcon name="quiz" size="inline" />
              {quiz.questions.length} soal
            </li>
            <li>
              <ChartNoAxesColumnIncreasing size={16} aria-hidden="true" />
              {difficultyLabels[quiz.difficulty] ?? quiz.difficulty}
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" />
              Lulus minimal 70%
            </li>
          </ul>
        </div>
        <div className={styles.lessonVisual}>
          <div className={styles.lessonCover}>
            <AcademyTopicArt
              category={quiz.category}
              thumbnailUrl={quiz.thumbnailUrl}
              sizes="(max-width: 700px) 80vw, 340px"
            />
          </div>
          <div className={styles.rewardNote}>
            <FeatureIcon name="exp" />
            <div>
              <span>{completed ? "Latihan sudah lulus" : "Hadiah kelulusan pertama"}</span>
              <strong>
                {completed
                  ? "Latihan ulang tetap bermanfaat."
                  : `${quiz.expReward.toLocaleString("id-ID")} EXP`}
              </strong>
              <p>
                {completed
                  ? "Latihan ulang tidak menambah EXP."
                  : "Diberikan saat pertama kali lulus."}
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
