"use client";

import { Info } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { DualModeToggle } from "@/components/shared/dual-mode-toggle";
import { InvestigationProblem } from "@/components/shared/investigation-problem";
import { UrlModelNotice } from "@/components/shared/url-model-notice";
import { useInvestigation } from "@/lib/hooks/use-investigation";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./history-detail.module.css";
import { HistoryDetailHeading, HistoryRecordSkeleton } from "./history-detail-frame";
import { HistoryEvidencePanel } from "./history-evidence-panel";
import { HistoryRecordContent } from "./history-record-content";
import { HistoryRecordOverview } from "./history-record-overview";
import { HistoryRecordSidebar } from "./history-record-sidebar";

export function HistoryDetailView({
  recordId,
  accessScope,
}: {
  recordId: string;
  accessScope?: string;
}) {
  const resource = useInvestigation(recordId, accessScope);
  const params = useSearchParams();
  const pathname = usePathname();
  const mode = params.get("mode") === "geek" ? "geek" : "human";
  const record = resource.record;
  const result = record ? getInvestigationResult(record) : null;
  function searchEvidence(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("evidence", value);
    else next.delete("evidence");
    const query = next.toString();
    window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  }
  return (
    <div className={styles.content}>
      <HistoryDetailHeading />
      {resource.loading ? (
        <HistoryRecordSkeleton />
      ) : !record && resource.problem ? (
        <InvestigationProblem
          presentation="workspace"
          problem={resource.problem}
          onRetry={resource.retry}
          id={recordId}
          returnTo={PROTECTED_ROUTES.historyDetail(recordId)}
        />
      ) : record ? (
        <>
          {resource.problem && (
            <div className={styles.notice} role="alert">
              <Info size={21} aria-hidden="true" />
              <p>
                {resource.problem.message} Tampilan memakai rekaman terakhir yang berhasil dimuat.
              </p>
            </div>
          )}
          <HistoryRecordOverview
            record={record}
            result={result}
            refreshing={resource.refreshing}
            onRefresh={resource.retry}
          />
          {(record.inputMetadata.isDemo === true || record.analysisSource === "LOCAL_DEMO") && (
            <aside className={styles.notice} aria-label="Data simulasi lokal">
              <Info size={21} aria-hidden="true" />
              <p>
                <strong>Rekaman simulasi lokal.</strong> Data ini dibuat oleh seeder. Skor dan
                temuan demo bukan hasil pemeriksaan berkas atau model AI.
              </p>
            </aside>
          )}
          <div className={styles.layout}>
            <div className={styles.reportColumn}>
              <section
                className={styles.modePanel}
                aria-label="Pilihan tampilan hasil"
                data-user-reveal
              >
                <div>
                  <h2>Pahami hasilnya.</h2>
                  <p>Satu rekaman, dua cara membaca bukti.</p>
                </div>
                <DualModeToggle mode={mode} className={styles.modeToggle} />
              </section>
              {result?.technicalEvidence.urlModel && (
                <div className={styles.modelNotice}>
                  <UrlModelNotice model={result.technicalEvidence.urlModel} />
                </div>
              )}
              <HistoryRecordContent record={record} result={result} mode={mode} />
              {mode === "geek" && (
                <HistoryEvidencePanel
                  record={record}
                  search={params.get("evidence") ?? ""}
                  onSearchChange={searchEvidence}
                />
              )}
            </div>
            <HistoryRecordSidebar record={record} canShare={Boolean(result)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
