import styles from "./quiz-lesson.module.css";

export function QuizLessonSkeleton() {
  return (
    <output className={styles.lessonSkeleton} aria-label="Memuat latihan" aria-busy="true">
      <span className={styles.skeletonBack} aria-hidden="true" />
      <div className={styles.skeletonHeader} aria-hidden="true">
        <div>
          <span />
          <span />
          <span />
        </div>
        <span />
      </div>
      <div className={styles.studyLayout} aria-hidden="true">
        <div className={styles.skeletonSidebar} />
        <div className={styles.skeletonQuestions}>
          <span />
          <span />
        </div>
      </div>
    </output>
  );
}
