import Link from "next/link";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Investigation } from "@/lib/validations/investigation";

export function InvestigationMetadata({
  record,
  compact = false,
}: {
  record: Investigation;
  compact?: boolean;
}) {
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleString("id-ID") : "Belum tercatat";
  const targetLabel = record.type === "APK" ? "Berkas target" : "URL target";
  const targetValue = record.defangedTarget || record.target || "Belum tersedia";

  const fields = [
    ["ID investigasi", record.id],
    [targetLabel, targetValue],
    ["Jenis input", record.type],
    ["Diterima", date(record.createdAt)],
    ["Mulai diproses", date(record.startedAt)],
    ["Waktu status akhir", record.finishedAt ? date(record.finishedAt) : "Belum berakhir"],
    ["Terakhir diperbarui", date(record.updatedAt)],
    ["Sumber analisis", record.analysisSource ?? "Belum tersedia"],
    ["Versi model", record.modelVersion ?? "Belum tersedia"],
  ];
  return (
    <dl
      className={
        compact
          ? "grid w-full grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3.5 text-xs sm:grid-cols-2 md:grid-cols-3"
          : "grid w-full gap-4 text-sm sm:grid-cols-2 md:grid-cols-3"
      }
    >
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className={compact ? "text-[11px] font-medium text-slate-400" : "text-slate-500"}>
            {label}
          </dt>
          <dd
            className={cn(
              compact
                ? "mt-0.5 text-xs font-semibold break-all text-slate-800"
                : "mt-0.5 break-all text-slate-800",
              (label.includes("target") || label.includes("ID")) && "font-mono",
            )}
          >
            {value}
          </dd>
        </div>
      ))}
      {typeof record.inputMetadata.sourceInvestigationId === "string" && (
        <div className={compact ? "col-span-1 sm:col-span-2 md:col-span-3" : undefined}>
          <dt className={compact ? "text-[11px] font-medium text-slate-400" : "text-slate-500"}>
            Sumber unduhan sandbox
          </dt>
          <dd>
            <Link
              className="text-brand-700 inline-flex min-h-11 items-center underline"
              href={PROTECTED_ROUTES.historyDetail(record.inputMetadata.sourceInvestigationId)}
            >
              Kembali ke investigasi URL/QR
            </Link>
          </dd>
        </div>
      )}
    </dl>
  );
}
