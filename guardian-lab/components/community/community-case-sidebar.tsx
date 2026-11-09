import { ArrowDown, ArrowUpRight, Info, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { CommunityCase } from "@/lib/validations/community";
import styles from "./community-case.module.css";
import { caseDate } from "./community-case-presentation";

export function CommunityCaseSidebar({ record }: { record: CommunityCase }) {
  const report = record.report;
  const facts = [
    ["Jenis kasus", record.scamType],
    ["Kategori hasil", report?.scamCategory ?? "Belum tersedia"],
    ["Ditinjau", caseDate(record.reviewedAt)],
    ["Waktu analisis", caseDate(report?.analyzedAt)],
    ["Sumber analisis", report?.analysisSource ?? "Belum tersedia"],
    ["Versi model / mesin", report?.modelVersion ?? "Belum tersedia"],
  ];
  return (
    <aside className={styles.sidebar} aria-label="Informasi dan panduan mempelajari kasus">
      <section className={styles.panel} aria-labelledby="case-details-title" data-user-reveal>
        <div className={styles.panelHeading}>
          <FeatureIcon name="history" />
          <div>
            <h2 id="case-details-title">Detail kasus</h2>
            <p>Konteks di balik temuan.</p>
          </div>
        </div>
        <dl className={styles.metadata}>
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <details className={styles.disclosure}>
          <summary>ID kasus</summary>
          <code>{record.id}</code>
        </details>
        {record.sourceRecordId && (
          <Link
            href={PROTECTED_ROUTES.historyDetail(record.sourceRecordId)}
            className={styles.sourceLink}
          >
            Buka investigasi sumber <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        )}
      </section>
      <section className={styles.guide} aria-labelledby="case-guide-title" data-user-reveal>
        <FeatureIcon name="casebook" />
        <h2 id="case-guide-title">
          Bukti dulu,
          <br />
          baru simpulkan.
        </h2>
        <p>Luangkan waktu untuk mengenali pola, bukan sekadar melihat skor.</p>
        <ol>
          <li>
            <span aria-hidden="true">01</span>Baca ringkasan dan target yang diperiksa.
          </li>
          <li>
            <span aria-hidden="true">02</span>Cocokkan temuan dengan bukti yang tersedia.
          </li>
          <li>
            <span aria-hidden="true">03</span>Pahami batas analisis sebelum menjawab.
          </li>
        </ol>
        {record.canPractice && (
          <a href="#case-challenge" className={styles.primary}>
            Uji pemahamanmu <ArrowDown size={17} aria-hidden="true" />
          </a>
        )}
        <p className={styles.privacy}>
          <LockKeyhole size={16} aria-hidden="true" />
          Identitas pengaju dan bukti mentah tidak ditampilkan.
        </p>
      </section>
      {(record.adminNotes || record.withdrawalReason) && (
        <section
          className={styles.panel}
          aria-labelledby="case-review-notes-title"
          data-user-reveal
        >
          <div className={styles.panelHeading}>
            <Info size={22} aria-hidden="true" />
            <div>
              <h2 id="case-review-notes-title">Catatan tinjauan</h2>
            </div>
          </div>
          {record.adminNotes && <p className={styles.noteText}>{record.adminNotes}</p>}
          {record.withdrawalReason && (
            <div className={styles.notice}>
              <p>
                <strong>Alasan penarikan:</strong> {record.withdrawalReason}
              </p>
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
