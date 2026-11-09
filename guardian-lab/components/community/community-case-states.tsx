import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./community-case.module.css";
import { CommunityCaseHeading } from "./community-case-header";

export function CommunityCaseRecordSkeleton() {
  return (
    <output className={styles.skeleton} aria-busy="true" aria-label="Memuat kasus komunitas">
      <div className={styles.skeletonOverview} aria-hidden="true" />
      <div className={styles.readingLayout} aria-hidden="true">
        <div className={styles.skeletonReport} />
        <div className={styles.skeletonSidebar} />
      </div>
    </output>
  );
}

export function CommunityCaseSkeleton() {
  return (
    <div className={styles.content}>
      <CommunityCaseHeading />
      <CommunityCaseRecordSkeleton />
    </div>
  );
}

export function CommunityCaseProblem({
  problem,
  retry,
}: {
  problem?: LoadProblem;
  retry?: () => void;
}) {
  const signIn = problem?.kind === "unauthenticated";
  return (
    <section className={styles.problem} role={problem ? "alert" : undefined}>
      <FeatureIcon name="record" size="large" muted />
      <h2>
        {signIn
          ? "Masuk kembali untuk membaca kasus."
          : problem
            ? "Kasus belum dapat dibuka."
            : "Kasus tidak ditemukan."}
      </h2>
      <p>
        {problem?.message ??
          "Kasus mungkin sudah tidak tersedia. Kembali ke daftar untuk menemukan bahan belajar lainnya."}
      </p>
      <div className={styles.actions}>
        {problem?.retryable && retry && (
          <button type="button" className={styles.primary} onClick={retry}>
            <RefreshCw size={17} aria-hidden="true" />
            Coba lagi
          </button>
        )}
        <Link
          href={
            signIn
              ? AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.community)
              : PROTECTED_ROUTES.community
          }
          className={styles.secondary}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {signIn ? "Masuk kembali" : "Kembali ke komunitas"}
        </Link>
      </div>
    </section>
  );
}
