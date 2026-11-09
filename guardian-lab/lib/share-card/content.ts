import { getInvestigationResult, getRiskPresentation } from "@/lib/investigations/presentation";
import { defangTarget, sanitizeInvestigationText } from "@/lib/investigations/privacy";
import { URL_MODEL_NOTICE } from "@/lib/validations/guardian-ml";
import type { Investigation } from "@/lib/validations/investigation";

function sanitizeIndicator(input: string) {
  let value = input.replace(/^hxxp/i, "http").replace(/\[\.\]/g, ".");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }
  // Previous PII redaction can make the authority unparsable. Drop query/fragment
  // before parsing, and mask an invalid authority instead of leaking its leftovers.
  value = value.replace(/[?#][\s\S]*$/, "");
  try {
    new URL(value);
    return defangTarget(sanitizeInvestigationText(value));
  } catch {
    const path = value.replace(/^[^:]+:\/\/[^/]*/, "");
    return `hxxps://[REDACTED_HOST]${sanitizeInvestigationText(path)}`;
  }
}

/** Shared prose must not restore clickable indicators or expose URL credentials. */
export function sanitizeShareText(value: string): string {
  const urls = value.replace(/\b(?:https?|hxxps?):\/\/[^\s<>"']+/gi, sanitizeIndicator);
  return sanitizeInvestigationText(urls)
    .replace(/https?:\/\//gi, (scheme) => scheme.replace(/http/i, "hxxp"))
    .replace(/\b([a-z][a-z0-9+.-]*):\/\//gi, (match, scheme: string) =>
      /^hxxps?$/i.test(scheme) ? match : `${scheme}[:]//`,
    )
    .replace(/\b(?:[a-z0-9_-]+\.)+[a-z0-9-]+\b/gi, (domain) => domain.replace(/\./g, "[.]"))
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(value: string, limit: number) {
  const characters = Array.from(value);
  return characters.length <= limit ? value : `${characters.slice(0, limit - 1).join("")}…`;
}

export function buildShareCard(record: Investigation) {
  const result = getInvestigationResult(record);
  if (!result) return null;
  const model = result.technicalEvidence.urlModel;
  const risk = getRiskPresentation(result.riskLevel, model);
  const cleanTarget = sanitizeShareText(record.target);
  // Preserve the complete authority: clipping a hostname can hide its actual suffix.
  const authority = cleanTarget.match(/^[^/]+\/\/[^/?#]+/)?.[0] ?? "";
  const targetLimit = Math.max(240, Array.from(authority).length + 1);
  const target = shorten(cleanTarget, targetLimit);
  const summary = shorten(sanitizeShareText(result.humanFriendlySummary), 360);
  const allFindings = [...new Set(result.deceptionTricks.map(sanitizeShareText).filter(Boolean))];
  const findings = allFindings.slice(0, 3).map((text) => shorten(text, 180));
  const category = shorten(sanitizeShareText(result.scamCategory), 120);
  const source = shorten(sanitizeShareText(record.analysisSource ?? ""), 80);
  const version = shorten(sanitizeShareText(record.modelVersion ?? ""), 80);
  const truncated =
    target !== cleanTarget ||
    summary !== sanitizeShareText(result.humanFriendlySummary) ||
    allFindings.length > findings.length ||
    allFindings.slice(0, 3).some((text, i) => text !== findings[i]) ||
    category !== sanitizeShareText(result.scamCategory) ||
    source !== sanitizeShareText(record.analysisSource ?? "") ||
    version !== sanitizeShareText(record.modelVersion ?? "");
  const date = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(record.finishedAt ?? record.updatedAt));
  const data = {
    id: record.id,
    type: record.type,
    target,
    summary,
    findings,
    category,
    source,
    version,
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    scoreLabel: model ? "Skor indikator model" : "Skor risiko tersimpan",
    notice: model ? URL_MODEL_NOTICE : null,
    risk,
    title: model ? "Indikator pola URL" : risk.low ? "Ringkasan pemeriksaan" : "Waspadai temuan ini",
    date: `${record.finishedAt ? "Hasil" : "Diperbarui"}: ${date} UTC`,
    truncated,
    filename: `guardian-${record.type.toLowerCase()}-${record.id}.png`,
  };
  return {
    ...data,
    text: [
      `Guardian Lab: ${data.title}`,
      risk.label,
      `${model ? data.scoreLabel : "Skor risiko"}: ${data.riskScore}/100`,
      `${data.type === "APK" ? "Berkas" : "Target dinonaktifkan"}: ${target}`,
      `Kategori: ${category}`,
      "",
      summary,
      ...findings.map((finding) => `• ${finding}`),
      "",
      ...(truncated ? ["Ringkasan dipersingkat dari hasil tersimpan."] : []),
      ...(data.notice ? [data.notice, "Model riset nonkomersial, masih dikembangkan."] : []),
      "Hasil pemeriksaan menggambarkan saat analisis, bukan jaminan keamanan.",
      `Sumber: ${source} · Model: ${version}`,
      data.date,
      `ID: ${record.id}`,
    ].join("\n"),
  };
}

export type ShareCardData = NonNullable<ReturnType<typeof buildShareCard>>;
