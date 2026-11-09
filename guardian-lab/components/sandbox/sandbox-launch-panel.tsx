import { Clipboard, Clock3, Download, Info, Link2, Play } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { sandboxTargetPlan } from "@/lib/sandbox/target-plan";
import styles from "./web-sandbox.module.css";

export function SandboxServiceNotice({
  available,
  message,
}: {
  available: boolean;
  message: string;
}) {
  return (
    <output className={styles.serviceNotice} data-available={available}>
      <span className={styles.serviceDot} aria-hidden="true" />
      <div>
        <strong>{available ? "Layanan tersedia" : "Layanan belum tersedia"}</strong>
        <p>{message}</p>
      </div>
    </output>
  );
}

export function SandboxLaunchPanel({
  target,
  consent,
  available,
  message,
  pending,
  error,
  onTargetChange,
  onConsentChange,
  onSubmit,
  onRefresh: _onRefresh,
}: {
  target: string;
  consent: boolean;
  available: boolean;
  message: string;
  pending: boolean;
  error: string | null;
  onTargetChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: () => void;
  onRefresh?: () => void;
}) {
  const plan = sandboxTargetPlan(target);
  return (
    <section className={styles.launchPanel} aria-labelledby="sandbox-launch-title">
      <div className={styles.launchHeading}>
        <h2 id="sandbox-launch-title" className={styles.launchTitle}>
          <FeatureIcon name="browser" size="small" />
          Mulai penjelajahan
        </h2>
        <output
          className={styles.availability}
          data-state={pending ? "busy" : available ? "ready" : "offline"}
        >
          <span aria-hidden="true" />
          {pending ? "Menyiapkan" : available ? "Siap digunakan" : "Belum tersedia"}
        </output>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className={styles.launchForm}
        aria-busy={pending}
      >
        <label htmlFor="sandbox-target" className={styles.fieldLabel}>
          Tautan publik <span aria-hidden="true">*</span>
        </label>
        <div className={styles.urlField}>
          <Link2 aria-hidden="true" size={20} />
          <input
            id="sandbox-target"
            required
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            maxLength={16384}
            disabled={pending}
            value={target}
            placeholder="https://example.com"
            onChange={(event) => onTargetChange(event.target.value)}
            aria-describedby="sandbox-target-hint sandbox-restrictions sandbox-service-message"
          />
        </div>
        <p id="sandbox-target-hint" className={styles.fieldHint}>
          Gunakan tautan publik berawalan http:// atau https://.
        </p>
        {plan?.requiresRemoval && (
          <div className={styles.consentNotice}>
            <p>
              <Info aria-hidden="true" size={17} />
              <strong>Tinjau tautan sebelum dibuka</strong>
            </p>
            <p>
              Parameter dan fragmen URL dihapus untuk menjaga privasi. Tautan yang bergantung pada
              parameter bisa membuka halaman berbeda.
            </p>
            <div className={styles.cleanTarget}>
              <span>Versi yang akan dibuka</span>
              <strong>{plan.cleanUrl}</strong>
            </div>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                checked={consent}
                disabled={pending}
                onChange={(event) => onConsentChange(event.target.checked)}
              />
              <span>
                Saya setuju membuka versi tanpa parameter dan memahami halaman dapat berbeda.
              </span>
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className={styles.errorNotice}>
            {error}
          </p>
        )}
        <button
          disabled={!available || pending || Boolean(plan?.requiresRemoval && !consent)}
          type="submit"
          className={styles.launchButton}
        >
          <Play aria-hidden="true" size={19} />
          <span>{pending ? "Menyiapkan..." : "Mulai sesi"}</span>
          <span className={styles.buttonDuration}>
            <Clock3 aria-hidden="true" size={17} />
            180 detik
          </span>
        </button>
      </form>
      <output
        id="sandbox-service-message"
        className={available ? "sr-only" : styles.serviceMessage}
      >
        {message}
      </output>
      <div className={styles.protectionNotes}>
        <ul id="sandbox-restrictions" className={styles.restrictions}>
          <li>
            <Clipboard aria-hidden="true" size={17} /> Clipboard dinonaktifkan
          </li>
          <li>
            <Download aria-hidden="true" size={18} /> Unduhan ke perangkat diblokir
          </li>
        </ul>
      </div>
    </section>
  );
}
