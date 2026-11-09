"use client";
import Link from "next/link";
import { REVIEW_LABELS } from "@/lib/admin/labels";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { INVESTIGATION_STATUS_LABELS } from "@/lib/investigations/presentation";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminInvestigationsSchema } from "@/lib/validations/admin";
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
export function AdminInvestigationsView({ scope }: { scope: string }) {
  const { query, params, change } = useAdminQuery();
  const resource = useApiResource(
    `${API_ROUTES.adminInvestigations}?${query}`,
    adminInvestigationsSchema,
    { scope, delay: 250 },
  );
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Tinjau investigasi."
        description="Baca hasil tersimpan dan catat tindak lanjut tanpa mengubah skor model."
        actions={
          <AdminRefresh retry={resource.retry} pending={resource.loading || resource.refreshing} />
        }
      />
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            Cari target (Opsional)
            <input
              type="search"
              aria-label="Cari target investigasi"
              value={params.get("q") ?? ""}
              maxLength={150}
              placeholder="Domain dinonaktifkan atau nama berkas..."
              onChange={(e) => change("q", e.target.value)}
            />
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
          <label>
            Status
            <select
              value={params.get("status") ?? ""}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Semua status</option>
              {Object.entries(INVESTIGATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tinjauan
            <select
              value={params.get("review") ?? ""}
              onChange={(e) => change("review", e.target.value)}
            >
              <option value="">Semua tinjauan</option>
              {Object.entries(REVIEW_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dari tanggal (Opsional)
            <input
              type="date"
              value={params.get("from") ?? ""}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label>
            Sampai tanggal (Opsional)
            <input
              type="date"
              value={params.get("to") ?? ""}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
          <Link className={styles.textLink} href={ADMIN_ROUTES.investigations}>
            Hapus filter
          </Link>
        </div>
        {resource.loading ? (
          <AdminLoading />
        ) : resource.problem ? (
          <AdminProblem
            problem={resource.problem}
            retry={resource.retry}
            reset={ADMIN_ROUTES.investigations}
          />
        ) : (
          resource.data && (
            <>
              {resource.data.items.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Pemeriksaan</th>
                        <th>Status</th>
                        <th>Tinjauan admin</th>
                        <th>Tanggal (WIB)</th>
                        <th>
                          <span className="sr-only">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.items.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">
                            <span className={styles.target}>{item.target}</span>
                            <small>
                              {item.type} · {item.owner}
                            </small>
                          </th>
                          <td data-label="Status">
                            <AdminBadge>{INVESTIGATION_STATUS_LABELS[item.status]}</AdminBadge>
                            {item.riskScore !== null && (
                              <small>Indikator: {item.riskScore}/100, perlu verifikasi</small>
                            )}
                          </td>
                          <td data-label="Tinjauan">
                            {item.review ? (
                              <AdminBadge
                                tone={item.review.status === "REVIEWED" ? "good" : "warning"}
                              >
                                {REVIEW_LABELS[item.review.status]}
                              </AdminBadge>
                            ) : (
                              <span className={styles.muted}>Belum ditinjau</span>
                            )}
                          </td>
                          <td data-label="Tanggal">{adminDate(item.createdAt)}</td>
                          <td>
                            <Link
                              className={styles.textLink}
                              href={ADMIN_ROUTES.investigation(item.id)}
                            >
                              Tinjau hasil →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  title="Tidak ada investigasi yang cocok."
                  description="Ubah filter atau tunggu pemeriksaan baru dari pengguna."
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
