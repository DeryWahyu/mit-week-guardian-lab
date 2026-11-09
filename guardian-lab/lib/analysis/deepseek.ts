/**
 * Guardian Lab: DeepSeek AI Analysis Engine
 * Integrates with DeepSeek API with PII scrubbing and resilient offline heuristic fallback.
 */

import { defangUrl } from "@/lib/security/defang";
import { scrubPii } from "@/lib/security/pii-scrubber";
import type { ThreatAnalysisResult } from "@/types/analysis";
import { analyzeLexicalUrl, type LexicalAnalysisResult } from "./lexical";

export type { ThreatAnalysisResult } from "@/types/analysis";

const SYSTEM_PROMPT = `Anda adalah analis keamanan siber profesional untuk Guardian Lab. Analisis metadata berikut secara mendalam, objektif, dan terstruktur. Berikan penjelasan yang mudah dipahami anak muda/orang awam (Mode Manusia) sekaligus rincian teknis untuk Mode Geek. Pastikan output SELALU berupa JSON valid sesuai kontrak berikut tanpa tambahan markdown di luar blok JSON.`;

/**
 * Builds resilient heuristic analysis when DeepSeek is offline or unconfigured.
 */
export function buildHeuristicAnalysis(
  rawTarget: string,
  lexical: LexicalAnalysisResult,
): ThreatAnalysisResult {
  const defanged = defangUrl(rawTarget);

  if (lexical.isLegitimateDomain || lexical.suggestedRiskLevel === "SAFE") {
    return {
      target: rawTarget,
      type: "URL",
      riskLevel: "SAFE",
      riskScore: lexical.riskScore,
      scamCategory: "Legitimate Corporate / Banking Portal",
      humanFriendlySummary:
        "Tautan ini cocok dengan domain resmi terverifikasi dan tidak menunjukkan anomali leksikal atau indikator rekayasa sosial.",
      deceptionTricks: [],
      technicalEvidence: {
        entropy: lexical.entropy,
      },
      emergencyActionPlan: {
        ifNotClicked: "Tautan aman untuk diakses melalui peramban resmi Anda.",
        ifAlreadyInstalledOrFilled:
          "Tidak ada tindakan darurat yang diperlukan karena domain terverifikasi aman.",
      },
      defangedTarget: defanged,
    };
  }

  if (lexical.suggestedRiskLevel === "MALWARE" || lexical.hasApkPath) {
    return {
      target: rawTarget,
      type: "URL",
      riskLevel: "MALWARE",
      riskScore: lexical.riskScore,
      scamCategory: "APK Penyadap SMS OTP (Modus Kurir/Undangan)",
      humanFriendlySummary:
        "Tautan ini mendistribusikan file aplikasi Android (.apk) berbahaya secara langsung di luar Google Play Store. Berbahaya untuk menyadap SMS OTP dan menguras rekening bank.",
      deceptionTricks: lexical.deceptionTricks,
      technicalEvidence: {
        entropy: lexical.entropy,
        typosquatTarget: lexical.typosquatTarget,
        levenshteinDistance: lexical.levenshteinDistance,
        suspiciousKeywords: lexical.suspiciousKeywords,
      },
      emergencyActionPlan: {
        ifNotClicked:
          "Jangan pernah mengunduh atau menginstal file .apk tersebut. Hapus pesan/tautan sekarang.",
        ifAlreadyInstalledOrFilled:
          "Segera aktifkan Mode Pesawat (matikan koneksi internet), buka Pengaturan > Aplikasi, hapus/copot aplikasi mencurigakan, dan segera hubungi Call Center bank Anda untuk memblokir sementara layanan m-banking.",
      },
      defangedTarget: defanged,
    };
  }

  // Phishing / High Risk
  const brandName = lexical.brandImpersonated || "Lembaga Resmi";
  return {
    target: rawTarget,
    type: "URL",
    riskLevel: lexical.suggestedRiskLevel === "PHISHING" ? "PHISHING" : "DANGEROUS",
    riskScore: lexical.riskScore,
    scamCategory: lexical.brandImpersonated
      ? `Web Phishing Kredensial ${lexical.brandImpersonated}`
      : "Web Phishing Kredensial",
    humanFriendlySummary: `Situs ini meniru tampilan ${brandName} dengan domain palsu untuk memancing korban dan mencuri kredensial atau kode OTP rahasia.`,
    deceptionTricks: lexical.deceptionTricks,
    technicalEvidence: {
      entropy: lexical.entropy,
      typosquatTarget: lexical.typosquatTarget,
      levenshteinDistance: lexical.levenshteinDistance,
      suspiciousKeywords: lexical.suspiciousKeywords,
      suspiciousTld: lexical.isRiskyTld ? `.${lexical.tld}` : undefined,
    },
    emergencyActionPlan: {
      ifNotClicked:
        "Tutup tab peramban ini sekarang. Jangan pernah memasukkan nomor rekening, PIN, atau kata sandi Anda.",
      ifAlreadyInstalledOrFilled:
        "Segera ganti kata sandi dan PIN akun Anda melalui aplikasi resmi, laporkan ke pihak bank atau penyedia dompet digital, dan pantau mutasi saldo secara berkala.",
    },
    defangedTarget: defanged,
  };
}

