"use client";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { adminMonitorSchema } from "@/lib/validations/admin";
import styles from "./admin.module.css";
import {
  AdminBadge,
  AdminEmpty,
  AdminHeader,
  AdminLoading,
  AdminMetrics,
  AdminProblem,
  AdminRefresh,
  adminDate,
} from "./admin-ui";

const labels = {
  healthy: "Tersedia",
  unavailable: "Belum tersedia",
  not_configured: "Belum dikonfigurasi",
  configured: "Terkonfigurasi",
};
export function AdminMonitorView({ scope }: { scope: string }) {
  const resource = useApiResource(API_ROUTES.adminMonitor, adminMonitorSchema, { scope });
  const data = resource.data;
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Pantau layanan."
        description="Status operasional database, model URL/QR, broker sandbox dan pengiriman OTP."
        actions={
          <AdminRefresh retry={resource.retry} pending={resource.loading || resource.refreshing} />
        }
      />
      {resource.loading ? (
        <AdminLoading />
      ) : resource.problem ? (
        <AdminProblem problem={resource.problem} retry={resource.retry} />
      ) : (
        data && (
          <>
            <p className={styles.muted}>
              Diperiksa {adminDate(data.checkedAt)}. Versi model pada hasil terakhir:{" "}
              {data.latestModelVersion ?? "belum tercatat"}.
            </p>
            <div className={styles.serviceGrid}>
              {data.services.map((service) => (
                <section key={service.id} className={styles.panel}>
                  <div className={styles.auditHeading}>
                    <h2>{service.name}</h2>
                    <AdminBadge
                      tone={
                        service.status === "healthy"
                          ? "good"
                          : service.status === "configured"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {labels[service.status]}
                    </AdminBadge>
                  </div>
                  <p className={styles.muted}>{service.message}</p>
                  {service.version && <p>Versi layanan: {service.version}</p>}
                  {service.productionReady !== null && (
                    <p className={styles.notice}>
                      {service.productionReady
                        ? "Gate produksi disetujui layanan."
                        : "Mode riset, gate produksi belum terpenuhi."}
                    </p>
                  )}
                </section>
              ))}
            </div>
            <section className={styles.panel}>
              <h2>Status challenge OTP, 24 jam terakhir</h2>
              <p className={styles.muted}>
                Status pengiriman terakhir per challenge, bukan jumlah seluruh percobaan kirim.
                Penerimaan gateway tidak memastikan pesan sampai ke perangkat.
              </p>
              {data.deliveries ? (
                <AdminMetrics
                  items={[
                    { label: "Diterima gateway", value: data.deliveries.queued },
                    { label: "Status gagal", value: data.deliveries.failed },
                    { label: "Belum ada hasil pengiriman", value: data.deliveries.pending },
                  ]}
                />
              ) : (
                <p className={styles.notice}>Data pengiriman belum dapat dibaca.</p>
              )}
            </section>
            <section className={styles.panel}>
              <h2>Sesi sandbox aktif</h2>
              <p className={styles.muted}>
                Hingga 50 sesi yang belum kedaluwarsa. Setiap sesi berakhir otomatis, maksimal 180
                detik.
              </p>
              {data.activeSessions === null ? (
                <p className={styles.notice}>Daftar sesi belum dapat dibaca.</p>
              ) : data.activeSessions.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Sesi</th>
                        <th>Status</th>
                        <th>Mulai (WIB)</th>
                        <th>Kedaluwarsa (WIB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activeSessions.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">
                            <code>{item.id}</code>
                            <small>{item.type}</small>
                          </th>
                          <td data-label="Status">{item.status}</td>
                          <td data-label="Mulai">{adminDate(item.startedAt)}</td>
                          <td data-label="Kedaluwarsa">{adminDate(item.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  title="Tidak ada sesi aktif."
                  description="Sesi baru akan muncul ketika pengguna memulai Ruang Uji."
                />
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
