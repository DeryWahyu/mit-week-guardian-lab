"use client";
import { Share2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ApkStaticPanel } from "@/components/apk/apk-static-panel";
import { SandboxLaunchLink } from "@/components/sandbox/sandbox-launch-link";
import { DualModeToggle } from "@/components/shared/dual-mode-toggle";
import { InvestigationMetadata } from "@/components/shared/investigation-metadata";
import { InvestigationStatusPanel } from "@/components/shared/investigation-status-panel";
import { UrlModelNotice } from "@/components/shared/url-model-notice";
import workspace from "@/components/workspace/workspace.module.css";
import { getApkStaticReport } from "@/lib/apk/presentation";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Investigation } from "@/lib/validations/investigation";
import { GeekViewPanel } from "./geek-view-panel";
import { KedokCard } from "./kedok-card";
import { ResultError } from "./result-error";
import { ResultSkeleton } from "./result-skeleton";
import { ThreatScoreGauge } from "./threat-score-gauge";

export interface ResultPresenterProps {
  result: Investigation | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  presentation?: "default" | "workspace" | "dialog";
}
function ResultPresenterInner({
  result: record,
  isLoading,
  error,
  onRetry,
  className,
  presentation = "default",
}: ResultPresenterProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const mode = params.get("mode") === "geek" ? "geek" : "human";
  function searchEvidence(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("evidence", value);
    else next.delete("evidence");
    window.history.replaceState(null, "", `${pathname}?${next}`);
  }
  if (isLoading) return <ResultSkeleton className={className} />;
  if (error) return <ResultError message={error} onRetry={onRetry} className={className} />;
  if (!record) return null;
  const result = getInvestigationResult(record);
  const apkReport = getApkStaticReport(record);
  if (!result) return <InvestigationStatusPanel record={record} presentation={presentation} />;
  return (
    <section
      aria-label="Hasil Analisis Forensik Keamanan"
      className={cn(
        presentation === "dialog"
          ? "space-y-3.5"
          : "mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8",
        presentation === "workspace" && workspace.workspaceResult,
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          presentation === "dialog" ? "justify-start" : "flex-wrap justify-between gap-4",
        )}
      >
        {presentation !== "dialog" && (
          <div>
            <p className="text-xs font-semibold text-slate-500">Hasil analisis tersimpan</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Laporan Investigasi</h2>
          </div>
        )}
        <DualModeToggle mode={mode} />
      </div>
      <InvestigationMetadata record={record} compact={presentation === "dialog"} />
      {presentation !== "dialog" && <UrlModelNotice model={result.technicalEvidence.urlModel} />}
      {apkReport && (
        <ApkStaticPanel
          presentation={presentation}
          report={apkReport}
          mode={mode}
          sha256={
            typeof record.inputMetadata.sha256 === "string"
              ? record.inputMetadata.sha256
              : undefined
          }
        />
      )}
      {mode === "human" ? (
        <div
          className={cn(
            "grid gap-4",
            presentation === "dialog" ? "sm:grid-cols-2" : "gap-5 md:grid-cols-2",
          )}
        >
          <ThreatScoreGauge
            score={result.riskScore}
            riskLevel={result.riskLevel}
            defangedTarget={result.defangedTarget}
            scamCategory={result.scamCategory}
            model={result.technicalEvidence.urlModel}
          />
          <KedokCard
            riskLevel={result.riskLevel}
            scamCategory={result.scamCategory}
            humanFriendlySummary={result.humanFriendlySummary}
            deceptionTricks={result.deceptionTricks}
          />
        </div>
      ) : (
        <GeekViewPanel
          result={result}
          search={params.get("evidence") ?? ""}
          onSearchChange={searchEvidence}
        />
      )}
      <div
        className={cn(
          "gap-2 border-t border-slate-100",
          presentation === "dialog"
            ? "grid grid-cols-1 pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end"
            : "flex flex-wrap items-center justify-end pt-4",
        )}
      >
        <SandboxLaunchLink
          target={record.target}
          type={record.type}
          investigationId={record.id}
          className={
            presentation === "dialog"
              ? "inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium [overflow-wrap:anywhere] text-slate-700 transition-colors hover:bg-slate-50"
              : undefined
          }
        />
        <Link
          href={PROTECTED_ROUTES.communitySubmit(record.id)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-200/90 bg-cyan-50/50 font-medium whitespace-nowrap text-cyan-800 transition-colors hover:border-cyan-300 hover:bg-cyan-100/70",
            presentation === "dialog"
              ? "min-h-11 min-w-0 justify-center px-3 py-2 text-center text-xs [overflow-wrap:anywhere] whitespace-normal"
              : "px-4 py-2 text-sm",
          )}
        >
          <Users className="size-3.5 text-cyan-700" aria-hidden="true" />
          <span>Ajukan ke komunitas</span>
        </Link>
        <Link
          href={PROTECTED_ROUTES.history}
          className={cn(
            "shrink-0 rounded-full border border-slate-200 whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50",
            presentation === "dialog"
              ? "inline-flex min-h-11 min-w-0 items-center justify-center px-3 py-2 text-center text-xs font-medium [overflow-wrap:anywhere] whitespace-normal"
              : "border-slate-300 px-4 py-2 text-sm",
          )}
        >
          Kembali ke riwayat
        </Link>
        <Link
          href={PUBLIC_ROUTES.actWithInvestigation(record.id)}
          className={cn(
            "bg-brand-600 hover:bg-brand-700 inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap text-white shadow-2xs transition-colors",
            presentation === "dialog"
              ? "min-h-11 min-w-0 justify-center px-3.5 py-2 text-center text-xs [overflow-wrap:anywhere] whitespace-normal"
              : "px-4 py-2 text-sm",
          )}
        >
          <Share2
            className={presentation === "dialog" ? "size-3.5" : "size-4"}
            aria-hidden="true"
          />
          <span>Buat Guardian Share Card</span>
        </Link>
      </div>
    </section>
  );
}
export function ResultPresenter(props: ResultPresenterProps) {
  return (
    <Suspense fallback={<ResultSkeleton className={props.className} />}>
      <ResultPresenterInner {...props} />
    </Suspense>
  );
}
