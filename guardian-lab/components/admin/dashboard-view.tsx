"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminDashboardData } from "@/lib/admin/dashboard";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { INVESTIGATION_STATUS_LABELS } from "@/lib/investigations/presentation";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminReportSchema } from "@/lib/validations/admin";
import styles from "./admin.module.css";
import { AdminChart } from "./admin-chart";
import { AdminEmpty, AdminHeader, AdminLoading, AdminMetrics, AdminProblem } from "./admin-ui";
import { useAdminQuery } from "./use-admin-query";
export function DashboardView({ data, scope }: { data: AdminDashboardData; scope: string }) {
  const router = useRouter();
  const { params, query, change } = useAdminQuery();
  const report = useApiResource(`${API_ROUTES.adminReports}?${query}`, adminReportSchema, {
    scope,
    delay: 250,
  });
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Ruang kendali Guardian Lab."
        description="Pantau aktivitas, kelola layanan, dan tindak lanjuti hal yang perlu perhatian."
        actions={
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              router.refresh();
              report.retry();
            }}
          >
            Perbarui ringkasan
          </button>
        }
      />
      <AdminMetrics
        items={[
          { label: "Guardian terdaftar", value: data.users },
          { label: "Seluruh investigasi", value: data.investigations },
          { label: "Sandbox aktif saat ini", value: data.activeSessions },
          { label: "Menunggu moderasi", value: data.pendingReviews },
        ]}
      />
      <section className={styles.panel}>
        <div className={styles.auditHeading}>
          <h2>Tren aktivitas pemeriksaan</h2>
          <Link
            href={ADMIN_ROUTES.reports + (query ? `?${query}` : "")}
            className={styles.textLink}
          >
            Buka laporan →
          </Link>
        </div>
        <div className={styles.filters}>
          <label>
            Dari tanggal (Opsional)
            <input
              type="date"
              value={params.get("from") ?? report.data?.from ?? ""}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label>
            Sampai tanggal (Opsional)
            <input
              type="date"
              value={params.get("to") ?? report.data?.to ?? ""}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
        </div>
        {report.loading ? (
          <AdminLoading />
        ) : report.problem ? (
          <AdminProblem
            problem={report.problem}
            retry={report.retry}
            reset={ADMIN_ROUTES.dashboard}
          />
        ) : (
          report.data && <AdminChart data={report.data} />
        )}
      </section>
      <div className={styles.twoColumns}>
        <section className={styles.panel}>
          <div className={styles.auditHeading}>
            <h2>Perlu ditinjau</h2>
            <Link href={ADMIN_ROUTES.communityReviews} className={styles.textLink}>
              Buka moderasi →
            </Link>
          </div>
          {data.reviewQueue.length ? (
            <ul className={styles.activity}>
              {data.reviewQueue.map((item) => (
                <li key={item.id}>
                  <div>
                    <Link className={styles.textLink} href={ADMIN_ROUTES.communityReview(item.id)}>
                      {item.title}
                    </Link>
                    <small>{item.scamType}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty
              title="Antrean moderasi kosong."
              description="Pengajuan baru akan muncul di sini untuk ditinjau."
            />
          )}
        </section>
        <section className={styles.panel}>
          <div className={styles.auditHeading}>
            <h2>Investigasi terbaru</h2>
            <Link href={ADMIN_ROUTES.investigations} className={styles.textLink}>
              Lihat semua →
            </Link>
          </div>
          {data.recentInvestigations.length ? (
            <ul className={styles.activity}>
              {data.recentInvestigations.map((item) => (
                <li key={item.id}>
                  <div>
                    <Link className={styles.textLink} href={ADMIN_ROUTES.investigation(item.id)}>
                      <span className={styles.target}>{item.defangedTarget}</span>
                    </Link>
                    <small>
                      {item.type} · {INVESTIGATION_STATUS_LABELS[item.status]}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty
              title="Belum ada investigasi."
              description="Pemeriksaan URL, QR dan APK akan muncul setelah dibuat pengguna."
            />
          )}
        </section>
      </div>
      <section className={styles.callout}>
        <div>
          <h2>Rawat ruang belajar.</h2>
          <p>
            {data.quizzes.toLocaleString("id-ID")} kuis tersimpan di Academy. Tinjau materi dan
            pembahasannya agar tetap relevan.
          </p>
        </div>
        <Link href={ADMIN_ROUTES.quizzes} className={styles.primary}>
          Kelola Academy →
        </Link>
      </section>
    </div>
  );
}
