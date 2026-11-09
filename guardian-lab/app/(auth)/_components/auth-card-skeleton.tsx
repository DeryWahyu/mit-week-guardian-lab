import { cn } from "@/lib/utils";
import styles from "../auth.module.css";

export function AuthCardSkeleton({
  title = "Menyiapkan halaman…",
  fields = 2,
  enlarged = false,
}: {
  title?: string;
  fields?: number;
  enlarged?: boolean;
}) {
  return (
    <output
      aria-label={title}
      aria-busy="true"
      className={cn("animate-pulse motion-reduce:animate-none", enlarged && styles.credentials)}
    >
      <div aria-hidden="true">
        <div className={styles.skeletonHeading} data-lines={fields === 2 ? 2 : 1} />
        <div className={styles.skeletonSubtitle} />
        <div className={cn(styles.form, fields === 5 && styles.registration)}>
          {Array.from({ length: fields }, (_, index) => `field-${index + 1}`).map((field) => (
            <div key={field} className={styles.field}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonInput} />
            </div>
          ))}
          {fields === 0 && <div className={styles.skeletonNote} />}
          {fields === 2 && <div className={styles.skeletonActions} />}
          <div className={styles.skeletonSubmit} />
        </div>
        <div className={styles.skeletonPrompt} />
      </div>
      <span className="sr-only">{title}</span>
    </output>
  );
}
