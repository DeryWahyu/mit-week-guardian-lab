import { ArrowRight, Link2, Loader2, QrCode } from "lucide-react";
import type { RefObject } from "react";
import { MAX_URL_LENGTH } from "@/lib/validations/analysis-input";
import styles from "./gateway.module.css";
import { HeroScene } from "./hero-scene";

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  error: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  qrTriggerRef: RefObject<HTMLButtonElement | null>;
  onOpenQr: () => void;
  accountHelpId?: string;
};

export function GatewayUrlField({
  inputRef,
  value,
  error,
  disabled,
  onChange,
  qrTriggerRef,
  onOpenQr,
  accountHelpId,
}: Props) {
  return (
    <>
      <label htmlFor="url-target-input" className={styles.urlLabel}>
        Alamat tautan{" "}
        <span className="text-rose-600" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (wajib)</span>
      </label>
      <div className={styles.inputBox} data-invalid={Boolean(error)}>
        <HeroScene />
        <Link2 aria-hidden="true" className={styles.linkIcon} />
        <input
          ref={inputRef}
          id="url-target-input"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          required
          disabled={disabled}
          maxLength={MAX_URL_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={["url-help", accountHelpId, error ? "url-error" : undefined]
            .filter(Boolean)
            .join(" ")}
          placeholder="Tempel tautan yang bikin ragu…"
          className={styles.urlInput}
        />
        <button
          ref={qrTriggerRef}
          type="button"
          onClick={onOpenQr}
          disabled={disabled}
          className={styles.qrTrigger}
          aria-label="Unggah gambar QR"
        >
          <QrCode aria-hidden="true" />
          <span>Unggah QR</span>
        </button>
        <button
          type="submit"
          disabled={disabled}
          aria-busy={disabled}
          aria-label={disabled ? "Memproses input" : "Periksa tautan"}
          className={styles.submit}
        >
          {disabled ? (
            <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
        </button>
      </div>
      <p id="url-help" className="sr-only">
        Tautan dicatat tanpa membuka situs di perangkatmu. Tautan tanpa protokol menggunakan HTTPS.
        Maksimal 16.384 karakter.
      </p>
    </>
  );
}
