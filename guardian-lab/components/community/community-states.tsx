import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./community.module.css";

export function CommunityCasesSkeleton() {
  return (
    <output className={styles.listSkeleton} aria-label="Memuat daftar kasus" aria-busy="true">
      <span />
      <div>
        <span />
        <span />
        <span />
      </div>
      <span />
    </output>
  );
}

export function CommunityPageSkeleton() {
  return (
    <output className={styles.pageSkeleton} aria-label="Memuat komunitas" aria-busy="true">
      <div className={styles.heroSkeleton} aria-hidden="true">
        <div>
          <span />
          <span />
          <span />
        </div>
        <span />
      </div>
      <div className={styles.noticeSkeleton} aria-hidden="true" />
      <div className={styles.listPanel}>
        <CommunityCasesSkeleton />
      </div>
    </output>
  );
}

export function CommunityListProblem({
  problem,
  retry,
}: {
  problem: LoadProblem;
  retry: () => void;
}) {
  return (
    <div className={styles.problem} role="alert">
      <AlertCircle aria-hidden="true" size={28} />
      <h3>
        {problem.kind === "unauthenticated"
          ? "Masuk kembali untuk melihat komunitas."
          : "Daftar kasus belum dapat dimuat."}
      </h3>
      <p>{problem.message}</p>
      <div>
        {problem.retryable && (
          <button type="button" onClick={retry} className={styles.primaryButton}>
            <RefreshCw aria-hidden="true" size={17} /> Coba lagi
          </button>
        )}
        {problem.kind === "unauthenticated" && (
          <Link
            href={AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.community)}
            className={styles.primaryButton}
          >
            Masuk kembali
          </Link>
        )}
      </div>
    </div>
  );
}
