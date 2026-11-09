import { Box, CircleAlert, ClipboardList, Clock3, FileSearch, Info } from "lucide-react";
import { ApkStaticPanel } from "@/components/apk/apk-static-panel";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { explainPermission, getApkStaticReport } from "@/lib/apk/presentation";
import { getInvestigationLabel, getInvestigationMessage } from "@/lib/investigations/presentation";
import type { Investigation } from "@/lib/validations/investigation";
import type { ThreatAnalysisResult } from "@/types/analysis";
import styles from "./history-detail.module.css";

export function HistoryRecordContent({
  record,
  result,
  mode,
}: {
  record: Investigation;
  result: ThreatAnalysisResult | null;
  mode: "human" | "geek";
}) {
  const apkReport = getApkStaticReport(record);
  const pending = record.status === "RECEIVED" || record.status === "PROCESSING";
  const StatusIcon = pending ? Clock3 : record.status === "FAILED" ? CircleAlert : Box;
  return (
    <>
      {!result && (
        <section className={styles.panel} aria-labelledby="record-status-title" data-user-reveal>
          <div className={styles.panelHeading}>
            <span className={styles.panelIcon}>
              <StatusIcon size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 id="record-status-title">{getInvestigationLabel(record)}</h2>
              <p>
                {pending
                  ? "Status akan diperbarui selama halaman terbuka."
                  : "Status proses dan ketersediaan hasil."}
              </p>
            </div>
          </div>
          <p className={styles.summary} aria-live="polite">
            {getInvestigationMessage(record)}
          </p>
          <div className={styles.scopeNote}>
            <Info size={19} aria-hidden="true" />
            <p>
              Belum ada kesimpulan aman atau berbahaya untuk input ini.
              {record.type === "APK" && !apkReport
                ? " Bukti statis belum tersedia. Unggah kembali berkas jika ingin melakukan pemeriksaan ulang."
                : ""}
            </p>
          </div>
        </section>
      )}
      {result && mode === "human" && (
        <section className={styles.panel} aria-labelledby="record-summary-title" data-user-reveal>
          <div className={styles.panelHeading}>
            <FeatureIcon name="record" className={styles.panelIcon} />
            <div>
              <h2 id="record-summary-title">Ringkasan pemeriksaan</h2>
              <p>Penjelasan dari hasil yang tersimpan.</p>
            </div>
          </div>
          <p className={styles.summary}>{result.humanFriendlySummary}</p>
          <div className={styles.findingsHeading}>
            <ClipboardList size={19} aria-hidden="true" />
            <h3>Temuan yang tercatat</h3>
          </div>
          {result.deceptionTricks.length ? (
            <ol className={styles.findings}>
              {result.deceptionTricks.map((finding, index) => (
                <li key={`${index}-${finding}`}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <p>{finding}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.emptyFinding}>
              <FileSearch size={23} aria-hidden="true" />
              <p>
                Tidak ada catatan tambahan pada hasil ini. Tetap perhatikan cakupan dan batas
                pemeriksaannya.
              </p>
            </div>
          )}
          {!apkReport && Boolean(result.technicalEvidence.permissions?.length) && (
            <div className={styles.permissions}>
              <h3>Izin yang tercatat</h3>
              <ul>
                {result.technicalEvidence.permissions?.map((permission) => (
                  <li key={permission}>
                    <p>{explainPermission(permission)}</p>
                    <code>{permission}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      {apkReport && (
        <div className={styles.staticReport} data-user-reveal>
          <ApkStaticPanel
            report={apkReport}
            presentation="workspace"
            mode={mode}
            sha256={
              typeof record.inputMetadata.sha256 === "string"
                ? record.inputMetadata.sha256
                : undefined
            }
          />
        </div>
      )}
    </>
  );
}
