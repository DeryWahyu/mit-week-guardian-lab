import { ArrowRight, ClipboardList, History, Search } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { ShareSteps } from "./share-steps";
import styles from "./share-workspace.module.css";

export function ShareStartPanel({ hasRecord = false }: { hasRecord?: boolean }) {
  return (
    <section className={styles.startWorkspace} aria-labelledby="share-start-title">
      <ShareSteps />
      <div className={styles.startPanel}>
        <div className={styles.startHeading}>
          <FeatureIcon name="share" size="small" />
          <div>
            <h2 id="share-start-title">Pilih hasil pemeriksaan</h2>
            <p className={styles.panelDescription}>Mulai dari hasil lengkap di riwayatmu.</p>
          </div>
        </div>
        <div className={styles.sourceEmpty}>
          <span className={styles.sourceIcon}>
            <ClipboardList aria-hidden="true" size={42} />
            <Search aria-hidden="true" className={styles.sourceSearch} size={27} />
          </span>
          <h3>
            {hasRecord ? "Hasil ini belum dapat dijadikan kartu." : "Belum ada hasil yang dipilih."}
          </h3>
          <p>
            {hasRecord
              ? "Kartu memerlukan hasil analisis lengkap. Kamu juga bisa memilih hasil lain dari riwayat."
              : "Pilih investigasi, lalu buat kartu dari halaman hasilnya."}
          </p>
        </div>
        <Link href={PROTECTED_ROUTES.history} className={styles.primaryButton}>
          <History aria-hidden="true" size={18} />
          {hasRecord ? "Pilih hasil lain dari riwayat" : "Pilih hasil dari riwayat"}
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
