import { Shield } from "lucide-react";
import { getRiskPresentation } from "@/lib/investigations/presentation";
import { cn } from "@/lib/utils";
import type { UrlModelEvidence } from "@/lib/validations/guardian-ml";
import type { ThreatAnalysisResult } from "@/types/analysis";

export interface ThreatScoreGaugeProps {
  score: number;
  riskLevel: ThreatAnalysisResult["riskLevel"];
  defangedTarget?: string;
  scamCategory: string;
  model?: UrlModelEvidence;
  className?: string;
}
export function ThreatScoreGauge({
  score,
  riskLevel,
  scamCategory,
  model,
  className,
}: ThreatScoreGaugeProps) {
  const risk = getRiskPresentation(riskLevel, model);
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
              <Shield className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              {model ? "Skor Indikator Model" : "Skor Risiko"}
            </span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs",
              risk.color,
              risk.background,
            )}
          >
            {risk.label}
          </span>
        </div>

        <div className="space-y-2 pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-900">{score}</span>
            <span className="text-sm font-medium text-slate-400">/ 100</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{scamCategory}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[11px] leading-relaxed text-slate-400">
          {model
            ? "Kategori mengikuti threshold model sebelum pembulatan. Indikator skor bukan jaminan mutlak tautan aman."
            : "Kategori dan skor risiko mengikuti hasil analisis tersimpan. Selalu verifikasi sebelum membuka tautan atau memasang berkas."}
        </p>
      </div>
    </div>
  );
}
