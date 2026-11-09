import type { ApkStaticReport } from "@/lib/validations/apk-static";

export function ApkStaticTechnical({
  report,
  sha256,
}: {
  report: ApkStaticReport;
  sha256?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold text-slate-900">Metadata dan cakupan ekstraksi</h4>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs break-all whitespace-pre-wrap text-slate-100">
          {JSON.stringify(
            {
              sha256,
              manifest: report.manifest,
              archive: report.archive,
              coverage: report.coverage,
              botFingerprints: report.indicators.botFingerprints,
            },
            null,
            2,
          )}
        </pre>
      </div>
      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="text-sm font-semibold">
          Contoh alamat dari sumber ({report.indicators.urls.length})
        </summary>
        {report.indicators.urls.length ? (
          <ul className="mt-3 max-h-80 space-y-3 overflow-auto text-xs">
            {report.indicators.urls.map((entry, index) => (
              <li key={`${index}-${entry.source}`}>
                <p className="font-mono text-slate-800">{entry.value}</p>
                <p className="mt-1 text-slate-500">Sumber: {entry.source}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Tidak ada alamat HTTP/S yang tercatat pada sumber yang sempat dibaca.
          </p>
        )}
      </details>
      <div className="space-y-2">
        <h4 className="font-semibold text-slate-900">Potongan hasil JADX yang disamarkan</h4>
        <p className="text-xs text-slate-500">
          Konstanta string dan angka sensitif disamarkan. Potongan ini membantu menelusuri sumber
          dan bukan bukti bahwa kode telah dijalankan.
        </p>
        {report.snippets.length ? (
          report.snippets.map((snippet, index) => (
            <details
              key={`${index}-${snippet.source}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <summary className="font-mono text-xs [overflow-wrap:anywhere]">
                {snippet.source}
              </summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs break-all whitespace-pre-wrap text-slate-100">
                {snippet.code}
              </pre>
            </details>
          ))
        ) : (
          <p className="text-sm text-slate-600">
            Tidak ada potongan yang cocok dengan indikator pencarian pada bagian yang terbaca.
          </p>
        )}
      </div>
    </div>
  );
}
