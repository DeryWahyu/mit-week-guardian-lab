import { RefreshCw } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { LoadProblem } from "@/lib/investigations/client";
import styles from "./community-case.module.css";

export function CommunityChallengeSkeleton() {
  return (
    <output className={styles.skeleton} aria-label="Memuat latihan kasus" aria-busy="true">
      <div className={styles.skeletonChallenge} aria-hidden="true" />
      <div className={styles.skeletonReport} aria-hidden="true" />
    </output>
  );
}

export function CommunityChallengeProblem({
  problem,
  retry,
}: {
  problem: LoadProblem | null;
  retry: () => void;
}) {
  return (
    <section className={styles.problem} role="alert">
      <FeatureIcon name="casebook" size="large" muted />
      <h2>Latihan belum dapat dimuat.</h2>
      <p>{problem?.message ?? "Muat ulang untuk memeriksa ketersediaan latihan kasus."}</p>
      {(!problem || problem.retryable) && (
        <button type="button" className={styles.secondary} onClick={retry}>
          <RefreshCw size={17} aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </section>
  );
}
