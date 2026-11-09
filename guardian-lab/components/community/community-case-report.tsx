import { FileSearch, Info } from "lucide-react";
import { DualModeToggle } from "@/components/shared/dual-mode-toggle";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { TechnicalEvidencePanel } from "@/components/shared/technical-evidence-panel";
import { UrlModelNotice } from "@/components/shared/url-model-notice";
import { explainPermission } from "@/lib/apk/presentation";
import type { CommunityReport } from "@/lib/validations/community";
import styles from "./community-case.module.css";

export function CommunityCaseReport({
  report,
  mode,
  search,
  onSearchChange,
}: {
  report: CommunityReport;
  mode: "human" | "geek";
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className={styles.reportColumn}>
      <section className={styles.modePanel} aria-label="Pilihan tampilan bukti" data-user-reveal>
        <div>
          <h2>Pelajari buktinya.</h2>
          <p>Satu snapshot, dua cara memahami.</p>
        </div>
        <DualModeToggle mode={mode} className={styles.modeToggle} />
      </section>
      {report.analysisSource === "LOCAL_DEMO" && (
        <aside className={styles.notice} aria-label="Data simulasi lokal">
          <Info size={20} aria-hidden="true" />
          <p>
            <strong>Kasus simulasi.</strong> Data demo disiapkan untuk pembelajaran, bukan hasil
            pemeriksaan model pada berkas nyata.
          </p>
        </aside>
      )}
      {report.technicalEvidence.urlModel && (
        <div className={styles.modelNotice}>
          <UrlModelNotice model={report.technicalEvidence.urlModel} />
        </div>
      )}
      {mode === "geek" ? (
        <TechnicalEvidencePanel
          id="case-evidence"
          evidence={report.technicalEvidence}
          metadata={{
            schemaVersion: report.schemaVersion,
            type: report.type,
            analysisSource: report.analysisSource,
            modelVersion: report.modelVersion,
            analyzedAt: report.analyzedAt,
          }}
          description="Bukti yang diizinkan pada snapshot komunitas."
          metadataTitle="Metadata snapshot tersimpan"
          search={search}
          onSearchChange={onSearchChange}
        />
      ) : (
        <>
          <section className={styles.panel} aria-labelledby="case-summary-title" data-user-reveal>
            <div className={styles.panelHeading}>
              <FeatureIcon name="record" />
              <div>
                <h2 id="case-summary-title">Ringkasan kasus</h2>
                <p>Mulai dari konteks, lalu cermati petunjuknya.</p>
              </div>
            </div>
            <p className={styles.summary}>{report.summary}</p>
            <h3 className={styles.findingsTitle}>Temuan yang bisa dipelajari</h3>
            {report.deceptionTricks.length ? (
              <ol className={styles.findings}>
                {report.deceptionTricks.map((finding, index) => (
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
                  Tidak ada temuan tambahan pada snapshot ini. Kondisi tersebut tidak menjamin
                  target aman.
                </p>
              </div>
            )}
          </section>
          {Boolean(report.technicalEvidence.permissions?.length) && (
            <section
              className={styles.panel}
              aria-labelledby="case-permissions-title"
              data-user-reveal
            >
              <div className={styles.panelHeading}>
                <FeatureIcon name="permissions" />
                <div>
                  <h2 id="case-permissions-title">Kenali izin yang diminta</h2>
                  <p>Izin adalah kemampuan akses, bukan bukti penyalahgunaan.</p>
                </div>
              </div>
              <ul className={styles.permissionList}>
                {report.technicalEvidence.permissions?.map((permission) => (
                  <li key={permission}>
                    <p>{explainPermission(permission)}</p>
                    <code>{permission}</code>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <p className={styles.privacy}>
        <Info size={17} aria-hidden="true" />
        Snapshot ini hanya memuat bukti tersanitasi. Nilai dan temuan mengikuti hasil yang disimpan.
      </p>
    </div>
  );
}
