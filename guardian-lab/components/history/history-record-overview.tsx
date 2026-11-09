import { Box, CalendarDays, CircleAlert, CircleCheck, Clock3, RefreshCw } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { getInvestigationLabel, getRiskPresentation } from "@/lib/investigations/presentation";
import { cn } from "@/lib/utils";
import type { Investigation } from "@/lib/validations/investigation";
import type { ThreatAnalysisResult } from "@/types/analysis";
import styles from "./history-detail.module.css";
import { recordDate, recordSource, recordTypeLabels } from "./history-detail-presentation";

export function HistoryRecordOverview({
  record,
  result,
  refreshing,
  onRefresh,
}: {
  record: Investigation;
  result: ThreatAnalysisResult | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const typeIcon = record.type === "APK" ? "apk" : record.type === "QR" ? "qr" : "url";
  const StatusIcon =
    record.status === "FAILED"
      ? CircleAlert
      : ["RECEIVED", "PROCESSING"].includes(record.status)
        ? Clock3
        : result
          ? CircleCheck
          : Box;
  const model = result?.technicalEvidence.urlModel;
  const risk = result ? getRiskPresentation(result.riskLevel, model) : null;
  return (
    <section
      className={styles.overview}
      aria-label="Ringkasan rekaman pemeriksaan"
      data-user-reveal
    >
      <div className={styles.overviewMain}>
        <div className={styles.targetBlock}>
          <FeatureIcon name={typeIcon} className={styles.typeIcon} />
          <div>
            <span className={styles.typeLabel}>{recordTypeLabels[record.type]}</span>
            <h2>Objek pemeriksaan</h2>
            <p className={styles.target}>{record.defangedTarget}</p>
            {result && <span className={styles.category}>{result.scamCategory}</span>}
          </div>
        </div>
        <div className={styles.score} data-level={result?.riskLevel}>
          {result && risk ? (
            <>
              <span>{model ? "Skor indikator model" : "Skor risiko tersimpan"}</span>
              <strong>
                {result.riskScore}
                <small>/100</small>
              </strong>
              <span className={styles.riskLabel}>{risk.label}</span>
              <p>
                {model ? "Indikator riset, perlu verifikasi." : "Mengikuti hasil yang tersimpan."}
              </p>
            </>
          ) : (
            <>
              <Box size={27} aria-hidden="true" />
              <strong className={styles.noScore}>Belum dinilai</strong>
              <p>Skor dan kesimpulan belum tersedia.</p>
            </>
          )}
        </div>
      </div>
      <div className={styles.overviewFooter}>
        <span className={styles.statusBadge} data-status={record.status}>
          <StatusIcon size={15} aria-hidden="true" />
          {getInvestigationLabel(record)}
        </span>
        <span className={styles.receivedDate}>
          <CalendarDays size={15} aria-hidden="true" />
          <time dateTime={record.createdAt}>{recordDate(record.createdAt)}</time>
        </span>
        <span className={styles.sourceLabel}>{recordSource(record)}</span>
        <button type="button" className={styles.refresh} disabled={refreshing} onClick={onRefresh}>
          <RefreshCw
            size={16}
            aria-hidden="true"
            className={cn(refreshing && "animate-spin motion-reduce:animate-none")}
          />
          {refreshing ? "Memperbarui..." : "Perbarui status"}
        </button>
        <span className="sr-only" aria-live="polite">
          {refreshing ? "Memperbarui status rekaman." : ""}
        </span>
      </div>
    </section>
  );
}
