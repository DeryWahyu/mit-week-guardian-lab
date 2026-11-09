import Image from "next/image";
import guardian from "@/public/brand/guardian-lab-fox-auth.webp";
import brandMark from "@/public/brand/guardian-lab-koneksi.png";
import styles from "../auth.module.css";

export function AuthArtwork() {
  return (
    <aside className={styles.artwork} aria-label="Teman jelajah digitalmu">
      <div className={styles.artSurface} aria-hidden="true">
        <Image src={brandMark} alt="" className={styles.artMark} sizes="40vw" draggable={false} />
      </div>
      <div className={styles.mascot}>
        <Image
          src={guardian}
          alt="Guardian, rubah 3D berjaket cyan, menyambut dengan tangan terbuka sambil melihat ke arah form."
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1440px) 760px, (min-width: 1024px) 55vw, 260px"
          draggable={false}
        />
      </div>
    </aside>
  );
}
