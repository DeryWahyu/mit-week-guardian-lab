import { ArrowDown, ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { getRiskPresentation } from "@/lib/investigations/presentation";
import { ADMIN_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import type { CommunityCase } from "@/lib/validations/community";
import evidenceMascot from "@/public/landing/guardian-evidence-reader.webp";
import styles from "./community-case.module.css";
import { caseDate, caseTypeIcon } from "./community-case-presentation";
import { COMMUNITY_STATUS_LABELS } from "./community-status";

export function CommunityCaseHeading({ admin = false }: { admin?: boolean }) {
  return (
    <header className={styles.heading} data-user-reveal>
      <Link
        href={admin ? ADMIN_ROUTES.communityReviews : PROTECTED_ROUTES.community}
        className={styles.backLink}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke {admin ? "antrean moderasi" : "komunitas"}
      </Link>
      <div className={styles.hero}>
        <div>
          <h1>
            Pahami kasusnya,
            <span>kenali polanya.</span>
          </h1>
          <p>Telusuri bukti yang tersimpan, lalu latih kepekaanmu lewat kasus komunitas.</p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.heroShape} />
          <Image src={evidenceMascot} alt="" sizes="(max-width: 600px) 120px, 220px" />
        </div>
      </div>
    </header>
  );
}

export function CommunityCaseOverview({ record }: { record: CommunityCase }) {
  const report = record.report;
  const risk = report
    ? getRiskPresentation(report.riskLevel, report.technicalEvidence.urlModel)
    : null;
  return (
    <section className={styles.overview} aria-labelledby="case-title" data-user-reveal>
      <div className={styles.overviewMain}>
        <div className={styles.caseCopy}>
          <div className={styles.caseCategory}>
            <FeatureIcon name={caseTypeIcon(report?.type)} />
            <div>
              <span className={styles.typeLabel}>{report?.type ?? "Kasus lama"}</span>
              <span
                className={styles.status}
                data-status={record.withdrawnAt ? "WITHDRAWN" : record.status}
              >
                {record.withdrawnAt ? "Publikasi ditarik" : COMMUNITY_STATUS_LABELS[record.status]}
              </span>
            </div>
          </div>
          <h2 id="case-title">{record.title}</h2>
          <p className={styles.description}>{record.description}</p>
          {report && (
            <div className={styles.target}>
              <span>Target pada snapshot</span>
              <code>{report.target}</code>
            </div>
          )}
        </div>
        <div className={styles.score} data-high={risk?.high || undefined}>
          {report && risk ? (
            <>
              <span>
                {report.technicalEvidence.urlModel ? "Indikator model" : "Skor tersimpan"}
              </span>
              <strong>
                {report.riskScore}
                <small>/100</small>
              </strong>
              <span className={styles.riskLabel}>{risk.label}</span>
              <p>Hasil pemeriksaan, perlu dipahami bersama bukti dan cakupannya.</p>
            </>
          ) : (
            <>
              <FeatureIcon name="model" />
              <strong className={styles.noScore}>Belum tersedia</strong>
              <p>Snapshot belum memuat hasil yang lengkap.</p>
            </>
          )}
        </div>
      </div>
      <div className={styles.overviewFooter}>
        <span>
          <ShieldCheck size={16} aria-hidden="true" />
          Pengaju anonim
        </span>
        <span>
          <CalendarDays size={16} aria-hidden="true" />
          Diajukan <time dateTime={record.createdAt}>{caseDate(record.createdAt)}</time>
        </span>
        {record.canPractice && (
          <a href="#case-challenge" className={styles.textLink}>
            Ke latihan kasus <ArrowDown size={16} aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
