"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { InvestigationProblem } from "@/components/shared/investigation-problem";
import { InvestigationStatusPanel } from "@/components/shared/investigation-status-panel";
import { useInvestigation } from "@/lib/hooks/use-investigation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { buildShareCard } from "@/lib/share-card/content";
import { PreparedShareCard } from "./prepared-share-card";
import { ShareFeatures } from "./share-features";
import { ShareIllustration } from "./share-illustration";
import { ShareIntro } from "./share-intro";
import { SharePageSkeleton } from "./share-page-skeleton";
import { ShareStartPanel } from "./share-start-panel";
import { ShareSteps } from "./share-steps";
import styles from "./share-workspace.module.css";

export function ActPageView({ accessScope }: { accessScope: string }) {
  const params = useSearchParams();
  const id = params.get("id");
  const { record, loading, refreshing, problem, retry } = useInvestigation(id, accessScope);
  const card = useMemo(() => (record ? buildShareCard(record) : null), [record]);
  if (loading) return <SharePageSkeleton selected={Boolean(id)} />;
  if (problem)
    return (
      <div className={styles.content}>
        <ShareIntro compact />
        <InvestigationProblem
          presentation="workspace"
          problem={problem}
          onRetry={retry}
          id={id ?? undefined}
        />
      </div>
    );
  return (
    <div className={styles.content}>
      {card ? (
        <>
          <ShareIntro compact />
          <ShareSteps stage={2} standalone />
          <PreparedShareCard
            key={`${accessScope}:${record?.id}:${record?.updatedAt}`}
            card={card}
          />
        </>
      ) : (
        <>
          <section className={styles.hero} aria-label="Mulai Bagikan Hasil" data-user-reveal>
            <div className={styles.formColumn}>
              <ShareIntro />
              <ShareStartPanel hasRecord={Boolean(record)} />
            </div>
            <ShareIllustration />
          </section>
          <ShareFeatures />
        </>
      )}
      {record && !card && (
        <section className={styles.incompleteState} aria-label="Ketersediaan kartu">
          <InvestigationStatusPanel record={record} presentation="workspace" />
          <div className={styles.incompleteActions}>
            <p>Kartu baru dapat dibuat setelah hasil analisis lengkap tersedia.</p>
            <button
              type="button"
              onClick={retry}
              disabled={refreshing}
              className={styles.secondaryButton}
            >
              <RefreshCw aria-hidden="true" size={16} />
              {refreshing ? "Memperbarui status..." : "Perbarui status"}
            </button>
          </div>
        </section>
      )}
      {record && (
        <nav className={styles.contextLinks} aria-label="Lanjutan investigasi">
          <Link
            href={card ? PROTECTED_ROUTES.historyDetail(card.id) : PROTECTED_ROUTES.history}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            {card ? "Kembali ke hasil investigasi" : "Buka riwayat investigasi"}
          </Link>
        </nav>
      )}
    </div>
  );
}
