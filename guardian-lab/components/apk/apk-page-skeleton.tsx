import { ApkFeatures } from "./apk-features";
import { ApkIntro } from "./apk-intro";
import { ApkScene } from "./apk-scene";
import styles from "./apk-workspace.module.css";

export function ApkPageSkeleton() {
  return (
    <div className={styles.content}>
      <div className={styles.hero}>
        <div className={styles.formColumn}>
          <ApkIntro />
          <output className={styles.skeleton} aria-label="Memeriksa sesi APK" aria-busy="true">
            <span />
            <span />
            <span />
            <span />
          </output>
        </div>
        <ApkScene loading />
      </div>
      <ApkFeatures />
    </div>
  );
}
