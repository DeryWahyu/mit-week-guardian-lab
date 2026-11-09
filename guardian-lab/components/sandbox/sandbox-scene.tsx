"use client";

import Image from "next/image";
import { BrowserIllustration } from "@/components/workspace/browser-illustration";
import presenter from "@/public/features/guardian-sandbox-presenter.webp";
import styles from "./sandbox-scene.module.css";

export function SandboxScene({ phase = "idle" }: { phase?: "idle" | "pending" | "loading" }) {
  const caption =
    phase === "pending"
      ? "Menyiapkan sesi..."
      : phase === "loading"
        ? "Memuat status sesi..."
        : "Sesi belum dimulai";
  return (
    <div className={styles.scene} aria-hidden="true">
      <BrowserIllustration caption={caption} />
      <Image
        src={presenter}
        alt=""
        className={styles.presenter}
        sizes="(max-width: 480px) 64vw, (max-width: 800px) 360px, 370px"
      />
    </div>
  );
}
