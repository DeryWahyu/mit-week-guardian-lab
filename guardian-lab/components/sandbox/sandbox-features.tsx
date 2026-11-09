import { FeatureIcon } from "@/components/shared/feature-icon";
import styles from "./web-sandbox.module.css";

export function SandboxFeatures() {
  return (
    <ul
      className={styles.features}
      aria-label="Tentang Ruang Uji"
      data-user-reveal
      data-user-order="1"
    >
      <li>
        <FeatureIcon name="browser" />
        <div>
          <h2>Browser terisolasi</h2>
          <p>Tautan dibuka di server.</p>
        </div>
      </li>
      <li>
        <FeatureIcon name="timer" />
        <div>
          <h2>180 detik per sesi</h2>
          <p>Sesi berhenti otomatis.</p>
        </div>
      </li>
      <li>
        <FeatureIcon name="cleanup" />
        <div>
          <h2>Data sementara dihapus</h2>
          <p>Setelah sesi berakhir.</p>
        </div>
      </li>
    </ul>
  );
}
