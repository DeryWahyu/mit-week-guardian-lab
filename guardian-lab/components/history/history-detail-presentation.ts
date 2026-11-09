import type { Investigation } from "@/lib/validations/investigation";

export const recordTypeLabels = { URL: "Tautan URL", QR: "Kode QR", APK: "Berkas APK" } as const;
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});
export function recordDate(value: string | null) {
  if (!value) return "Belum tercatat";
  return `${dateFormat.format(new Date(value))} WIB`;
}
export function recordSource(record: Investigation) {
  if (record.analysisSource === "LOCAL_DEMO") return "Simulasi lokal";
  if (record.analysisSource === "GUARDIAN_ML") return "Guardian ML";
  if (record.analysisSource === "APK_STATIC") return "Ekstraksi statis APK";
  if (record.analysisSource === "LEGACY_UNVERIFIED") return "Rekaman lama";
  return record.analysisSource ?? "Belum tersedia";
}
