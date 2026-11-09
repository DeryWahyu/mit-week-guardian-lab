import { ArrowDown, ArrowUpRight, Check, Circle, CircleHelp } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { AcademyLesson, AcademyResult } from "./academy-presentation";
import styles from "./quiz-lesson.module.css";

export function QuizStudySidebar({
  quiz,
  answers,
  answeredCount,
  result,
  pending,
}: {
  quiz: AcademyLesson;
  answers: Record<string, string[]>;
  answeredCount: number;
  result: AcademyResult | null;
  pending: boolean;
}) {
  return (
    <aside className={styles.studySidebar} aria-label="Progres dan navigasi latihan">
      <section
        className={styles.progressCard}
        aria-labelledby="quiz-progress-title"
        data-user-reveal
      >
        <div className={styles.cardHeading}>
          <FeatureIcon name="progress" />
          <div>
            <h2 id="quiz-progress-title">Progres latihanmu</h2>
            <p>
              {result
                ? "Hasil dan pembahasan sudah tersedia."
                : "Satu soal, satu langkah lebih peka."}
            </p>
          </div>
        </div>
        <div className={styles.progressCount}>
          <strong>
            {answeredCount}
            <small>/{quiz.questions.length}</small>
          </strong>
          <span>soal terjawab</span>
        </div>
        <progress
          className={styles.answerProgress}
          max={Math.max(1, quiz.questions.length)}
          value={answeredCount}
          aria-label="Soal terjawab"
        />
        <p className={styles.progressCaption} aria-live="polite">
          {pending
            ? "Jawaban sedang disimpan..."
            : `${answeredCount} dari ${quiz.questions.length} soal sudah dijawab.`}
        </p>
        <nav className={styles.questionMap} aria-label="Lompat ke soal">
          {quiz.questions.map((question, index) => {
            const feedback = result?.feedback.find((item) => item.questionId === question.id);
            const answered = Boolean(answers[question.id]?.length);
            const state = feedback
              ? feedback.correct
                ? "correct"
                : "review"
              : answered
                ? "answered"
                : "empty";
            const label = feedback
              ? feedback.correct
                ? "jawaban benar"
                : "perlu dipelajari kembali"
              : answered
                ? "sudah dijawab"
                : "belum dijawab";
            return (
              <a
                key={question.id}
                href={`#quiz-question-${index + 1}`}
                data-state={state}
                aria-label={`Ke soal ${index + 1}, ${label}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {feedback && !feedback.correct ? (
                  <CircleHelp size={11} aria-hidden="true" />
                ) : (
                  answered && <Check size={11} aria-hidden="true" />
                )}
              </a>
            );
          })}
        </nav>
        <div className={styles.mapLegend}>
          {result ? (
            <span>Pilih nomor untuk membaca pembahasannya.</span>
          ) : (
            <>
              <span>
                <Check size={12} aria-hidden="true" />
                Terjawab
              </span>
              <span>
                <Circle size={11} aria-hidden="true" />
                Belum dijawab
              </span>
            </>
          )}
        </div>
        <a className={styles.progressAction} href={result ? "#quiz-result" : "#quiz-submit"}>
          {result ? "Lihat hasil latihan" : "Tinjau jawaban"}
          {result ? (
            <ArrowUpRight size={17} aria-hidden="true" />
          ) : (
            <ArrowDown size={17} aria-hidden="true" />
          )}
        </a>
      </section>
      <section
        className={styles.guideCard}
        aria-labelledby="quiz-guide-title"
        data-user-reveal
        data-user-order="1"
      >
        <FeatureIcon name="casebook" />
        <h2 id="quiz-guide-title">
          Sedikit belajar,
          <br />
          lebih siap menjaga.
        </h2>
        <p>
          Tidak perlu terburu-buru. Baca setiap pilihan dan gunakan pembahasan untuk memahami
          alasannya.
        </p>
        <div>
          <Check size={15} aria-hidden="true" />
          <span>Jawaban dinilai setelah kamu mengirim.</span>
        </div>
      </section>
    </aside>
  );
}
