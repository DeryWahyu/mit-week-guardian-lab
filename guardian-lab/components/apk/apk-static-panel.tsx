import { explainPermission } from "@/lib/apk/presentation";
import type { ApkStaticReport } from "@/lib/validations/apk-static";
import { ApkPermissionList } from "./apk-permission-list";
import { ApkStaticTechnical } from "./apk-static-technical";

export function ApkStaticPanel({
  report,
  mode,
  sha256,
  presentation = "default",
}: {
  report: ApkStaticReport;
  mode: "human" | "geek";
  sha256?: string;
  presentation?: "default" | "workspace" | "dialog";
}) {
  return (
    <section
      aria-label="Bukti statis APK"
      className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 [overflow-wrap:anywhere]"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900">
          {report.status === "PARTIAL" ? "Ekstraksi statis parsial" : "Ekstraksi statis tersimpan"}
        </h3>
        <p className="text-sm text-slate-600">
          Berkas dibaca tanpa dipasang atau dijalankan. Izin dan alamat yang ditemukan belum
          membuktikan perilaku berbahaya.
        </p>
        <p className="text-xs text-slate-500">
          {report.engine} {report.engineVersion} ·{" "}
          {new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }).format(new Date(report.extractedAt))}{" "}
          UTC
        </p>
      </div>
      {mode === "geek" && report.warnings.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
      {mode === "geek" ? (
        <ApkStaticTechnical report={report} sha256={sha256} />
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Nama aplikasi", report.manifest.label],
              ["Paket", report.manifest.packageName],
              ["Versi", report.manifest.versionName],
              ["Kode versi", report.manifest.versionCode],
              ["SDK minimum", report.manifest.minSdk],
              ["SDK target", report.manifest.targetSdk],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-800">{value ?? "Tidak tercantum"}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">
              Izin yang dideklarasikan ({report.manifest.permissions.length})
            </h4>
            <p className="text-xs text-slate-600">
              Deklarasi izin berbeda dari izin yang sudah diberikan. Efeknya bergantung pada versi
              Android dan persetujuan pengguna.
            </p>
            {report.manifest.permissions.length && presentation === "workspace" ? (
              <ApkPermissionList permissions={report.manifest.permissions} />
            ) : report.manifest.permissions.length ? (
              <div className="max-h-80 space-y-2 overflow-auto">
                {report.manifest.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <p className="text-slate-700">{explainPermission(permission)}</p>
                    <code className="text-xs text-slate-500">{permission}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Tidak ada deklarasi uses-permission yang terbaca pada manifest ini. Hal ini tidak
                menjadi jaminan keamanan.
              </p>
            )}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <h4 className="font-semibold text-slate-900">Jejak teks pada hasil ekstraksi</h4>
            <p>
              {report.indicators.urls.length} contoh alamat tercatat ·{" "}
              {report.indicators.telegramBotCount} indikator token bot Telegram unik ·{" "}
              {report.indicators.redactedContactCount} kemunculan kontak/identitas disamarkan.
            </p>
            <p className="text-xs">
              Alamat dapat berasal dari pustaka atau konfigurasi aplikasi. Hubungan dengan penipuan
              atau server pengendali belum dapat disimpulkan. Rincian tersedia di Mode Teknis.
            </p>
          </div>
        </>
      )}
      <p className="text-xs text-slate-500">
        Pemeriksaan ini belum memverifikasi tanda tangan APK atau perilaku saat aplikasi berjalan.
        Binary APK tidak disimpan; unggah kembali jika diperlukan pemeriksaan ulang.
      </p>
    </section>
  );
}
