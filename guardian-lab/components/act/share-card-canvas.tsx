import { TriangleAlert } from "lucide-react";
import type { RefObject } from "react";
import { BrandIdentity } from "@/components/shared/brand-identity";
import type { ShareCardData } from "@/lib/share-card/content";
import { cn } from "@/lib/utils";
import styles from "./share-card.module.css";

export function ShareCardCanvas({
  card,
  cardRef,
}: {
  card: ShareCardData;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={cardRef} data-share-card className={styles.card}>
      <header className={styles.header}>
        <BrandIdentity
          subtitle={null}
          markClassName="size-7"
          wordmarkClassName="text-sm font-bold tracking-normal"
        />
        <span className={styles.type}>Pemeriksaan {card.type}</span>
      </header>
      <div className={cn(styles.riskPanel, card.risk.background)}>
        <div className={cn(styles.riskLabel, card.risk.color)}>
          {!card.risk.low && <TriangleAlert aria-hidden="true" />}
          <span>{card.risk.label}</span>
        </div>
        <h2>{card.title}</h2>
        <p className={styles.score}>
          {card.scoreLabel}: <strong>{card.riskScore}/100</strong>
        </p>
      </div>
      <div className={styles.targetBlock}>
        <p>{card.type === "APK" ? "Nama berkas APK" : "Target dinonaktifkan (defanged)"}</p>
        <p className={styles.target}>{card.target}</p>
      </div>
      <div className={styles.summary}>
        <p>{card.category}</p>
        <p>{card.summary}</p>
        {card.findings.length > 0 && (
          <ul>
            {card.findings.map((finding, i) => (
              <li key={`${i}-${finding}`}>{finding}</li>
            ))}
          </ul>
        )}
      </div>
      <footer className={styles.footer}>
        {card.notice && (
          <p className={styles.notice}>
            {card.notice} Model riset nonkomersial, masih dikembangkan.
          </p>
        )}
        {card.truncated && <p>Ringkasan dipersingkat dari hasil tersimpan.</p>}
        <p>Hasil pemeriksaan menggambarkan saat analisis, bukan jaminan keamanan.</p>
        <p>
          Sumber: {card.source} · Model: {card.version}
        </p>
        <p>
          {card.date}
          <br />
          ID: {card.id}
        </p>
      </footer>
    </div>
  );
}
