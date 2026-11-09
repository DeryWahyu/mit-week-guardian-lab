import { FeatureIcon, type FeatureIconName } from "@/components/shared/feature-icon";
import styles from "./academy-hero.module.css";
import type { AcademyProgress } from "./academy-presentation";

export function AcademyStats({ progress }: { progress: AcademyProgress }) {
  const metrics: { label: string; value: string | number; icon: FeatureIconName }[] = [
    { label: "Peringkatmu", value: progress.rank, icon: "rank" },
    { label: "Total EXP", value: progress.exp.toLocaleString("id-ID"), icon: "exp" },
    { label: "Hari berturut-turut", value: progress.streakDays, icon: "streak" },
    { label: "Kuis lulus", value: progress.completed, icon: "quiz" },
    { label: "Kasus diselesaikan", value: progress.casesSolved, icon: "case" },
  ];
  return (
    <dl
      className={styles.metrics}
      aria-label="Progres belajar akun"
      data-user-reveal
      data-user-order="1"
    >
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
  );
}
