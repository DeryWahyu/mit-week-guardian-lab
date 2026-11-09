import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import workspace from "@/components/workspace/workspace.module.css";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CommunityCase } from "@/lib/validations/community";
import styles from "./community.module.css";
import { COMMUNITY_STATUS_LABELS } from "./community-status";

export function CommunityCard({
  item,
  presentation = "default",
}: {
  item: CommunityCase;
  presentation?: "default" | "workspace" | "browser";
}) {
  const browser = presentation === "browser";
  const typeIcon =
    item.report?.type === "APK"
      ? "apk"
      : item.report?.type === "QR"
        ? "qr"
        : item.report?.type === "URL"
          ? "url"
          : "record";
  return (
    <article
      className={cn(
        browser
          ? styles.caseCard
          : "flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 [overflow-wrap:anywhere]",
        presentation === "workspace" && workspace.lessonCard,
      )}
    >
      <div className={browser ? styles.caseHeader : undefined}>
        {browser && <FeatureIcon name={typeIcon} />}
        <p className={browser ? styles.caseMeta : "text-xs font-semibold text-slate-500"}>
          {item.report?.type ?? "Kasus lama"} ·{" "}
          <span
            className={
              browser
                ? styles.statusChip
                : presentation === "workspace"
                  ? workspace.statusChip
                  : undefined
            }
            data-status={item.status}
          >
            {item.withdrawnAt ? "Publikasi ditarik" : COMMUNITY_STATUS_LABELS[item.status]}
          </span>
        </p>
      </div>
      {browser ? (
        <h3 className={styles.caseTitle}>{item.title}</h3>
      ) : (
        <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
      )}
      <p className={browser ? styles.caseDescription : "line-clamp-3 text-sm text-slate-600"}>
        {item.description}
      </p>
      <div
        className={
          browser
            ? styles.caseActions
            : "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"
        }
      >
        <span className={browser ? undefined : "text-xs text-slate-500"}>Pengaju anonim</span>
        <Link
          href={PROTECTED_ROUTES.communityReplay(item.id)}
          className={
            browser
              ? styles.caseLink
              : "inline-flex min-h-11 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold"
          }
        >
          {browser ? "Pelajari kasus" : "Lihat kasus"}
          {browser && <ArrowUpRight aria-hidden="true" size={17} />}
        </Link>
      </div>
    </article>
  );
}
