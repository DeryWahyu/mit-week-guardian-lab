"use client";

import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { platformOverviewSchema } from "@/lib/validations/platform";
import styles from "./community.module.css";

export function PlatformStats() {
  const resource = useApiResource(API_ROUTES.platformOverview, platformOverviewSchema, {
    scope: "public-overview",
  });
  const data = resource.data;
  return (
    <div className={styles.metrics} data-landing-reveal>
      {resource.loading ? (
        <output aria-label="Memuat statistik" aria-busy="true" className={styles.stats}>
          {[0, 1, 2].map((item) => (
            <div key={item} className={styles.statSkeleton} aria-hidden="true">
              <span />
              <span />
            </div>
          ))}
        </output>
      ) : resource.problem || !data ? (
        <div role="alert" className={styles.problem}>
          <p>Statistik belum dapat dimuat.</p>
          <button type="button" onClick={resource.retry}>
            Coba lagi
          </button>
        </div>
      ) : (
        <dl className={styles.stats} aria-label="Aktivitas platform">
          {[
            { label: "Tautan URL/QR diajukan", count: data.links },
            { label: "APK diunggah untuk diperiksa", count: data.apks },
            { label: "Kasus komunitas disetujui", count: data.cases },
          ].map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.count.toLocaleString("id-ID")}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={styles.source}>Angka berasal dari aktivitas platform.</p>
    </div>
  );
}
