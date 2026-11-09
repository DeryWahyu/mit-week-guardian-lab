import Image from "next/image";
import { BrowserIllustration } from "@/components/workspace/browser-illustration";
import mascot from "@/public/features/guardian-apk-device.webp";
import styles from "./apk-workspace.module.css";

export function ApkScene({
  pending = false,
  selected = false,
  loading = false,
}: {
  pending?: boolean;
  selected?: boolean;
  loading?: boolean;
}) {
  const caption = pending
    ? "Memeriksa file APK..."
    : loading
      ? "Menyiapkan pemeriksaan..."
      : selected
        ? "File APK siap diperiksa"
        : "Menunggu file APK";
  return (
    <div className={styles.scene} aria-hidden="true">
      <BrowserIllustration variant="apk" caption={caption} />
      <Image
        src={mascot}
        alt=""
        className={styles.mascot}
        sizes="(max-width: 480px) 52vw, (max-width: 800px) 280px, 300px"
      />
    </div>
  );
}
