import { ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./profile.module.css";

export function ProfileSkeleton() {
  return (
    <output className={styles.skeleton} aria-label="Memuat profil Guardian" aria-busy="true">
      <div className={styles.skeletonHeading} aria-hidden="true" />
      <div className={styles.skeletonIdentity} aria-hidden="true" />
      <div className={styles.skeletonStats} aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} />
        ))}
      </div>
      <div className={styles.columns} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.skeletonActivity} aria-hidden="true" />
    </output>
  );
}
export function ProfileProblem({ problem, retry }: { problem: LoadProblem; retry: () => void }) {
  const access = problem.kind === "unauthenticated" || problem.kind === "forbidden";
  return (
    <section className={styles.problem} role="alert">
      <ShieldCheck size={33} aria-hidden="true" />
      <h1>{access ? "Masuk untuk membuka profilmu." : "Profil belum dapat dimuat."}</h1>
      <p>
        {access
          ? "Sesi atau akses akunmu sudah berubah. Masuk kembali untuk melanjutkan."
          : "Informasi akunmu belum tersedia. Coba muat kembali beberapa saat lagi."}
      </p>
      {access ? (
        <Link
          className={styles.primary}
          href={AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.profile)}
        >
          Masuk kembali
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" className={styles.primary} onClick={retry}>
          <RefreshCw size={17} aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </section>
  );
}
