import { FeatureIcon } from "@/components/shared/feature-icon";
import styles from "./share-workspace.module.css";

export function ShareFeatures() {
  return (
    <ul
      className={styles.features}
      aria-label="Tentang Bagikan Hasil"
      data-user-reveal
      data-user-order="1"
    >
      <li>
        <FeatureIcon name="record" />
        <div>
          <h2>Hasil tersimpan</h2>
          <p>Isi kartu berasal dari investigasi.</p>
        </div>
      </li>
      <li>
        <FeatureIcon name="image" />
        <div>
          <h2>Gambar dan pesan</h2>
          <p>Unduh PNG atau salin pesan.</p>
        </div>
      </li>
      <li>
        <FeatureIcon name="people" />
        <div>
          <h2>Penerima pilihanmu</h2>
          <p>Kamu tentukan aplikasi dan tujuan.</p>
        </div>
      </li>
    </ul>
  );
}
