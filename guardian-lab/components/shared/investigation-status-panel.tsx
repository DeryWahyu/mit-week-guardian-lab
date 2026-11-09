"use client";
import { FileSearch } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ApkStaticPanel } from "@/components/apk/apk-static-panel";
import { SandboxLaunchLink } from "@/components/sandbox/sandbox-launch-link";
import workspace from "@/components/workspace/workspace.module.css";
import { getApkStaticReport } from "@/lib/apk/presentation";
import { getInvestigationLabel, getInvestigationMessage } from "@/lib/investigations/presentation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Investigation } from "@/lib/validations/investigation";
import { DualModeToggle } from "./dual-mode-toggle";
import { InvestigationMetadata } from "./investigation-metadata";

export function InvestigationStatusPanel({
  record,
  presentation = "default",
}: {
  record: Investigation;
  presentation?: "default" | "workspace" | "dialog";
}) {
  const mode = useSearchParams().get("mode") === "geek" ? "geek" : "human";
  const pathname = usePathname();
  const apkReport = getApkStaticReport(record);
  return (
    <section
      aria-label="Status investigasi"
      className={cn(
        presentation === "dialog"
          ? "space-y-3.5"
          : "mx-auto max-w-4xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8",
        presentation === "workspace" && workspace.workspaceResult,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <FileSearch className="size-6 text-slate-500" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900">{getInvestigationLabel(record)}</h2>
          <p className="text-sm text-slate-600" aria-live="polite">
            {getInvestigationMessage(record)}
          </p>
        </div>
        <DualModeToggle mode={mode} />
      </div>
      <p className="font-mono text-sm break-all text-slate-700">{record.defangedTarget}</p>
      <p className="text-sm text-slate-600">
        Belum ada kesimpulan aman atau berbahaya untuk input ini.
      </p>
      <InvestigationMetadata record={record} />
      <SandboxLaunchLink target={record.target} type={record.type} investigationId={record.id} />
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
      {record.type === "APK" && !apkReport && (
        <p className="text-xs text-slate-500">
          Sidik berkas dan metadata tersimpan. Berkas APK perlu diunggah kembali saat layanan
          analisis tersedia.
        </p>
      )}
      {mode === "geek" && !apkReport && (
        <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs break-all whitespace-pre-wrap text-slate-700">
          {JSON.stringify(
            {
              status: record.status,
              inputMetadata: record.inputMetadata,
              technicalEvidence: record.technicalEvidence,
              errorCode: record.errorCode,
            },
            null,
            2,
          )}
        </pre>
      )}
      {pathname !== PROTECTED_ROUTES.historyDetail(record.id) && (
        <Link
          href={PROTECTED_ROUTES.historyDetail(record.id, mode)}
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Lihat rekaman di riwayat
        </Link>
      )}
    </section>
  );
}
