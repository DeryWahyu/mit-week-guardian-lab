import { cn } from "@/lib/utils";
import styles from "./share-workspace.module.css";

export function ShareIntro({ compact = false }: { compact?: boolean }) {
  return (
    <header className={cn(styles.intro, compact && styles.introCompact)} data-user-reveal>
      <h1>
        <span>Bagikan hasil,</span>
        <span>bantu orang terdekat.</span>
      </h1>
      <p>Ubah hasil pemeriksaan menjadi kartu dan pesan yang mudah dibagikan.</p>
    </header>
  );
}
