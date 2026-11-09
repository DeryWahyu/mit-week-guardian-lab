import { FeatureIcon } from "@/components/shared/feature-icon";
import { AcademyCaseCard } from "./academy-case-card";
import styles from "./academy-overview.module.css";
import { type AcademyProgress, type AcademyQuiz, formatStudyDate } from "./academy-presentation";

export function AcademyProgressPanel({
  progress,
  quizzes,
}: {
  progress: AcademyProgress;
  quizzes: AcademyQuiz[];
}) {
  const completed = quizzes.filter((quiz) => quiz.isCompleted).length;
  return (
    <aside
      id="progres"
      className={styles.overview}
      aria-label="Perjalanan belajar"
      data-user-reveal
    >
      <section className={styles.progressPanel} aria-labelledby="academy-progress-title">
        <div className={styles.progressHeading}>
          <FeatureIcon name="progress" />
          <div>
            <h2 id="academy-progress-title">Perjalanan belajarmu</h2>
            <p>Satu langkah, lebih banyak bekal.</p>
          </div>
        </div>
        {!quizzes.length && <p className={styles.noCourses}>Latihan belum diterbitkan.</p>}
        <div className={styles.courseProgress}>
          <strong>
            {completed}
            <span>/{quizzes.length}</span>
          </strong>
          <span>latihan lulus</span>
        </div>
        <progress
          aria-label="Latihan terbit yang sudah lulus"
          value={completed}
          max={Math.max(1, quizzes.length)}
          className={styles.progressBar}
        />
        <p className={styles.progressFootnote}>
          EXP diberikan sekali pada kelulusan pertama. Hari belajar dihitung dalam WIB.
        </p>
      </section>
      <section className={styles.badgePanel} aria-labelledby="academy-badge-title">
        <div className={styles.sideHeading}>
          <h2 id="academy-badge-title">
            <FeatureIcon name="badge" size="inline" />
            Koleksi lencana
          </h2>
          <span>{progress.badges.length}</span>
        </div>
        {!progress.badges.length ? (
          <div className={styles.badgeEmpty}>
            <FeatureIcon name="badge" size="large" muted />
            <h3>Lencana pertamamu menanti.</h3>
            <p>Lulus satu kuis untuk meraihnya.</p>
          </div>
        ) : (
          <ul className={styles.badgeList}>
            {progress.badges.map((badge) => (
              <li key={badge.id}>
                <FeatureIcon name="badge" size="small" />
                <div>
                  <h3>{badge.title}</h3>
                  <p>{badge.description}</p>
                  <time dateTime={badge.awardedAt}>{formatStudyDate(badge.awardedAt)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AcademyCaseCard />
    </aside>
  );
}
