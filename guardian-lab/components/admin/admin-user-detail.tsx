"use client";
import Link from "next/link";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminUserDetailSchema } from "@/lib/validations/admin";
import styles from "./admin.module.css";
import {
  AdminBadge,
  AdminEmpty,
  AdminHeader,
  AdminLoading,
  AdminMetrics,
  AdminProblem,
  adminDate,
} from "./admin-ui";
import { AdminUserActions } from "./admin-user-actions";
export function AdminUserDetailView({
  id,
  scope,
  currentUserId,
}: {
  id: string;
  scope: string;
  currentUserId: string;
}) {
  const resource = useApiResource(API_ROUTES.adminUser(id), adminUserDetailSchema, { scope });
  if (resource.loading) return <AdminLoading />;
  if (resource.problem) return <AdminProblem problem={resource.problem} retry={resource.retry} />;
  const user = resource.data;
  if (!user) return null;
  return (
    <div className={styles.content}>
      <Link href={ADMIN_ROUTES.users} className={styles.textLink}>
        ← Kembali ke pengguna
      </Link>
      <AdminHeader title={user.name} description={user.email} />
      <section className={styles.panel}>
        <div className={styles.inline}>
          <AdminBadge tone={user.suspendedAt ? "danger" : "good"}>
            {user.suspendedAt ? "Ditangguhkan" : "Aktif"}
          </AdminBadge>
          <AdminBadge>{user.role}</AdminBadge>
          <AdminBadge>
            {user.verified ? "Nomor terverifikasi" : "Nomor belum terverifikasi"}
          </AdminBadge>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>Nomor WhatsApp</dt>
            <dd>{user.phone ?? "Belum diisi"}</dd>
          </div>
          <div>
            <dt>Terdaftar</dt>
            <dd>{adminDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Aktivitas masuk terakhir</dt>
            <dd>{adminDate(user.lastActiveAt)}</dd>
          </div>
        </dl>
        {user.suspensionReason && (
          <p className={styles.notice}>Alasan penangguhan: {user.suspensionReason}</p>
        )}
      </section>
      <AdminMetrics
        items={[
          { label: "Total EXP", value: user.exp },
          { label: "Hari belajar berturut-turut", value: user.streakDays },
          { label: "Investigasi", value: user.investigations },
          { label: "Sesi login aktif", value: user.sessions },
        ]}
      />
      <AdminUserActions
        key={user.updatedAt}
        user={user}
        currentUserId={currentUserId}
        retry={resource.retry}
      />
      <div className={styles.twoColumns}>
        <section className={styles.panel}>
          <h2>Aktivitas terbaru</h2>
          {user.activity.length ? (
            <ul className={styles.activity}>
              {user.activity.map((item) => (
                <li key={item.id}>
                  <div>
                    {item.type === "INVESTIGATION" ? (
                      <Link className={styles.textLink} href={ADMIN_ROUTES.investigation(item.id)}>
                        {item.label}
                      </Link>
                    ) : (
                      <strong>{item.label}</strong>
                    )}
                    <small>{adminDate(item.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty description="Akun ini belum memiliki aktivitas pemeriksaan atau kuis." />
          )}
        </section>
        <section className={styles.panel}>
          <h2>Sesi login</h2>
          <p className={styles.muted}>Menampilkan hingga 20 sesi aktif, tanpa token atau cookie.</p>
          {user.sessionsList.length ? (
            <ul className={styles.activity}>
              {user.sessionsList.map((item, i) => (
                <li key={item.id}>
                  <div>
                    <strong>Sesi {i + 1}</strong>
                    <small>Dibuat {adminDate(item.createdAt)}</small>
                    <small>Berakhir {adminDate(item.expiresAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty description="Tidak ada sesi login aktif." />
          )}
        </section>
      </div>
    </div>
  );
}
