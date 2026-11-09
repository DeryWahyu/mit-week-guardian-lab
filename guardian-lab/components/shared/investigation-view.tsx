"use client";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { ResultPresenter } from "@/components/landing/results/result-presenter";
import { ResultSkeleton } from "@/components/landing/results/result-skeleton";
import { useInvestigation } from "@/lib/hooks/use-investigation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import { InvestigationProblem } from "./investigation-problem";

export function InvestigationView({
  id,
  scope,
  expectedType,
  returnTo,
  presentation = "default",
}: {
  id: string;
  scope?: string;
  expectedType?: Investigation["type"];
  returnTo?: string;
  presentation?: "default" | "workspace" | "dialog";
}) {
  const { record, loading, refreshing, problem, retry } = useInvestigation(id, scope);
  if (loading) return <ResultSkeleton />;
  if (!record && problem)
    return (
      <InvestigationProblem
        presentation={presentation}
        problem={problem}
        onRetry={retry}
        id={id}
        returnTo={returnTo}
      />
    );
  if (record && expectedType && record.type !== expectedType) {
    return (
      <output className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        <p>Jenis rekaman ini berbeda dari pemeriksaan di halaman ini.</p>
        <Link
          href={PROTECTED_ROUTES.historyDetail(record.id)}
          className="inline-flex min-h-11 items-center font-semibold text-cyan-800 underline"
        >
          Buka hasil di riwayat
        </Link>
      </output>
    );
  }
  return (
    <div className={presentation === "dialog" ? "space-y-3" : "space-y-4"} data-user-reveal>
      {presentation !== "dialog" && (
        <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-500">
          {refreshing && <span aria-live="polite">Memperbarui status…</span>}
          <button
            type="button"
            disabled={refreshing}
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Perbarui status
          </button>
        </div>
      )}
      {problem && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {problem.message} Tampilan berikut menggunakan data terakhir yang berhasil dimuat.
        </div>
      )}
      <ResultPresenter result={record} presentation={presentation} />
    </div>
  );
}
