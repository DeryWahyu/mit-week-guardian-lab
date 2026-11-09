"use client";
import { ArrowUpRight, FileArchive, FileSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { z } from "zod";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { sandboxSessionSchema } from "@/lib/validations/sandbox";
import { useQuarantinedDownloads } from "./use-quarantined-downloads";
import styles from "./sandbox-session.module.css";
import shared from "./web-sandbox.module.css";
export function QuarantinedDownloads({
  session,
}: {
  session: z.infer<typeof sandboxSessionSchema>;
}) {
  const { pending, error, records, analyze } = useQuarantinedDownloads(session);
  return (
    <section aria-labelledby="quarantine-title" className={styles.quarantine}>
      <div className={shared.sectionHeading}>
        <span className={shared.headingIcon}>
          <ShieldCheck aria-hidden="true" size={21} />
        </span>
        <div>
          <h2 id="quarantine-title">Karantina unduhan APK</h2>
          <p>Berkas tetap di server, tanpa dijalankan.</p>
        </div>
        <span className={styles.fileCount}>{session.downloads.length} / 4 APK</span>
      </div>
      <p className={styles.quarantineDescription}>
        APK yang selesai diunduh di browser server dipindahkan ke karantina. Berkas tidak dikirim ke
        perangkatmu dan tidak dijalankan. Maksimal 4 APK, masing-masing 50 MB; berkas dihapus saat
        sesi berakhir.
      </p>
      {!session.downloads.length && !Object.keys(records).length && (
        <div className={styles.downloadEmpty}>
          <FileArchive aria-hidden="true" size={26} />
          <div>
            <h3>Belum ada unduhan APK.</h3>
            <p>
              Unduhan yang selesai dalam sesi akan muncul di sini dan dapat dibedah secara statis.
            </p>
          </div>
        </div>
      )}
      <ul className={styles.downloadList}>
        {session.downloads.map((file, i) => (
          <li key={file.id} data-testid="quarantined-download" className={styles.download}>
            <span className={styles.fileIcon}>
              <FileArchive aria-hidden="true" size={21} />
            </span>
            <div className={styles.fileDetails}>
              <h3>
                Unduhan APK {i + 1} <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </h3>
              <p>SHA-256: {file.sha256}</p>
            </div>
            {!records[file.id] && (
              <button
                type="button"
                onClick={() => void analyze(file.id)}
                disabled={Boolean(pending) || session.status !== "ACTIVE"}
                className={shared.secondaryButton}
              >
                <FileSearch aria-hidden="true" size={17} />
                {pending === file.id ? "Membedah APK..." : "Bedah APK statis"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {Object.entries(records).map(([downloadId, recordId]) => (
        <Link
          key={downloadId}
          href={PROTECTED_ROUTES.historyDetail(recordId)}
          className={styles.analysisLink}
        >
          Lihat hasil bedah APK ({downloadId.slice(0, 8)})
          <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      ))}
      {error && (
        <p role="alert" className={shared.errorNotice}>
          {error}
        </p>
      )}
    </section>
  );
}
