"use client";

import { ArrowRight, FileCheck2, ImageIcon, Info, Users } from "lucide-react";
import Link from "next/link";
import { memo, useRef } from "react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { ShareCardData } from "@/lib/share-card/content";
import { ShareCardActions } from "./share-card-actions";
import { ShareCardCanvas } from "./share-card-canvas";
import styles from "./share-workspace.module.css";

export const PreparedShareCard = memo(
  function PreparedShareCard({ card }: { card: ShareCardData }) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    return (
      <div className={styles.preparedLayout} data-motion-skip>
        <section className={styles.previewPanel} aria-labelledby="share-preview-title">
          <div className={styles.previewHeading}>
            <h2 id="share-preview-title">
              <ImageIcon aria-hidden="true" size={17} />
              Pratinjau kartu
            </h2>
            <span>Format PNG</span>
          </div>
          <ShareCardCanvas card={card} />
        </section>
        <aside className={styles.actionPanel} aria-labelledby="share-actions-title">
          <h2 id="share-actions-title">Siap mengingatkan orang terdekat?</h2>
          <p className={styles.panelDescription}>
            Periksa isi kartu, lalu pilih cara membagikannya.
          </p>
          <div className={styles.selectedSource}>
            <p>Hasil yang dipilih</p>
            <div>
              <span>
                <FileCheck2 aria-hidden="true" size={16} />
                {card.type}
              </span>
              <Link href={PROTECTED_ROUTES.history}>Ganti hasil</Link>
            </div>
            <p className={styles.selectedTarget}>{card.target}</p>
            <span>{card.date}</span>
          </div>
          <ShareCardActions cardRef={cardRef} card={card} />
          <div className="mt-5 space-y-3 rounded-2xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/90 via-white to-teal-50/50 p-4 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FeatureIcon name="people" size="small" />
              <h3 className="text-sm leading-snug font-bold text-slate-900">
                Ajukan Kasus ke Komunitas
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Ajukan temuan ini untuk ditinjau admin dan dipelajari bersama.
            </p>
            <Link
              href={PROTECTED_ROUTES.communitySubmit(card.id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-cyan-900"
            >
              <Users aria-hidden="true" className="size-4" />
              <span>Ajukan ke komunitas sekarang</span>
              <ArrowRight aria-hidden="true" className="ml-auto size-3.5" />
            </Link>
          </div>
          <p className={styles.privacyNote}>
            <Info aria-hidden="true" size={17} /> Kamu memilih aplikasi dan penerima. Periksa
            kembali isi kartu sebelum meneruskannya.
          </p>
        </aside>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 -left-[10000px] w-[600px]"
        >
          <ShareCardCanvas card={card} cardRef={cardRef} />
        </div>
      </div>
    );
  },
  (previous, next) => previous.card.text === next.card.text,
);
