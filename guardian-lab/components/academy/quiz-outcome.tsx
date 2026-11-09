import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FeatureIcon, type FeatureIconName } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { AcademyResult } from "./academy-presentation";
import styles from "./quiz-outcome.module.css";

export function QuizOutcome({ result }: { result: AcademyResult }) {
  const metrics: { label: string; value: string | number; icon: FeatureIconName }[] = [
    { label: "Total EXP", value: result.newExp.toLocaleString("id-ID"), icon: "exp" },
    { label: "Hari belajar", value: result.newStreak, icon: "streak" },
    { label: "Peringkat", value: result.rank, icon: "rank" },
  ];
  return (
    <section
      id="quiz-result"
      aria-live="polite"
      className={styles.outcome}
      data-passed={result.passed}
      data-user-reveal
    >
      <div className={styles.outcomeSummary}>
        <FeatureIcon name={result.passed ? "rank" : "progress"} size="large" />
        <div className={styles.outcomeCopy}>
          <span className={styles.outcomeStatus}>
            {result.passed ? "Latihan lulus" : "Belum lulus"}
          </span>
          <h2>
            {result.passed
              ? "Langkah bagus, bekalmu bertambah."
              : "Pelajari alasannya, lalu coba lagi."}
          </h2>
          <p>
            {result.correctCount} dari {result.totalQuestions} soal dijawab dengan benar.
          </p>
          <span className={styles.earnedBadge}>
            <FeatureIcon name="exp" size="inline" />
            {result.expEarned > 0 ? "+" : ""}
            {result.expEarned.toLocaleString("id-ID")} EXP diperoleh
          </span>
        </div>
        <div className={styles.score}>
          <span>Nilai latihan</span>
          <strong>
            {result.score}
            <small>/100</small>
          </strong>
        </div>
      </div>
      <dl className={styles.outcomeStats}>
        {metrics.map(({ label, value, icon }) => (
          <div key={label}>
            <dt>
              <FeatureIcon name={icon} />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={PROTECTED_ROUTES.academy} className={styles.outcomeLink}>
        Lihat progres belajarmu
        <ArrowUpRight aria-hidden="true" size={17} />
      </Link>
    </section>
  );
}
