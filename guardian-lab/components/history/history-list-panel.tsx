import { ArrowLeft, ArrowRight, Info, RefreshCw } from "lucide-react";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import { HistoryFilters } from "./history-filters";
import type { HistoryState } from "./history-presentation";
import { HistoryEmpty, HistoryListProblem, HistoryListSkeleton } from "./history-states";
import { HistoryTable } from "./history-table";
import styles from "./history-workspace.module.css";

export function HistoryListPanel({ history }: { history: HistoryState }) {
  const { data, loading, refreshing, problem } = history;
  const modelEvidence = data?.records.some(
    (record) => getInvestigationResult(record)?.technicalEvidence.urlModel,
  );
  const outside = Boolean(data && data.pagination.page > data.pagination.totalPages);
  return (
    <section
      data-user-reveal
      className={styles.listPanel}
      aria-labelledby="history-list-title"
      aria-busy={loading || refreshing}
    >
      <div className={styles.listHeading}>
        <div>
          <h2 id="history-list-title">Daftar pemeriksaan</h2>
          <span role="status">
            {loading
              ? "Memuat..."
              : data
                ? `${data.pagination.total} investigasi`
                : "Belum tersedia"}
          </span>
        </div>
        <button
          type="button"
          disabled={loading || refreshing || !history.filters}
          onClick={history.retry}
          className={styles.secondaryButton}
        >
          <RefreshCw aria-hidden="true" size={18} />
          {refreshing ? "Memperbarui..." : "Perbarui riwayat"}
        </button>
      </div>
      <HistoryFilters values={history.values} onChange={history.setFilter} />
      {loading ? (
        <HistoryListSkeleton />
      ) : !data && problem ? (
        <HistoryListProblem problem={problem} retry={history.retry} />
      ) : (
        data && (
          <>
            {problem && (
              <p role="alert" className={styles.staleWarning}>
                {problem.message} Daftar dan statistik menggunakan data terakhir yang berhasil
                dimuat.
              </p>
            )}
            {modelEvidence && (
              <div className={styles.modelNotice}>
                <Info aria-hidden="true" size={20} />
                <p>
                  <strong>Indikator riset, perlu verifikasi.</strong> Skor rendah belum menjamin
                  tautan aman.
                </p>
              </div>
            )}
            {data.records.length ? (
              <HistoryTable records={data.records} />
            ) : (
              <HistoryEmpty outside={outside} filtered={history.hasFilters} />
            )}
            <nav aria-label="Pagination riwayat" className={styles.pagination}>
              <span>
                Halaman {data.pagination.page} dari {data.pagination.totalPages}
              </span>
              <div>
                <button
                  type="button"
                  disabled={data.pagination.page <= 1}
                  onClick={() => history.setFilter("page", String(data.pagination.page - 1))}
                  className={styles.secondaryButton}
                >
                  <ArrowLeft aria-hidden="true" size={16} />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => history.setFilter("page", String(data.pagination.page + 1))}
                  className={styles.secondaryButton}
                >
                  Berikutnya
                  <ArrowRight aria-hidden="true" size={16} />
                </button>
              </div>
            </nav>
          </>
        )
      )}
    </section>
  );
}
