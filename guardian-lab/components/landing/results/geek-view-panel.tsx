"use client";
import type { ThreatAnalysisResult } from "@/types/analysis";

export function GeekViewPanel({
  result,
}: {
  result: ThreatAnalysisResult;
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const entries = Object.entries(result.technicalEvidence);
  return (
    <section
      aria-label="Bukti teknis tersimpan"
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 text-slate-900 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-50 font-mono text-xs font-bold text-cyan-700">
            &gt;_
          </span>
          <h3 className="font-mono text-sm font-bold text-slate-900">Bukti Teknis Tersimpan</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-700 shadow-2xs">
          {result.technicalEvidence.urlModel ? "Indikator: " : ""}
          {result.riskLevel} · {result.riskScore}/100 · {result.scamCategory}
        </span>
      </div>

      {!entries.length ? (
        <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
          Belum ada bukti teknis yang tersimpan pada hasil ini.
        </p>
      ) : (
        <div className="space-y-3.5">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-cyan-100 bg-cyan-50 px-2 py-0.5 font-mono text-xs font-bold text-cyan-800">
                  {key}
                </span>
              </div>
              <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-slate-800">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
