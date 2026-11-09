"use client";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { METRIC_LABELS } from "@/lib/admin/labels";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { INVESTIGATION_STATUS_LABELS } from "@/lib/investigations/presentation";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminReportSchema } from "@/lib/validations/admin";
import styles from "./admin.module.css";
import { AdminChart } from "./admin-chart";
import { AdminHeader, AdminLoading, AdminMetrics, AdminProblem, AdminRefresh } from "./admin-ui";
import { useAdminQuery } from "./use-admin-query";
export function AdminReportsView({ scope }: { scope: string }) {
  const { params, query, change } = useAdminQuery();
  const resource = useApiResource(`${API_ROUTES.adminReports}?${query}`, adminReportSchema, {
    scope,
    delay: 250,
  });
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  async function download() {
    if (active.current || !resource.data || resource.problem || resource.loading) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError(null);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(API_ROUTES.adminReportsExport, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: resource.data.from, to: resource.data.to }),
        signal: controller.signal,
      });
      if (!response.ok || !response.headers.get("content-type")?.includes("text/csv"))
        throw new Error("Ekspor belum dapat dibuat. Periksa rentang tanggal atau masuk kembali.");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `guardian-lab-${resource.data.from}_${resource.data.to}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      if (active.current === controller)
        setError(cause instanceof Error ? cause.message : "Ekspor belum dapat dibuat.");
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  const data = resource.data;
  return (
    <div className={styles.content}>
      <AdminHeader
        title="Lihat perkembangan Guardian Lab."
        description="Statistik agregat berdasarkan periode, tanpa target pemeriksaan atau identitas pribadi dalam ekspor."
        actions={
          <>
            <AdminRefresh
              retry={resource.retry}
              pending={resource.loading || resource.refreshing}
            />
            <button
              type="button"
              className={styles.primary}
              disabled={pending || resource.loading || Boolean(resource.problem) || !data}
              onClick={() => void download()}
            >
              <Download aria-hidden="true" size={17} />
              {pending ? "Menyiapkan..." : "Unduh CSV"}
            </button>
          </>
        }
      />
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            Dari tanggal (Opsional)
            <input
              type="date"
              value={params.get("from") ?? data?.from ?? ""}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label>
            Sampai tanggal (Opsional)
            <input
              type="date"
              value={params.get("to") ?? data?.to ?? ""}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
        </div>
        <p className={styles.muted}>
          Periode default 30 hari, maksimal 366 hari. Penghitungan tanggal mengikuti WIB.
        </p>
      </section>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {resource.loading ? (
        <AdminLoading />
      ) : resource.problem ? (
        <AdminProblem
          problem={resource.problem}
          retry={resource.retry}
          reset={ADMIN_ROUTES.reports}
        />
      ) : (
        data && (
          <>
            <AdminMetrics
              items={Object.entries(data.totals).map(([key, value]) => ({
                label: METRIC_LABELS[key as keyof typeof METRIC_LABELS],
                value,
              }))}
            />
            <section className={styles.panel}>
              <AdminChart data={data} />
            </section>
            <div className={styles.twoColumns}>
              <section className={styles.panel}>
                <h2>Jenis pemeriksaan</h2>
                {data.types.length ? (
                  data.types.map((item) => (
                    <div key={item.label} className={styles.distribution}>
                      <div>
                        <span>{item.label}</span>
                        <strong>{item.value.toLocaleString("id-ID")}</strong>
                      </div>
                      <progress
                        aria-label={`Jumlah pemeriksaan ${item.label}`}
                        value={item.value}
                        max={Math.max(1, data.totals.investigations)}
                      />
                    </div>
                  ))
                ) : (
                  <p className={styles.muted}>Belum ada pemeriksaan pada periode ini.</p>
                )}
              </section>
              <section className={styles.panel}>
                <h2>Status pemeriksaan</h2>
                {data.statuses.length ? (
                  data.statuses.map((item) => (
                    <div className={styles.distribution} key={item.label}>
                      <div>
                        <span>
                          {INVESTIGATION_STATUS_LABELS[
                            item.label as keyof typeof INVESTIGATION_STATUS_LABELS
                          ] ?? item.label}
                        </span>
                        <strong>{item.value.toLocaleString("id-ID")}</strong>
                      </div>
                      <progress
                        aria-label={`Jumlah status ${item.label}`}
                        value={item.value}
                        max={Math.max(1, data.totals.investigations)}
                      />
                    </div>
                  ))
                ) : (
                  <p className={styles.muted}>Belum ada status pemeriksaan untuk ditampilkan.</p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}
