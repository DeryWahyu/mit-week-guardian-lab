import { AlertCircle, ArrowRight, BookOpen, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import shared from "./community.module.css";
import styles from "./leaderboard.module.css";
import { LeaderboardHero } from "./leaderboard-hero";

export function LeaderboardSkeleton() {
  return (
    <output className={styles.skeleton} aria-label="Memuat peringkat Guardian" aria-busy="true">
      <div aria-hidden="true" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </output>
  );
}

export function LeaderboardPageSkeleton() {
  return (
    <div className={styles.content}>
      <LeaderboardHero />
      <section className={styles.panel}>
        <LeaderboardSkeleton />
      </section>
    </div>
  );
}

export function LeaderboardEmpty({ outside }: { outside: boolean }) {
  return (
    <div className={styles.empty}>
      <FeatureIcon name="rank" className={styles.emptyIcon} muted />
      <h3>
        {outside
          ? "Halaman peringkat tidak tersedia"
          : "Perjalanan hebat dimulai dari satu latihan."}
      </h3>
      <p>
        {outside
          ? "Kembali ke halaman pertama untuk melihat peringkat Guardian yang tersedia."
          : "Belum ada Guardian yang memperoleh EXP. Selesaikan latihan pertamamu dan mulai isi papan peringkat ini."}
      </p>
      <Link
        href={outside ? PROTECTED_ROUTES.leaderboard : PROTECTED_ROUTES.academy}
        className={shared.primaryButton}
      >
        {outside ? (
          <Trophy aria-hidden="true" size={19} />
        ) : (
          <BookOpen aria-hidden="true" size={19} />
        )}
        {outside ? "Lihat peringkat pertama" : "Mulai belajar"}
        <ArrowRight aria-hidden="true" size={18} />
      </Link>
      {!outside && (
        <span className={styles.emptyNote}>EXP pertama membuka langkahmu di papan peringkat.</span>
      )}
    </div>
  );
}

export function LeaderboardProblem({
  problem,
  retry,
}: {
  problem: LoadProblem;
  retry: () => void;
}) {
  const access = problem.kind === "unauthenticated" || problem.kind === "forbidden";
  return (
    <div className={styles.problem} role="alert">
      <AlertCircle aria-hidden="true" size={28} />
      <h3>{access ? "Masuk kembali untuk melihat peringkat." : "Peringkat belum dapat dimuat."}</h3>
      <p>
        {access
          ? "Sesi atau akses akunmu perlu diperbarui. Masuk kembali untuk melanjutkan."
          : "Daftar peringkat belum tersedia saat ini. Coba muat kembali beberapa saat lagi."}
      </p>
      <div>
        {problem.retryable && (
          <button type="button" onClick={retry} className={shared.primaryButton}>
            <RefreshCw aria-hidden="true" size={17} />
            Coba lagi
          </button>
        )}
        <Link
          href={
            access
              ? AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.leaderboard)
              : PROTECTED_ROUTES.community
          }
          className={shared.secondaryButton}
        >
          {access ? "Masuk kembali" : "Kembali ke komunitas"}
        </Link>
      </div>
    </div>
  );
}
