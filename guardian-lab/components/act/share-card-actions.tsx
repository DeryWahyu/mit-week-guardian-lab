"use client";

import { Check, Download, Loader2, RefreshCw } from "lucide-react";
import type { RefObject } from "react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { ShareCardData } from "@/lib/share-card/content";
import styles from "./share-workspace.module.css";
import { useShareCardActions } from "./use-share-card-actions";

export function ShareCardActions({
  cardRef,
  card,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  card: ShareCardData;
}) {
  const actions = useShareCardActions(cardRef, card);
  const busy = actions.operation !== null;
  return (
    <section aria-label="Unduh dan bagikan kartu" className={styles.shareActions}>
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={actions.download}
          disabled={actions.status !== "ready" || busy}
          className={styles.primaryButton}
        >
          {actions.status === "preparing" ? (
            <Loader2
              aria-hidden="true"
              size={18}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Download aria-hidden="true" size={18} />
          )}
          <span className={styles.actionCopy}>
            <strong>{actions.status === "preparing" ? "Menyiapkan PNG..." : "Unduh PNG"}</strong>
            <small>Simpan kartu sebagai gambar.</small>
          </span>
        </button>
        <button
          type="button"
          onClick={actions.copy}
          disabled={busy}
          className={styles.secondaryButton}
        >
          {actions.copied ? (
            <Check aria-hidden="true" size={24} className={styles.copiedIcon} />
          ) : (
            <FeatureIcon name="messages" size="small" />
          )}
          <span className={styles.actionCopy}>
            <strong>
              {actions.operation === "copy"
                ? "Menyalin pesan..."
                : actions.copied
                  ? "Salin ulang pesan"
                  : "Salin pesan WhatsApp"}
            </strong>
            <small>Tempel pesan di aplikasi pilihanmu.</small>
          </span>
        </button>
        {actions.canShare && (
          <button
            type="button"
            onClick={actions.share}
            disabled={actions.status !== "ready" || busy}
            className={styles.secondaryButton}
          >
            <FeatureIcon name="share" size="small" />
            <span className={styles.actionCopy}>
              <strong>
                {actions.operation === "share" ? "Membuka pilihan berbagi..." : "Bagikan gambar"}
              </strong>
              <small>Kamu tentukan aplikasi dan penerimanya.</small>
            </span>
          </button>
        )}
      </div>
      <div aria-live="polite" className={styles.exportFeedback} data-status={actions.status}>
        {actions.status === "preparing" && <p>Menyiapkan gambar untuk diunduh atau dibagikan...</p>}
        {actions.status === "error" && (
          <div className={styles.exportError}>
            <p>Gambar belum berhasil disiapkan. Pesan teks tetap dapat disalin.</p>
            <button type="button" onClick={actions.retry} className={styles.secondaryButton}>
              <RefreshCw aria-hidden="true" size={16} />
              Coba siapkan gambar
            </button>
          </div>
        )}
        {actions.status === "ready" && !actions.feedback && (
          <p className={styles.readyMessage}>
            <Check aria-hidden="true" size={16} />
            <span>
              PNG siap.{" "}
              {actions.canShare
                ? "Pilih aplikasi tujuan melalui Bagikan gambar."
                : "Unduh gambar, lalu lampirkan di WhatsApp atau aplikasi pesan."}
            </span>
          </p>
        )}
        {actions.feedback && <p>{actions.feedback}</p>}
      </div>
      {actions.manualCopy && (
        <div className={styles.manualCopy}>
          <label htmlFor="share-message">Pesan untuk disalin manual</label>
          <textarea
            id="share-message"
            readOnly
            value={card.text}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </section>
  );
}
