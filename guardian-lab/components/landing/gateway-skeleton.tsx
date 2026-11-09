import styles from "./gateway.module.css";
import { HeroScene } from "./hero-scene";

export function GatewaySkeleton({ requiresAccount = true }: { requiresAccount?: boolean }) {
  return (
    <section
      aria-label="Memuat form pemeriksaan"
      aria-busy="true"
      className={styles.card}
    >
      <div aria-hidden="true">
        <div className="mb-2.5 ml-4.5 h-4.5 w-28 animate-pulse rounded bg-slate-200/70 motion-reduce:animate-none" />
        <div className={styles.inputBox}>
          <HeroScene />
          <span className="h-3 min-w-0 flex-1 animate-pulse rounded bg-slate-200/60 motion-reduce:animate-none" />
          <span className="ml-auto h-8 w-16 shrink-0 animate-pulse rounded-full bg-slate-100 motion-reduce:animate-none" />
          <span className={`${styles.submit} ${styles.skeletonSubmit}`} />
        </div>
        <div className={styles.fieldDetails}>
          <div className="mt-3 ml-4.5 h-3 w-3/5 rounded bg-slate-100" />
          {requiresAccount && (
            <div className={styles.accountHelp}>
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="mt-2 h-3 w-full rounded bg-slate-100" />
              <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
