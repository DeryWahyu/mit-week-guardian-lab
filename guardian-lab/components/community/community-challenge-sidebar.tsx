import { ArrowDown, Check, CircleHelp } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import styles from "./community-case.module.css";
import type { CaseChallenge, CaseChallengeResult } from "./community-case-presentation";

export function CommunityChallengeSidebar({
  challenge,
  answers,
  result,
  pending,
}: {
  challenge: CaseChallenge;
  answers: Record<string, string>;
  result: CaseChallengeResult | null;
  pending: boolean;
}) {
  const answered = challenge.questions.filter((question) => answers[question.id]).length;
  return (
    <aside className={styles.challengeSidebar} aria-label="Progres dan navigasi latihan kasus">
      <section className={styles.panel} aria-labelledby="case-progress-title" data-user-reveal>
        <div className={styles.panelHeading}>
          <FeatureIcon name="progress" />
          <div>
            <h2 id="case-progress-title">Langkah belajarmu</h2>
            <p>
              {result ? "Baca pembahasan setiap soal." : "Cermati satu petunjuk setiap langkah."}
            </p>
          </div>
        </div>
        <div className={styles.progressCount}>
          <strong>
            {answered}
            <small>/{challenge.questions.length}</small>
          </strong>
          <span>soal terjawab</span>
        </div>
        <progress
          max={Math.max(1, challenge.questions.length)}
          value={answered}
          aria-label="Soal kasus terjawab"
          className={styles.progress}
        />
        <p className={styles.progressCaption} aria-live="polite">
          {pending
            ? "Jawaban sedang disimpan..."
            : result
              ? "Hasil tersimpan. Lihat penjelasan di tiap soal."
              : `${answered} dari ${challenge.questions.length} soal sudah terisi.`}
        </p>
        <nav className={styles.questionMap} aria-label="Pilih nomor soal kasus">
          {challenge.questions.map((question, index) => {
            const feedback = result?.feedback.find((item) => item.questionId === question.id);
            const state = feedback
              ? feedback.correct
                ? "correct"
                : "review"
              : answers[question.id]
                ? "answered"
                : "empty";
            const label =
              state === "correct"
                ? "jawaban benar"
                : state === "review"
                  ? "pelajari kembali"
                  : state === "answered"
                    ? "sudah dijawab"
                    : "belum dijawab";
            return (
              <a
                key={question.id}
                href={`#quiz-question-${index + 1}`}
                data-state={state}
                aria-label={`Soal ${index + 1}, ${label}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {state === "review" ? (
                  <CircleHelp size={14} aria-hidden="true" />
                ) : state !== "empty" ? (
                  <Check size={14} aria-hidden="true" />
                ) : null}
              </a>
            );
          })}
        </nav>
        <a
          href={result ? "#quiz-result" : "#case-challenge-submit"}
          className={styles.progressAction}
        >
          {result ? "Lihat hasil latihan" : "Tinjau jawaban"}
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </section>
      <section className={styles.guide} aria-labelledby="case-reward-title" data-user-reveal>
        <FeatureIcon name="badge" />
        <h2 id="case-reward-title">
          Pahami petunjuk,
          <br />
          bangun kepekaan.
        </h2>
        <p>
          {challenge.isSolved || result?.passed
            ? "Kasus ini sudah kamu selesaikan. Gunakan latihan ulang untuk menguatkan pemahaman, tanpa tambahan EXP."
            : `Jawab semua soal dengan benar untuk memperoleh ${challenge.expReward} EXP pada kelulusan pertama.`}
        </p>
        <p className={styles.privacy}>
          <Check size={16} aria-hidden="true" />
          Penilaian dan pembahasan muncul setelah jawaban dikirim.
        </p>
      </section>
    </aside>
  );
}
