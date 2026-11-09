import { ArrowRight, Box, CircleAlert, Clock3, FileSearch } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import {
  getInvestigationLabel,
  getInvestigationMessage,
  getInvestigationResult,
  getRiskPresentation,
} from "@/lib/investigations/presentation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import { formatHistoryDate } from "./history-presentation";
import styles from "./history-table.module.css";

export function HistoryRow({ record }: { record: Investigation }) {
  const result = getInvestigationResult(record);
  const model = result?.technicalEvidence.urlModel;
  const typeIcon = record.type === "APK" ? "apk" : record.type === "QR" ? "qr" : "url";
  const StatusIcon =
    record.status === "PROCESSING" || record.status === "RECEIVED"
      ? Clock3
      : record.status === "FAILED"
        ? CircleAlert
        : Box;
  return (
    <tr>
      <th scope="row" className={styles.recordCell}>
        <FeatureIcon name={typeIcon} className={styles.typeIcon} />
        <div>
          <span className={styles.target} title={record.defangedTarget}>
            {record.defangedTarget}
          </span>
          <p className={styles.recordMeta}>
            {record.type} · {result?.scamCategory ?? "Rekaman investigasi"}
          </p>
          {!result && (
            <p className={styles.recordMessage} title={getInvestigationMessage(record)}>
              {getInvestigationMessage(record)}
            </p>
          )}
        </div>
      </th>
      <td className={styles.indicatorCell}>
        {result ? (
          <>
            <span className={styles.scoreBadge} data-level={result.riskLevel}>
              <FileSearch aria-hidden="true" size={14} />
              <span className="sr-only">
                {model ? "Skor indikator model" : "Skor"}: {result.riskScore} dari 100
              </span>
              <span aria-hidden="true">{result.riskScore}/100</span>
            </span>
            <span className={styles.indicatorCaption}>
              {model ? "Perlu verifikasi" : getRiskPresentation(result.riskLevel).label}
            </span>
          </>
        ) : (
          <span className={styles.statusBadge} data-status={record.status}>
            <StatusIcon aria-hidden="true" size={15} />
            {getInvestigationLabel(record)}
          </span>
        )}
      </td>
      <td className={styles.dateCell}>
        <time dateTime={record.createdAt}>{formatHistoryDate(record.createdAt)}</time>
      </td>
      <td className={styles.actionCell}>
        <Link
          href={PROTECTED_ROUTES.historyDetail(record.id)}
          aria-label={`Lihat rekaman: ${record.defangedTarget}`}
        >
          Lihat rekaman <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </td>
    </tr>
  );
}
