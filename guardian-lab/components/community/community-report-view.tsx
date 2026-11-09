"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { GeekViewPanel } from "@/components/landing/results/geek-view-panel";
import { KedokCard } from "@/components/landing/results/kedok-card";
import { ThreatScoreGauge } from "@/components/landing/results/threat-score-gauge";
import { DualModeToggle } from "@/components/shared/dual-mode-toggle";
import { UrlModelNotice } from "@/components/shared/url-model-notice";
import type { CommunityReport } from "@/lib/validations/community";
import type { ThreatAnalysisResult } from "@/types/analysis";
import { CommunityCaseReport } from "./community-case-report";

export function CommunityReportView({
  report,
  presentation = "default",
}: {
  report: CommunityReport;
  presentation?: "default" | "case";
}) {
  const params = useSearchParams();
  const path = usePathname();
  function searchEvidence(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("evidence", value);
    else next.delete("evidence");
    window.history.replaceState(null, "", `${path}${next.size ? `?${next}` : ""}`);
  }
  if (presentation === "case")
    return (
      <CommunityCaseReport
        report={report}
        mode={params.get("mode") === "geek" ? "geek" : "human"}
        search={params.get("evidence") ?? ""}
        onSearchChange={searchEvidence}
      />
    );
  const result: ThreatAnalysisResult = {
    ...report,
    id: "community-snapshot",
    defangedTarget: report.target,
    humanFriendlySummary: report.summary,
    emergencyActionPlan: { ifNotClicked: [], ifAlreadyInstalledOrFilled: [] },
  };
  return (
    <section
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 [overflow-wrap:anywhere]"
      data-user-reveal
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Snapshot hasil pemeriksaan</h2>
        <DualModeToggle mode={params.get("mode") === "geek" ? "geek" : "human"} />
      </div>
      <p className="text-xs text-slate-500">
        {report.type} · Sumber: {report.analysisSource} · Model: {report.modelVersion}
        <br />
        Waktu hasil:{" "}
        {new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(report.analyzedAt))}{" "}
        UTC
      </p>
      <UrlModelNotice model={result.technicalEvidence.urlModel} />
      {params.get("mode") === "geek" ? (
        <GeekViewPanel
          result={result}
          search={params.get("evidence") ?? ""}
          onSearchChange={searchEvidence}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ThreatScoreGauge
            score={result.riskScore}
            riskLevel={result.riskLevel}
            defangedTarget={result.target}
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
      )}
      <p className="text-xs text-slate-500">
        Target dan data pribadi disamarkan. Bukti mentah, token, dan identitas pengaju tidak
        disertakan.
      </p>
    </section>
  );
}
