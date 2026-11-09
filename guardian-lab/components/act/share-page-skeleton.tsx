import { cn } from "@/lib/utils";
import { ShareFeatures } from "./share-features";
import { ShareIllustration } from "./share-illustration";
import { ShareIntro } from "./share-intro";
import { ShareSteps } from "./share-steps";
import styles from "./share-workspace.module.css";

export function SharePageSkeleton({ selected = false }: { selected?: boolean }) {
  return (
    <div className={styles.content}>
      {selected ? (
        <>
          <ShareIntro compact />
          <ShareSteps stage={2} standalone />
          <output
            className={styles.preparedLayout}
            aria-label="Memuat hasil untuk kartu"
            aria-busy="true"
          >
            <div className={cn(styles.skeleton, styles.previewSkeleton)}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.skeleton}>
              <span />
              <span />
              <span />
            </div>
          </output>
        </>
      ) : (
        <>
          <div className={styles.hero}>
            <div className={styles.formColumn}>
              <ShareIntro />
              <div className={styles.startWorkspace}>
                <ShareSteps />
                <output
                  className={cn(styles.skeleton, styles.startSkeleton)}
                  aria-label="Memuat Bagikan Hasil"
                  aria-busy="true"
                >
                  <span />
                  <span />
                  <span />
                  <span />
                </output>
              </div>
            </div>
            <ShareIllustration />
          </div>
          <ShareFeatures />
        </>
      )}
    </div>
  );
}
