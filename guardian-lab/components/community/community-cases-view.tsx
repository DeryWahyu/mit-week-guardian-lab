"use client";

import Link from "next/link";
import { ResultSkeleton } from "@/components/landing/results/result-skeleton";
import { InvestigationProblem } from "@/components/shared/investigation-problem";
import { ADMIN_ROUTES } from "@/lib/routes";
import { CommunityBrowser } from "./community-browser";
import { CommunityCard } from "./community-card";
import { useCommunityList } from "./use-community-list";

const control =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-600";

export function CommunityCasesView({ scope, admin = false }: { scope: string; admin?: boolean }) {
  const list = useCommunityList(scope, admin);
  if (!admin) return <CommunityBrowser list={list} />;
  const query = list.query;
  if (!query)
    return (
      <div className="space-y-3 rounded-xl border bg-white p-6">
        <p>Filter komunitas tidak valid.</p>
        <Link href={ADMIN_ROUTES.communityReviews} className="underline">
          Hapus filter
        </Link>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          Status
          <select
            aria-label="Status pengajuan"
            value={query.status ?? "PENDING_REVIEW"}
            onChange={(event) => list.change("status", event.target.value)}
            className={`${control} block`}
          >
            <option value="PENDING_REVIEW">Menunggu tinjauan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          Jenis
          <select
            aria-label="Jenis investigasi"
            value={query.type ?? ""}
            onChange={(event) => list.change("type", event.target.value)}
            className={`${control} block`}
          >
            <option value="">Semua jenis</option>
            {["URL", "QR", "APK"].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-600">
          Cari kasus (Opsional)
          <input
            type="search"
            placeholder="Cari judul atau ringkasan"
            aria-label="Cari kasus"
            maxLength={150}
            value={query.q}
            onChange={(event) => list.change("q", event.target.value)}
            className={`${control} block`}
          />
        </label>
        <button
          type="button"
          onClick={list.retry}
          disabled={list.refreshing || list.loading}
          className={control}
        >
          {list.refreshing ? "Memperbarui…" : "Perbarui daftar"}
        </button>
      </div>
      {list.loading ? (
        <ResultSkeleton />
      ) : list.problem ? (
        <InvestigationProblem problem={list.problem} onRetry={list.retry} />
      ) : (
        list.data && (
          <>
            <p aria-live="polite" className="text-sm text-slate-500">
              {list.data.pagination.total} kasus ditemukan
            </p>
            {list.data.items.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {list.data.items.map((item) => (
                  <CommunityCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="font-bold text-slate-900">
                  {query.page > list.data.pagination.totalPages
                    ? "Halaman di luar daftar"
                    : query.q || query.type
                      ? "Tidak ada kasus yang cocok"
                      : "Belum ada kasus pada daftar ini"}
                </h2>
                <p className="text-sm text-slate-600">
                  Pengajuan baru akan muncul setelah pengguna mengirimkannya.
                </p>
              </div>
            )}
            <nav
              aria-label="Halaman kasus"
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <button
                type="button"
                disabled={query.page <= 1}
                onClick={() => list.change("page", String(query.page - 1))}
                className={`${control} disabled:opacity-50`}
              >
                Sebelumnya
              </button>
              <span>
                Halaman {query.page} dari {list.data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={query.page >= list.data.pagination.totalPages}
                onClick={() => list.change("page", String(query.page + 1))}
                className={`${control} disabled:opacity-50`}
              >
                Berikutnya
              </button>
            </nav>
          </>
        )
      )}
    </div>
  );
}
