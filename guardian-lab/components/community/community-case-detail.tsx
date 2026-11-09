"use client";

import { ArrowUpRight, Info, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { communityCaseSchema } from "@/lib/validations/community";
import { investigationIdSchema } from "@/lib/validations/investigation";
import styles from "./community-case.module.css";
import { CommunityCaseHeading, CommunityCaseOverview } from "./community-case-header";
import { CommunityCaseSidebar } from "./community-case-sidebar";
import { CommunityCaseProblem, CommunityCaseRecordSkeleton } from "./community-case-states";
import { CommunityChallengeView } from "./community-challenge-view";
import { CommunityReportView } from "./community-report-view";
import { CommunityReviewForm } from "./community-review-form";

export function CommunityCaseDetail({
  id,
  scope,
  admin,
}: {
  id: string;
  scope: string;
  admin: boolean;
}) {
  const resource = useApiResource(
    investigationIdSchema.safeParse(id).success ? API_ROUTES.communityReplay(id) : null,
    communityCaseSchema,
    { scope },
  );
  const record = resource.data;
  return (
    <div className={styles.content}>
      <CommunityCaseHeading admin={admin} />
      {resource.loading ? (
        <CommunityCaseRecordSkeleton />
      ) : resource.problem ? (
        <CommunityCaseProblem problem={resource.problem} retry={resource.retry} />
      ) : !record ? (
        <CommunityCaseProblem />
      ) : (
        <>
          <CommunityCaseOverview record={record} />
          <div className={styles.readingLayout}>
            {record.report ? (
              <CommunityReportView report={record.report} presentation="case" />
            ) : (
              <section className={styles.panel} aria-labelledby="case-legacy-title">
                <div className={styles.panelHeading}>
                  <FeatureIcon name="model" />
                  <div>
                    <h2 id="case-legacy-title">Snapshot belum lengkap</h2>
                    <p>Bukti untuk kasus ini belum dapat ditampilkan.</p>
                  </div>
                </div>
                <div className={styles.notice}>
                  <Info size={20} aria-hidden="true" />
                  <p>
                    Snapshot kasus lama belum memenuhi kontrak hasil tersimpan. Kasus ini tidak
                    dapat diterbitkan.
                  </p>
                </div>
              </section>
            )}
            <CommunityCaseSidebar record={record} />
          </div>
          {record.canReview && (
            <div className={styles.reviewPanel} data-user-reveal>
              <CommunityReviewForm
                key={`${record.id}:${record.status}`}
                record={record}
                onDone={resource.retry}
              />
            </div>
          )}
          {record.canPractice ? (
            <CommunityChallengeView key={`${scope}:${record.id}`} id={record.id} scope={scope} />
          ) : (
            <section
              className={styles.practiceUnavailable}
              aria-labelledby="case-practice-unavailable"
              data-user-reveal
            >
              <FeatureIcon name="casebook" />
              <div>
                <h2 id="case-practice-unavailable">Latihan kasus belum tersedia.</h2>
                <p>
                  Latihan mengikuti kasus yang disetujui dan masih dipublikasikan. Kamu tetap bisa
                  mengasah kepekaan di Belajar.
                </p>
              </div>
              <Link href={PROTECTED_ROUTES.academy} className={styles.secondary}>
                Jelajahi latihan <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </section>
          )}
          <div className={styles.footerActions}>
            <p>Keputusan publikasi dan isi snapshot mengikuti status yang tersimpan.</p>
            <button
              type="button"
              onClick={resource.retry}
              disabled={resource.refreshing}
              className={styles.secondary}
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={cn(resource.refreshing && "animate-spin motion-reduce:animate-none")}
              />
              {resource.refreshing ? "Memperbarui..." : "Perbarui status kasus"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
