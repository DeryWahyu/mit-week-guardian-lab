import { cn } from "@/lib/utils";
import styles from "./apk-workspace.module.css";

export function ApkIntro({ compact = false }: { compact?: boolean }) {
  return (
    <header className={cn(styles.intro, compact && styles.introCompact)}>
      <h1>
        <span>Kenali APK,</span>
        <span>sebelum dipasang.</span>
      </h1>
      <p className={styles.description}>
        Periksa identitas, izin, dan jejak kode tanpa memasang aplikasi.
      </p>
    </header>
  );
}
