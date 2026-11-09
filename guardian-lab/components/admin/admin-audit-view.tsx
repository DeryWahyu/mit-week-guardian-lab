"use client";
import Link from "next/link";
import { ADMIN_ACTION_LABELS } from "@/lib/admin/labels";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminAuditSchema } from "@/lib/validations/admin";
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
export function AdminAuditView({ scope }: { scope: string }) {
  const { query, params, change } = useAdminQuery();
  const resource = useApiResource(`${API_ROUTES.adminAudit}?${query}`, adminAuditSchema, {
    scope,
    delay: 250,
  });
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Jejak keputusan, tercatat."
        description="Catatan tindakan administrator untuk menelusuri perubahan akses, konten, tinjauan dan ekspor."
        actions={
          <AdminRefresh retry={resource.retry} pending={resource.loading || resource.refreshing} />
        }
      />
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            Cari aktivitas (Opsional)
            <input
              type="search"
              maxLength={150}
              value={params.get("q") ?? ""}
              onChange={(e) => change("q", e.target.value)}
              placeholder="Nama admin, ID objek atau alasan..."
            />
          </label>
          <label>
            Tindakan
            <select
              value={params.get("action") ?? ""}
              onChange={(e) => change("action", e.target.value)}
            >
              <option value="">Semua tindakan</option>
              {Object.entries(ADMIN_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Link href={ADMIN_ROUTES.audit} className={styles.textLink}>
            Hapus filter
          </Link>
        </div>
        {resource.loading ? (
          <AdminLoading />
        ) : resource.problem ? (
          <AdminProblem
            problem={resource.problem}
            retry={resource.retry}
            reset={ADMIN_ROUTES.audit}
          />
        ) : (
          resource.data && (
            <>
              {resource.data.items.length ? (
                <ol className={styles.auditList}>
                  {resource.data.items.map((item) => (
                    <li key={item.id}>
                      <div className={styles.auditHeading}>
                        <strong>{ADMIN_ACTION_LABELS[item.action]}</strong>
                        <time>{adminDate(item.createdAt)}</time>
                      </div>
                      <p>Oleh {item.actor}</p>
                      <p className={styles.inline}>
                        <AdminBadge>{item.entityType}</AdminBadge>
                        <code>{item.entityId}</code>
                      </p>
                      {item.reason && <blockquote>{item.reason}</blockquote>}
                      <details>
                        <summary>Rincian perubahan</summary>
                        <pre>{JSON.stringify(item.details, null, 2)}</pre>
                      </details>
                    </li>
                  ))}
                </ol>
              ) : (
                <AdminEmpty
                  title="Belum ada aktivitas yang cocok."
                  description="Tindakan admin yang berhasil akan dicatat otomatis di sini."
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
