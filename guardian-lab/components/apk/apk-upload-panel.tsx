import { Info, Loader2, Search } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { InvestigationRequestFeedback } from "@/components/shared/investigation-request-feedback";
import { ApkProgressCard } from "./apk-progress-card";
import { ApkUploadField } from "./apk-upload-field";
import styles from "./apk-workspace.module.css";

export function ApkUploadPanel({
  file,
  error,
  requestError,
  uncertain,
  pending,
  onSelect,
  onClear,
  onSubmit,
}: {
  file: File | null;
  error: string | null;
  requestError: string | null;
  uncertain: boolean;
  pending: boolean;
  onSelect: (files: File[]) => void;
  onClear: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      noValidate
      aria-label="Pemeriksaan file APK"
      aria-busy={pending}
      className={styles.uploadPanel}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.panelHeading}>
        <FeatureIcon name="apk" size="small" />
        <div>
          <h2>Mulai pemeriksaan</h2>
          <p>Kenali aplikasi sebelum memberi akses.</p>
        </div>
      </div>
      <ApkUploadField
        file={file}
        error={error}
        disabled={pending}
        onSelect={onSelect}
        onClear={onClear}
      />
      <InvestigationRequestFeedback error={requestError} uncertain={uncertain} />
      <button type="submit" disabled={pending || !file} className={styles.submitButton}>
        {pending ? (
          <Loader2
            aria-hidden="true"
            size={17}
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Search aria-hidden="true" size={17} />
        )}
        {pending ? "Memeriksa APK..." : "Periksa APK"}
      </button>
      <div className={styles.modelNotice}>
        <Info aria-hidden="true" size={17} />
        <p>
          <strong>Analisis Statis &amp; AI Aktif.</strong> Dekompilasi JADX memeriksa manifes dan
          izin secara mendalam, dipadukan dengan analisis pola ancaman DeepSeek AI.
        </p>
      </div>
      <ApkProgressCard pending={pending} className="mt-3.5" />
    </form>
  );
}