/**
 * Analyzes URL threat combining DeepSeek LLM with fallback heuristic.
 */
export async function analyzeThreatWithDeepSeek(
  targetUrl: string,
  lexicalResult?: LexicalAnalysisResult,
): Promise<ThreatAnalysisResult> {
  const lexical = lexicalResult ?? analyzeLexicalUrl(targetUrl);
  const defanged = defangUrl(targetUrl);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const isKeyConfigured = apiKey && !apiKey.includes("your_deepseek_") && apiKey.trim().length > 10;

  if (!isKeyConfigured) {
    return buildHeuristicAnalysis(targetUrl, lexical);
  }

  try {
    // 1. Mandatory PII Scrubbing before external dispatch
    const { sanitizedText } = scrubPii(targetUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analisis URL berikut:\nURL: ${sanitizedText}\nFitur Leksikal:\n- Entropy: ${lexical.entropy}\n- Risky TLD: ${lexical.isRiskyTld}\n- Typosquat Target: ${lexical.typosquatTarget || "none"}\n- Has APK Path: ${lexical.hasApkPath}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return buildHeuristicAnalysis(targetUrl, lexical);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return buildHeuristicAnalysis(targetUrl, lexical);
    }

    const parsed = JSON.parse(content);

    // Map DeepSeek response to ThreatAnalysisResult
    const riskLevelMapped = lexical.suggestedRiskLevel;
    const ifNotClicked = Array.isArray(parsed.emergency_action_plan?.if_not_clicked_yet)
      ? parsed.emergency_action_plan.if_not_clicked_yet.join(" ")
      : typeof parsed.emergency_action_plan?.if_not_clicked_yet === "string"
        ? parsed.emergency_action_plan.if_not_clicked_yet
        : "Tutup tab dan jangan masukkan data kredensial.";

    const ifAlreadyFilled = Array.isArray(
      parsed.emergency_action_plan?.if_already_installed_or_filled,
    )
      ? parsed.emergency_action_plan.if_already_installed_or_filled.join(" ")
      : typeof parsed.emergency_action_plan?.if_already_installed_or_filled === "string"
        ? parsed.emergency_action_plan.if_already_installed_or_filled
        : "Segera ubah kata sandi dan hubungi bank resmi.";

    const deceptionTricks = Array.isArray(parsed.red_flags)
      ? parsed.red_flags.map(
          (rf: { title?: string; plain_explanation?: string }) =>
            `${rf.title || "Indikasi Mencurigakan"}: ${rf.plain_explanation || ""}`,
        )
      : lexical.deceptionTricks;

    return {
      target: targetUrl,
      type: "URL",
      riskLevel: riskLevelMapped,
      riskScore: parsed.risk_score_indicator ?? lexical.riskScore,
      scamCategory:
        parsed.scam_category ??
        (lexical.brandImpersonated
          ? `Web Phishing Kredensial ${lexical.brandImpersonated}`
          : "Web Phishing Kredensial"),
      humanFriendlySummary:
        parsed.human_friendly_summary ??
        buildHeuristicAnalysis(targetUrl, lexical).humanFriendlySummary,
      deceptionTricks: deceptionTricks.length > 0 ? deceptionTricks : lexical.deceptionTricks,
      technicalEvidence: {
        entropy: lexical.entropy,
        typosquatTarget: lexical.typosquatTarget,
        levenshteinDistance: lexical.levenshteinDistance,
        suspiciousKeywords: lexical.suspiciousKeywords,
        suspiciousTld: lexical.isRiskyTld ? `.${lexical.tld}` : undefined,
      },
      emergencyActionPlan: {
        ifNotClicked,
        ifAlreadyInstalledOrFilled: ifAlreadyFilled,
      },
      defangedTarget: defanged,
    };
  } catch {
    return buildHeuristicAnalysis(targetUrl, lexical);
  }
}
