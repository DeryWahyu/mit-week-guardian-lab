import { ArrowUpRight, FileText, LockKeyhole, MessageCircle, Monitor, Share2 } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import styles from "./history-detail.module.css";
import { recordDate, recordSource, recordTypeLabels } from "./history-detail-presentation";

export function HistoryRecordSidebar({
  record,
  canShare,
}: {
  record: Investigation;
  canShare: boolean;
}) {
  const fields = [
    ["Jenis input", recordTypeLabels[record.type]],
    ["Diterima", recordDate(record.createdAt)],
    ["Terakhir diperbarui", recordDate(record.updatedAt)],
    ["Sumber analisis", recordSource(record)],
  ];
  return (
    <aside className={styles.sidebar} aria-label="Informasi dan tindakan rekaman">
      <section className={styles.panel} aria-labelledby="record-metadata-title" data-user-reveal>
        <div className={styles.panelHeading}>
          <FeatureIcon name="history" className={styles.panelIcon} />
          <div>
            <h2 id="record-metadata-title">Detail rekaman</h2>
            <p>Jejak pemeriksaan tersimpan.</p>
          </div>
        </div>
        <dl className={styles.metadata}>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <details className={styles.moreMetadata}>
          <summary>Metadata lengkap</summary>
          <dl className={styles.metadata}>
            <div>
              <dt>ID investigasi</dt>
              <dd className={styles.mono}>{record.id}</dd>
            </div>
            <div>
              <dt>Mulai diproses</dt>
              <dd>{recordDate(record.startedAt)}</dd>
            </div>
            <div>
              <dt>Waktu status akhir</dt>
              <dd>{record.finishedAt ? recordDate(record.finishedAt) : "Belum berakhir"}</dd>
            </div>
            <div>
              <dt>Versi model / mesin</dt>
              <dd className={styles.mono}>{record.modelVersion ?? "Belum tersedia"}</dd>
            </div>
            {record.errorCode && (
              <div>
                <dt>Kode status</dt>
                <dd className={styles.mono}>{record.errorCode}</dd>
              </div>
            )}
          </dl>
        </details>
        {typeof record.inputMetadata.sourceInvestigationId === "string" && (
          <Link
            className={styles.provenanceLink}
            href={PROTECTED_ROUTES.historyDetail(record.inputMetadata.sourceInvestigationId)}
          >
            <FileText size={17} aria-hidden="true" />
            Buka sumber unduhan sandbox
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        )}
      </section>
      <section
        className={styles.actions}
        aria-labelledby="record-actions-title"
        data-user-reveal
        data-user-order="1"
      >
        <FeatureIcon name="share" className={styles.panelIcon} />
        <h2 id="record-actions-title">Langkah berikutnya.</h2>
        <p>
          {canShare
            ? "Ubah hasil menjadi pesan yang mudah dipahami, atau ajukan sebagai bahan belajar bersama."
            : "Aksi berbagi dan pengajuan tersedia setelah hasil pemeriksaan lengkap."}
        </p>
        {canShare && (
          <>
            <Link
              className={styles.primaryAction}
              href={PUBLIC_ROUTES.actWithInvestigation(record.id)}
            >
              <Share2 size={19} aria-hidden="true" />
              Buat Share Card
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link
              className={styles.secondaryAction}
              href={PROTECTED_ROUTES.communitySubmit(record.id)}
            >
              <MessageCircle size={19} aria-hidden="true" />
              Ajukan ke komunitas
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </>
        )}
        {record.type !== "APK" && /^https?:\/\//i.test(record.target) && (
          <Link
            className={styles.secondaryAction}
            href={PUBLIC_ROUTES.sandboxWebWithTarget(record.target, record.id)}
          >
            <Monitor size={19} aria-hidden="true" />
            Buka di Ruang Uji
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        )}
        <div className={styles.privacyNote}>
          <LockKeyhole size={15} aria-hidden="true" />
          <span>Periksa isi hasil sebelum membagikannya.</span>
        </div>
      </section>
    </aside>
  );
}
