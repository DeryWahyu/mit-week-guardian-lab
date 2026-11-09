"use client";
import Link from "next/link";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminUsersSchema } from "@/lib/validations/admin";
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
export function AdminUsersView({ scope }: { scope: string }) {
  const { query, params, change } = useAdminQuery();
  const resource = useApiResource(`${API_ROUTES.adminUsers}?${query}`, adminUsersSchema, {
    scope,
    delay: 250,
  });
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Kelola pengguna."
        description="Tinjau akun, verifikasi, sesi aktif dan akses Guardian."
        actions={
          <AdminRefresh retry={resource.retry} pending={resource.loading || resource.refreshing} />
        }
      />
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            Cari pengguna (Opsional)
            <input
              type="search"
              aria-label="Cari pengguna"
              value={params.get("q") ?? ""}
              maxLength={150}
              placeholder="Nama, email atau ID..."
              onChange={(e) => change("q", e.target.value)}
            />
          </label>
          <label>
            Peran
            <select
              value={params.get("role") ?? ""}
              onChange={(e) => change("role", e.target.value)}
            >
              <option value="">Semua peran</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={params.get("status") ?? ""}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </label>
          <label>
            Verifikasi
            <select
              value={params.get("verified") ?? ""}
              onChange={(e) => change("verified", e.target.value)}
            >
              <option value="">Semua akun</option>
              <option value="yes">Terverifikasi</option>
              <option value="no">Belum terverifikasi</option>
            </select>
          </label>
          <Link href={ADMIN_ROUTES.users} className={styles.textLink}>
            Hapus filter
          </Link>
        </div>
        {resource.loading ? (
          <AdminLoading />
        ) : resource.problem ? (
          <AdminProblem
            problem={resource.problem}
            retry={resource.retry}
            reset={ADMIN_ROUTES.users}
          />
        ) : (
          resource.data && (
            <>
              {resource.data.items.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Guardian</th>
                        <th>Akses</th>
                        <th>Aktivitas</th>
                        <th>Terdaftar</th>
                        <th>
                          <span className="sr-only">Aksi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.items.map((user) => (
                        <tr key={user.id}>
                          <th scope="row">
                            <Link className={styles.textLink} href={ADMIN_ROUTES.user(user.id)}>
                              {user.name}
                            </Link>
                            <small>{user.email}</small>
                          </th>
                          <td data-label="Akses">
                            <AdminBadge tone={user.suspendedAt ? "danger" : "good"}>
                              {user.suspendedAt ? "Ditangguhkan" : "Aktif"}
                            </AdminBadge>
                            <small>
                              {user.role} ·{" "}
                              {user.verified ? "Terverifikasi" : "Belum terverifikasi"}
                            </small>
                          </td>
                          <td data-label="Aktivitas">
                            {user.exp.toLocaleString("id-ID")} EXP
                            <small>
                              {user.investigations} pemeriksaan · {user.sessions} sesi aktif
                            </small>
                          </td>
                          <td data-label="Terdaftar">{adminDate(user.createdAt)}</td>
                          <td>
                            <Link className={styles.textLink} href={ADMIN_ROUTES.user(user.id)}>
                              Kelola akun →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  title="Tidak ada pengguna yang cocok."
                  description="Ubah atau hapus filter untuk melihat akun lainnya."
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
