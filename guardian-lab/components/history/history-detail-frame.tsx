import { ArrowLeft, FileSearch, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./history-detail.module.css";

export function HistoryDetailHeading() {
  return (
    <header className={styles.heading} data-user-reveal>
      <div className={styles.topline}>
        <Link href={PROTECTED_ROUTES.history} className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" /> Kembali ke riwayat
        </Link>
        <span className={styles.privateLabel}>
          <LockKeyhole size={15} aria-hidden="true" /> Rekaman pribadi
        </span>
      </div>
      <div className={styles.intro}>
        <div>
          <h1>
            Baca bukti,
            <br />
            <span>pahami konteksnya.</span>
          </h1>
          <p>Temukan ringkasan, telusuri temuan, dan pahami batas pemeriksaanmu.</p>
        </div>
        <div className={styles.documentArt} aria-hidden="true">
          <span className={styles.documentBack} />
          <span className={styles.documentFront}>
            <FileSearch size={46} strokeWidth={1.5} />
            <i />
            <i />
            <i />
          </span>
          <span className={styles.documentLock}>
            <LockKeyhole size={23} strokeWidth={1.7} />
          </span>
        </div>
      </div>
    </header>
  );
}

export function HistoryRecordSkeleton() {
  return (
    <output className={styles.skeleton} aria-label="Memuat rekaman pemeriksaan" aria-busy="true">
      <div className={styles.skeletonOverview} aria-hidden="true" />
      <div className={styles.layout} aria-hidden="true">
        <div className={styles.skeletonReport} />
        <div className={styles.skeletonSidebar} />
      </div>
    </output>
  );
}

export function HistoryDetailSkeleton() {
  return (
    <div className={styles.content}>
      <HistoryDetailHeading />
      <HistoryRecordSkeleton />
    </div>
  );
}
