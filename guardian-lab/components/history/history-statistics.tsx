import { FeatureIcon, type FeatureIconName } from "@/components/shared/feature-icon";
import type { HistoryResponse } from "@/lib/validations/history";
import styles from "./history-workspace.module.css";

export function HistoryStatistics({
  summary,
  loading,
}: {
  summary: HistoryResponse["summary"] | null;
  loading: boolean;
}) {
  const statistics: { label: string; value: number | undefined; icon: FeatureIconName }[] = [
    { label: "Investigasi sesuai filter", value: summary?.total, icon: "layers" },
    { label: "Hasil berisiko tinggi", value: summary?.highRisk, icon: "risk" },
    { label: "Model belum tersedia", value: summary?.unavailable, icon: "model" },
  ];
  return (
    <dl
      className={styles.statistics}
      aria-label="Ringkasan riwayat sesuai filter"
      data-user-reveal
      data-user-order="1"
    >
      {statistics.map(({ label, value, icon }) => (
        <div key={label}>
          <dt>
            <FeatureIcon name={icon} muted={value === 0 || value === undefined} />
            {label}
          </dt>
          <dd>
            {value === undefined ? (
              <small>{loading ? "Memuat..." : "Belum tersedia"}</small>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
