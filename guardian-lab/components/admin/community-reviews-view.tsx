"use client";
import Link from "next/link";
import { COMMUNITY_STATUS_LABELS } from "@/components/community/community-status";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { communityListSchema } from "@/lib/validations/community";
import styles from "./admin.module.css";
import {
  AdminBadge,
  AdminEmpty,
  AdminHeader,
  AdminLoading,
  AdminPager,
  AdminProblem,
  AdminRefresh,
  adminDate,
} from "./admin-ui";
import { useAdminQuery } from "./use-admin-query";
export function CommunityReviewsView({ scope }: { scope: string }) {
  const { params, query, change, changeMany } = useAdminQuery();
  const resource = useApiResource(
    `${API_ROUTES.adminCommunityReviews}?${query}`,
    communityListSchema,
    { scope, delay: 250 },
  );
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Jaga kualitas kasus komunitas."
        description="Periksa bukti dan privasi, simpan keputusan, lalu pantau publikasi."
        actions={
          <AdminRefresh retry={resource.retry} pending={resource.loading || resource.refreshing} />
        }
      />
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            Cari kasus (Opsional)
            <input
              type="search"
              maxLength={150}
              value={params.get("q") ?? ""}
              onChange={(e) => change("q", e.target.value)}
              placeholder="Judul atau ringkasan..."
            />
          </label>
          <label>
            Status
            <select
              value={params.get("status") ?? "PENDING_REVIEW"}
              onChange={(e) => change("status", e.target.value)}
            >
              {Object.entries(COMMUNITY_STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Publikasi
            <select
              value={params.get("withdrawn") ?? ""}
              onChange={(e) =>
                changeMany({
                  withdrawn: e.target.value,
                  ...(e.target.value === "yes" ? { status: "APPROVED" } : {}),
                })
              }
            >
              <option value="">Semua publikasi</option>
              <option value="no">Belum ditarik</option>
              <option value="yes">Sudah ditarik</option>
            </select>
          </label>
          <label>
            Jenis
            <select
              value={params.get("type") ?? ""}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">Semua jenis</option>
              {["URL", "QR", "APK"].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <Link href={ADMIN_ROUTES.communityReviews} className={styles.textLink}>
            Hapus filter
          </Link>
        </div>
        {resource.loading ? (
          <AdminLoading />
        ) : resource.problem ? (
          <AdminProblem
            problem={resource.problem}
            retry={resource.retry}
            reset={ADMIN_ROUTES.communityReviews}
          />
        ) : (
          resource.data && (
            <>
              {resource.data.items.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Kasus</th>
                        <th>Status</th>
                        <th>Diajukan (WIB)</th>
                        <th>
                          <span className="sr-only">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">
                            {item.title}
                            <small>{item.report?.type ?? "Snapshot lama"} · Pengaju anonim</small>
                          </th>
                          <td data-label="Status">
                            <AdminBadge
                              tone={
                                item.withdrawnAt
                                  ? "warning"
                                  : item.status === "APPROVED"
                                    ? "good"
                                    : "neutral"
                              }
                            >
                              {item.withdrawnAt
                                ? "Publikasi ditarik"
                                : COMMUNITY_STATUS_LABELS[item.status]}
                            </AdminBadge>
                            {item.status === "PENDING_REVIEW" && !item.canReview && (
                              <small>Memerlukan admin lain</small>
                            )}
                          </td>
                          <td data-label="Diajukan">{adminDate(item.createdAt)}</td>
                          <td>
                            <Link
                              className={styles.textLink}
                              href={ADMIN_ROUTES.communityReview(item.id)}
                            >
                              Buka tinjauan →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  title="Antrean pada filter ini kosong."
                  description="Pengajuan yang sesuai akan muncul di sini untuk ditinjau."
                />
              )}
              <AdminPager pagination={resource.data.pagination} change={change} />
            </>
          )
        )}
      </section>
    </div>
  );
}
