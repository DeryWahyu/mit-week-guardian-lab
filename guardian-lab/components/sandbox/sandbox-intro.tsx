import { cn } from "@/lib/utils";
import styles from "./web-sandbox.module.css";

export function SandboxIntro({ compact = false }: { compact?: boolean }) {
  return (
    <header className={cn(styles.intro, compact && styles.introCompact)} data-user-reveal>
      <h1>
        {compact ? (
          "Ruang jelajahmu."
        ) : (
          <>
            <span>Jelajahi tautan,</span>
            <span>jaga perangkatmu.</span>
          </>
        )}
      </h1>
      <p className={styles.introDescription}>
        {compact
          ? "Pantau browser terisolasi, waktu sesi, dan unduhanmu di satu tempat."
          : "Buka tautan publik di browser terisolasi. Sesi berakhir otomatis setelah 180 detik."}
      </p>
    </header>
  );
}
