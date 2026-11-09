import { getUrlModelLabel, type UrlModelEvidence } from "@/lib/validations/guardian-ml";
import { type Investigation, investigationResultSchema } from "@/lib/validations/investigation";
import type { ThreatAnalysisResult } from "@/types/analysis";

export const INVESTIGATION_STATUS_LABELS = {
  RECEIVED: "Input diterima",
  PROCESSING: "Sedang diproses",
  COMPLETED: "Analisis selesai",
  FAILED: "Pemeriksaan gagal",
  UNAVAILABLE: "Model belum tersedia",
} as const;

export function getInvestigationResult(record: Investigation): ThreatAnalysisResult | null {
  if (
    record.status !== "COMPLETED" ||
    !investigationResultSchema.safeParse(record).success ||
    !record.analysisSource ||
    !record.modelVersion ||
    record.analysisSource === "LEGACY_UNVERIFIED" ||
    record.riskLevel === null ||
    record.riskScore === null ||
    (record.technicalEvidence.urlModel &&
      record.technicalEvidence.urlModel.input_type !== record.type) ||
    !record.summary ||
    !record.scamCategory
  )
    return null;
  return {
    id: record.id,
    target: record.target,
    type: record.type,
    riskLevel: record.riskLevel,
    riskScore: record.riskScore,
    scamCategory: record.scamCategory,
    humanFriendlySummary: record.summary,
    deceptionTricks: record.deceptionTricks,
    technicalEvidence: record.technicalEvidence,
    defangedTarget: record.defangedTarget,
    emergencyActionPlan: { ifNotClicked: [], ifAlreadyInstalledOrFilled: [] },
  };
}

export function getInvestigationLabel(record: Investigation) {
  if (record.analysisSource === "LEGACY_UNVERIFIED") return "Rekaman lama";
  if (record.status === "COMPLETED" && !getInvestigationResult(record))
    return "Hasil belum lengkap";
  return INVESTIGATION_STATUS_LABELS[record.status];
}

export function getInvestigationMessage(record: Investigation) {
  if (record.analysisSource === "LEGACY_UNVERIFIED")
    return "Rekaman lama tersimpan. Hasilnya belum diverifikasi oleh model analisis.";
  if (record.status === "COMPLETED" && !getInvestigationResult(record))
    return "Data hasil belum lengkap. Skor dan kesimpulan belum dapat ditampilkan.";
  if (record.errorMessage) return record.errorMessage;
  if (record.status === "RECEIVED") return "Input telah diterima dan belum mulai diperiksa.";
  if (record.status === "PROCESSING")
    return "Pemeriksaan sedang berlangsung. Status akan diperbarui secara otomatis.";
  if (record.status === "FAILED")
    return "Pemeriksaan gagal. Anda dapat memeriksa input dan membuat investigasi baru.";
  return "Layanan analisis belum tersedia. Risiko input belum dapat ditentukan.";
}

export function getRiskPresentation(
  level: ThreatAnalysisResult["riskLevel"],
  model?: UrlModelEvidence,
) {
  const high = ["CRITICAL", "HIGH", "DANGEROUS", "PHISHING", "MALWARE"].includes(level);
  const low = ["SAFE", "LOW"].includes(level);
  const labels = {
    SAFE: "Risiko rendah (SAFE)",
    LOW: "Risiko rendah (LOW)",
    MEDIUM: "Risiko sedang (MEDIUM)",
    WARNING: "Perlu ditinjau (WARNING)",
    HIGH: "Risiko tinggi (HIGH)",
    DANGEROUS: "Terindikasi berbahaya (DANGEROUS)",
    PHISHING: "Terindikasi phishing (PHISHING)",
    MALWARE: "Terindikasi malware (MALWARE)",
    CRITICAL: "Risiko kritis (CRITICAL)",
  };
  return {
    high,
    low,
    label: model ? getUrlModelLabel(model.risk_band) : labels[level],
    color: high ? "text-rose-700" : low ? "text-emerald-700" : "text-amber-700",
    background: high ? "bg-rose-50" : low ? "bg-emerald-50" : "bg-amber-50",
  };
}
