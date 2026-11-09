import { cn } from "@/lib/utils";
import styles from "./share-workspace.module.css";

const steps = ["Pilih hasil", "Tinjau kartu", "Bagikan"];

export function ShareSteps({
  stage = 1,
  standalone = false,
}: {
  stage?: 1 | 2 | 3;
  standalone?: boolean;
}) {
  return (
    <ol
      data-user-reveal
      className={cn(styles.steps, standalone && styles.stepsStandalone)}
      aria-label="Tahap berbagi hasil"
    >
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={stage === index + 1 ? "step" : undefined}
          data-complete={index + 1 < stage}
        >
          <span className={styles.stepNumber} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
