import { FileSearch } from "lucide-react";
import { getRiskPresentation } from "@/lib/investigations/presentation";
import { cn } from "@/lib/utils";
import type { ThreatAnalysisResult } from "@/types/analysis";

export interface KedokCardProps {
  riskLevel: ThreatAnalysisResult["riskLevel"];
  scamCategory: string;
  humanFriendlySummary?: string;
  deceptionTricks?: string[];
  className?: string;
}
export function KedokCard({
  riskLevel,
  scamCategory,
  deceptionTricks = [],
  className,
}: KedokCardProps) {
  const risk = getRiskPresentation(riskLevel);
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all",
        className,
      )}
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <FileSearch className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Ringkasan Analisis
            </span>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-2xs">
            {scamCategory}
          </span>
        </div>

        <div className="pt-0.5">
          <h3 className="text-base font-bold text-slate-900">
            {risk.high && deceptionTricks.length
              ? "Kedok Penipu Terbongkar"
              : "Ringkasan Hasil Pemeriksaan"}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <h4 className="mb-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Temuan yang tercatat
          </h4>
          {deceptionTricks.length ? (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {deceptionTricks.map((trick, index) => (
                <li key={`${index}-${trick}`} className="flex items-start gap-1.5">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cyan-600" />
                  <span>{trick}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Tidak ada catatan tambahan pada hasil ini.</p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Evaluasi berbasis indikator pola dan karakteristik keamanan. Selalu verifikasi sebelum
          membuka tautan atau memasang berkas.
        </p>
      </div>
    </div>
  );
}
