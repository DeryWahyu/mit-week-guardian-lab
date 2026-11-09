import { ArrowLeft, ArrowRight, ArrowUpDown, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { LoadProblem } from "@/lib/investigations/client";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import shared from "./community.module.css";
import type { RankingData } from "./leaderboard-presentation";
import { LeaderboardEmpty, LeaderboardProblem, LeaderboardSkeleton } from "./leaderboard-states";
import { RankingList } from "./ranking-list";
import styles from "./leaderboard.module.css";

export function LeaderboardPanel({
  data,
  loading,
  refreshing,
  problem,
  retry,
}: {
  data: RankingData | null;
  loading: boolean;
  refreshing: boolean;
  problem: LoadProblem | null;
  retry: () => void;
}) {
  const available = !loading && !problem ? data : null;
  const outside = Boolean(available && available.page > available.totalPages);
  const previous =
    available && available.page > 1 ? PROTECTED_ROUTES.leaderboardPage(available.page - 1) : null;
  const next =
    available && available.page < available.totalPages
      ? PROTECTED_ROUTES.leaderboardPage(available.page + 1)
      : null;
  const first = available?.items[0];
  const last = available?.items.at(-1);
  return (
    <section
      data-user-reveal
      id="peringkat"
      className={styles.panel}
      aria-labelledby="leaderboard-list-title"
      aria-busy={loading || refreshing}
    >
      <div className={styles.panelHeading}>
        <div>
          <h2 id="leaderboard-list-title">
            Papan peringkat
            <span role="status" className={styles.count}>
              {loading
                ? "Memuat..."
                : available
                  ? `${available.total.toLocaleString("id-ID")} Guardian`
                  : "Belum tersedia"}
            </span>
          </h2>
          <p>Belajar konsisten, kumpulkan pengalaman.</p>
        </div>
        <button
          type="button"
          disabled={loading || refreshing}
          onClick={retry}
          className={cn(shared.secondaryButton, styles.refresh)}
        >
          <RefreshCw aria-hidden="true" size={17} />
          {refreshing ? "Memperbarui..." : "Perbarui peringkat"}
        </button>
      </div>
      <div className={styles.listDescription}>
        <span>
          <ShieldCheck aria-hidden="true" size={17} />
          Alias Guardian
        </span>
        <span>
          <ArrowUpDown aria-hidden="true" size={15} />
          EXP tertinggi
        </span>
      </div>
      {loading ? (
        <LeaderboardSkeleton />
      ) : problem ? (
        <LeaderboardProblem problem={problem} retry={retry} />
      ) : (
        available && (
          <>
            {available.items.length ? (
              <RankingList items={available.items} />
            ) : (
              <LeaderboardEmpty outside={outside} />
            )}
            <nav className={styles.pagination} aria-label="Halaman peringkat">
              <div>
                <span>
                  Halaman {available.page} dari {available.totalPages}
                </span>
                {first && last && (
                  <span>
                    {first.position}–{last.position} dari {available.total.toLocaleString("id-ID")}{" "}
                    Guardian
                  </span>
                )}
              </div>
              <div className={styles.paginationActions}>
                {previous ? (
                  <Link href={previous} className={shared.secondaryButton}>
                    <ArrowLeft aria-hidden="true" size={15} />
                    Sebelumnya
                  </Link>
                ) : (
                  <button type="button" disabled className={shared.secondaryButton}>
                    <ArrowLeft aria-hidden="true" size={15} />
                    Sebelumnya
                  </button>
                )}
                {next ? (
                  <Link href={next} className={shared.secondaryButton}>
                    Berikutnya
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                ) : (
                  <button type="button" disabled className={shared.secondaryButton}>
                    Berikutnya
                    <ArrowRight aria-hidden="true" size={15} />
                  </button>
                )}
              </div>
            </nav>
          </>
        )
      )}
    </section>
  );
}
