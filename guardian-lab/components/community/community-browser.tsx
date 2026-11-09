import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { CommunityCard } from "./community-card";
import { CommunityEmpty } from "./community-empty";
import { CommunityFilters } from "./community-filters";
import type { CommunityListState } from "./community-presentation";
import { CommunityCasesSkeleton, CommunityListProblem } from "./community-states";
import styles from "./community.module.css";

export function CommunityBrowser({ list }: { list: CommunityListState }) {
  const query = list.query;
  if (!query)
    return (
      <section className={styles.problem} role="alert">
        <h2>Filter komunitas tidak valid.</h2>
        <p>Hapus filter untuk membuka kembali daftar kasus.</p>
        <Link href={PROTECTED_ROUTES.community} className={styles.secondaryButton}>
          Hapus filter
        </Link>
      </section>
    );
  const data = list.problem || list.loading ? null : list.data;
  return (
    <section
      data-user-reveal
      className={styles.listPanel}
      aria-labelledby="community-cases-title"
      aria-busy={list.loading || list.refreshing}
    >
      <div className={styles.listHeading}>
        <div>
          <h2 id="community-cases-title">Jelajahi kasus</h2>
          <p>Temukan pola, pahami bukti, ambil pelajarannya.</p>
        </div>
        <span>
          {data ? `${data.pagination.total} kasus` : list.loading ? "Memuat..." : "Belum tersedia"}
        </span>
      </div>
      <CommunityFilters list={list} />
      {list.loading ? (
        <CommunityCasesSkeleton />
      ) : list.problem ? (
        <CommunityListProblem problem={list.problem} retry={list.retry} />
      ) : (
        data && (
          <>
            <p className={styles.resultCount} role="status">
              {data.pagination.total} kasus ditemukan
            </p>
            {data.items.length ? (
              <div className={styles.caseGrid}>
                {data.items.map((item) => (
                  <CommunityCard key={item.id} item={item} presentation="browser" />
                ))}
              </div>
            ) : (
              <CommunityEmpty query={query} totalPages={data.pagination.totalPages} />
            )}
            <nav aria-label="Halaman kasus" className={styles.pagination}>
              <button
                type="button"
                disabled={query.page <= 1}
                onClick={() => list.change("page", String(query.page - 1))}
                className={styles.secondaryButton}
              >
                <ArrowLeft aria-hidden="true" size={18} /> Sebelumnya
              </button>
              <span>
                Halaman {query.page} dari {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={query.page >= data.pagination.totalPages}
                onClick={() => list.change("page", String(query.page + 1))}
                className={styles.secondaryButton}
              >
                Berikutnya <ArrowRight aria-hidden="true" size={18} />
              </button>
            </nav>
          </>
        )
      )}
    </section>
  );
}
