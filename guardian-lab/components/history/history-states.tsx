import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import styles from "./history-workspace.module.css";

export function HistoryListSkeleton() {
  return (
    <output className={styles.listSkeleton} aria-label="Memuat riwayat" aria-busy="true">
      <div aria-hidden="true" />
      {[0, 1, 2].map((item) => (
        <div key={item} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </output>
  );
}

export function HistoryPageSkeleton() {
  return (
    <output
      className={styles.pageSkeleton}
      aria-label="Memuat riwayat pemeriksaan"
      aria-busy="true"
    >
      <div className={styles.heroSkeleton} aria-hidden="true">
        <div>
          <span />
          <span />
          <span />
        </div>
        <span />
      </div>
      <div className={styles.statsSkeleton} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.listPanel}>
        <HistoryListSkeleton />
      </div>
    </output>
  );
}

export function HistoryEmpty({ outside, filtered }: { outside: boolean; filtered: boolean }) {
  const reset = outside || filtered;
  return (
    <div className={styles.empty}>
      <FeatureIcon name="record" size="large" muted />
      <h3>
        {outside
          ? "Halaman tidak tersedia"
          : filtered
            ? "Tidak ada investigasi yang cocok"
            : "Mulai jejak pemeriksaanmu."}
      </h3>
      <p>
        {outside
          ? "Buka halaman pertama untuk melihat rekaman yang tersedia."
          : filtered
            ? "Ubah atau hapus filter untuk melihat rekaman lain."
            : "Punya tautan atau berkas yang meragukan? Periksa dulu, lalu temukan kembali hasilnya di sini."}
      </p>
      <Link
        href={reset ? PROTECTED_ROUTES.history : PUBLIC_ROUTES.home}
        className={styles.primaryButton}
      >
        {reset ? "Lihat semua investigasi" : "Mulai investigasi"}
        <ArrowRight aria-hidden="true" size={17} />
      </Link>
    </div>
  );
}

export function HistoryListProblem({
  problem,
  retry,
}: {
  problem: LoadProblem;
  retry: () => void;
}) {
  return (
    <div className={styles.problem} role="alert">
      <AlertCircle aria-hidden="true" size={29} />
      <h3>
        {problem.kind === "invalid"
          ? "Filter riwayat tidak valid."
          : problem.kind === "unauthenticated"
            ? "Masuk kembali untuk melihat riwayat."
            : "Riwayat belum dapat dimuat."}
      </h3>
      <p>{problem.message}</p>
      <div>
        {problem.retryable && (
          <button type="button" onClick={retry} className={styles.primaryButton}>
            <RefreshCw aria-hidden="true" size={17} />
            Coba lagi
          </button>
        )}
        <Link
          href={
            problem.kind === "unauthenticated"
              ? AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.history)
              : PROTECTED_ROUTES.history
          }
          className={styles.secondaryButton}
        >
          {problem.kind === "unauthenticated" ? "Masuk kembali" : "Hapus filter"}
        </Link>
      </div>
    </div>
  );
}
