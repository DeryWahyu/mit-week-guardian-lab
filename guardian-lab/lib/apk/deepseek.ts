/**
 * Guardian Lab: DeepSeek AI APK Threat Analysis Engine
 * Combines JADX reverse engineering artifacts with DeepSeek LLM intelligence
 * and provides a resilient rule-based offline heuristic fallback.
 */

import { sanitizeInvestigationText } from "@/lib/investigations/privacy";
import { scrubPii } from "@/lib/security/pii-scrubber";
import type { ApkStaticReport } from "@/lib/validations/apk-static";

export interface ApkThreatAnalysisResult {
  riskLevel: "SAFE" | "WARNING" | "DANGEROUS" | "MALWARE";
  riskScore: number;
  scamCategory: string;
  humanFriendlySummary: string;
  deceptionTricks: string[];
  emergencyActionPlan: {
    ifNotInstalled: string;
    ifAlreadyInstalled: string;
  };
  analysisSource: string;
  modelVersion: string;
}

const SYSTEM_PROMPT = `Anda adalah analis malware Android dan reverse engineering forensik profesional untuk Guardian Lab (platform perlindungan penipuan digital di Indonesia).
Analisis temuan dekompilasi berkas APK berikut secara objektif dan mendalam.
Fokus pada pola kejahatan siber yang marak di Indonesia: penyadapan SMS OTP (modus undangan pernikahan, kurir paket, surat tilang ETLE, tagihan PLN), trojan perbankan, pencurian data via bot Telegram, overlay window, dan accessibility abuse.
Berikan penjelasan yang mudah dipahami orang awam (Mode Manusia) sekaligus rincian teknis.
Output WAJIB berupa JSON valid murni (json_object) dengan struktur:
{
  "risk_level": "MALWARE" | "DANGEROUS" | "WARNING" | "SAFE",
  "risk_score": 0 - 100,
  "scam_category": "kategori penipuan / jenis malware spesifik",
  "human_friendly_summary": "ringkasan ancaman dalam bahasa Indonesia yang jelas bagi orang awam",
  "red_flags": [
    { "title": "indikasi", "plain_explanation": "penjelasan trik / bahaya" }
  ],
  "emergency_action_plan": {
    "if_not_installed": "langkah pencegahan jika belum dipasang",
    "if_already_installed": "langkah darurat mitigasi jika korban sudah memasang aplikasi"
  }
}`;

/**
 * Deterministic offline heuristic engine based on Android permission combinations,
 * Telegram bot traces, and reverse engineering indicators.
 */
export function buildApkHeuristicAnalysis(
  report: ApkStaticReport,
  _rawFileName: string,
): ApkThreatAnalysisResult {
  const permissions = report.manifest.permissions ?? [];
  const hasReceiveSms = permissions.some((p) => p.includes("RECEIVE_SMS"));
  const hasReadSms = permissions.some((p) => p.includes("READ_SMS"));
  const hasSendSms = permissions.some((p) => p.includes("SEND_SMS"));
  const hasSmsInterception = hasReceiveSms || hasReadSms || hasSendSms;

  const hasAccessibility = permissions.some((p) => p.includes("BIND_ACCESSIBILITY_SERVICE"));
  const hasOverlay = permissions.some((p) => p.includes("SYSTEM_ALERT_WINDOW"));
  const hasDropper = permissions.some(
    (p) => p.includes("REQUEST_INSTALL_PACKAGES") || p.includes("INSTALL_PACKAGES"),
  );
  const hasInternet = permissions.some((p) => p.includes("INTERNET"));
  const hasBoot = permissions.some((p) => p.includes("RECEIVE_BOOT_COMPLETED"));
  const hasPhoneState = permissions.some((p) => p.includes("READ_PHONE_STATE"));
  const hasContacts = permissions.some((p) => p.includes("READ_CONTACTS"));
  const hasTelegram = report.indicators.telegramBotCount > 0;

  // Case 1: SMS OTP Stealer (Undangan/Kurir/Tilang modus)
  if (hasSmsInterception) {
    const deceptionTricks: string[] = [
      "Meminta izin membaca dan menerima SMS (RECEIVE_SMS / READ_SMS) tanpa alasan fungsional yang sah untuk mencegat kode OTP perbankan.",
    ];
    if (hasTelegram) {
      deceptionTricks.push(
        `Ditemukan ${report.indicators.telegramBotCount} jejak token bot Telegram yang digunakan untuk mengirim SMS curian langsung ke penyerang.`,
      );
    }
    if (hasInternet) {
      deceptionTricks.push(
        "Meminta akses jaringan internet untuk mengeksfiltrasi data ke server luar.",
      );
    }
    if (hasBoot) {
      deceptionTricks.push(
        "Meminta izin RECEIVE_BOOT_COMPLETED agar malware otomatis aktif kembali setiap kali ponsel dinyalakan.",
      );
    }
    if (hasDropper) {
      deceptionTricks.push(
        "Meminta izin menginstal aplikasi lain di latar belakang (dropper payload).",
      );
    }

    return {
      riskLevel: "MALWARE",
      riskScore: hasTelegram ? 98 : hasInternet ? 94 : 88,
      scamCategory: "APK Penyadap SMS OTP (Modus Kurir/Undangan)",
      humanFriendlySummary: `Aplikasi ini terdeteksi memiliki karakteristik malware penyadap SMS OTP. Aplikasi meminta izin membaca pesan masuk yang sangat berbahaya karena dapat digunakan sindikat penipuan untuk mencuri kode verifikasi perbankan, dompet digital, atau akun WhatsApp Anda.`,
      deceptionTricks,
      emergencyActionPlan: {
        ifNotInstalled:
          "Segera hapus file installer APK ini dari folder unduhan perangkat Anda. Jangan pernah mengizinkan instalasi aplikasi dari sumber tidak dikenal (Unknown Sources).",
        ifAlreadyInstalled:
          "Segera aktifkan Mode Pesawat (matikan seluruh koneksi internet dan seluler). Buka Pengaturan > Aplikasi, cari aplikasi mencurigakan ini lalu copot/uninstall segera. Hubungi pihak bank Anda untuk memblokir sementara layanan mobile banking.",
      },
      analysisSource: "DEEPSEEK_STATIC_APK",
      modelVersion: "heuristic-v1",
    };
  }

  // Case 2: Accessibility / Overlay Banking Trojan
  if (hasAccessibility || hasOverlay) {
    const deceptionTricks: string[] = [];
    if (hasOverlay) {
      deceptionTricks.push(
        "Meminta izin SYSTEM_ALERT_WINDOW untuk menampilkan jendela palsu (overlay) di atas aplikasi lain.",
      );
    }
    if (hasAccessibility) {
      deceptionTricks.push(
        "Meminta izin BIND_ACCESSIBILITY_SERVICE yang dapat disalahgunakan untuk merekam sentuhan layar dan mencuri PIN/password.",
      );
    }

    return {
      riskLevel: "MALWARE",
      riskScore: 92,
      scamCategory: "Trojan Perbankan / Overlay Phishing",
      humanFriendlySummary:
        "Aplikasi meminta izin sistem berbahaya seperti Overlay atau Layanan Aksesibilitas. Izin ini memungkinkan penyerang memalsukan antarmuka aplikasi bank atau membaca seluruh aktivitas ketukan layar Anda.",
      deceptionTricks,
      emergencyActionPlan: {
        ifNotInstalled: "Jangan instal aplikasi ini. Hapus file APK dari perangkat.",
        ifAlreadyInstalled:
          "Matikan koneksi internet, masuk ke Pengaturan > Aksesibilitas, cabut izin aplikasi ini, lalu lakukan uninstall segera.",
      },
      analysisSource: "DEEPSEEK_STATIC_APK",
      modelVersion: "heuristic-v1",
    };
  }

  // Case 3: Dropper
  if (hasDropper) {
    return {
      riskLevel: "DANGEROUS",
      riskScore: 78,
      scamCategory: "Dropper Aplikasi Berbahaya",
      humanFriendlySummary:
        "Aplikasi meminta izin untuk memasang paket aplikasi lain ke perangkat. Pola ini berisiko karena dapat mengunduh dan menyisipkan aplikasi malware tambahan tanpa sepengetahuan pengguna.",
      deceptionTricks: [
        "Meminta izin REQUEST_INSTALL_PACKAGES untuk memasang aplikasi sekunder secara sepihak.",
      ],
      emergencyActionPlan: {
        ifNotInstalled: "Hapus file ini dan unduh aplikasi hanya dari Google Play Store resmi.",
        ifAlreadyInstalled:
          "Periksa daftar aplikasi terpasang di perangkat Anda dan hapus aplikasi asing.",
      },
      analysisSource: "DEEPSEEK_STATIC_APK",
      modelVersion: "heuristic-v1",
    };
  }

  // Case 4: Excessive Privacy Permissions
  if (hasPhoneState || hasContacts || permissions.length > 8) {
    const deceptionTricks: string[] = [];
    if (hasPhoneState)
      deceptionTricks.push("Meminta akses status telepon dan identitas perangkat.");
    if (hasContacts) deceptionTricks.push("Meminta izin akses ke daftar kontak pengguna.");

    return {
      riskLevel: "DANGEROUS",
      riskScore: 68,
      scamCategory: "Aplikasi Berisiko (Akses Privasi Berlebih)",
      humanFriendlySummary:
        "Aplikasi meminta izin akses ke informasi sensitif seperti kontak atau identitas perangkat. Periksa apakah fungsionalitas aplikasi benar-benar membutuhkan izin-izin tersebut.",
      deceptionTricks: deceptionTricks.length
        ? deceptionTricks
        : ["Meminta kombinasi izin berlebih."],
      emergencyActionPlan: {
        ifNotInstalled:
          "Pertimbangkan kembali kebutuhan Anda sebelum memasang aplikasi pihak ketiga.",
        ifAlreadyInstalled:
          "Tinjau dan cabut izin sensitif melalui menu Pengaturan > Aplikasi > Izin.",
      },
      analysisSource: "DEEPSEEK_STATIC_APK",
      modelVersion: "heuristic-v1",
    };
  }

  // Case 5: Standard Clean App
  return {
    riskLevel: "SAFE",
    riskScore: 12,
    scamCategory: "Aplikasi Android Standar",
    humanFriendlySummary:
      "Struktur dekompilasi berkas tidak menunjukkan izin berbahaya atau indikator malware seperti penyadap SMS, trojan aksesibilitas, atau eksfiltrasi data ke bot Telegram.",
    deceptionTricks: [],
    emergencyActionPlan: {
      ifNotInstalled: "Tetap waspada dan pastikan sumber pengunduhan berkas dapat dipercaya.",
      ifAlreadyInstalled: "Tidak ada tindakan darurat yang diperlukan.",
    },
    analysisSource: "DEEPSEEK_STATIC_APK",
    modelVersion: "heuristic-v1",
  };
}

/**
 * Analyzes APK reverse engineering data with DeepSeek AI (with automatic heuristic fallback).
 */
export async function analyzeApkThreatWithDeepSeek(
  report: ApkStaticReport,
  rawFileName: string,
): Promise<ApkThreatAnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const isKeyConfigured = apiKey && !apiKey.includes("your_deepseek_") && apiKey.trim().length > 10;

  if (!isKeyConfigured) {
    return buildApkHeuristicAnalysis(report, rawFileName);
  }

  try {
    // 1. Mandatory PII Scrubbing
    const safeFileName = scrubPii(rawFileName).sanitizedText;
    const safePackageName = scrubPii(report.manifest.packageName ?? "unknown").sanitizedText;
    const safeLabel = scrubPii(report.manifest.label ?? "unknown").sanitizedText;
    const permissionsSummary = (report.manifest.permissions ?? []).slice(0, 50).join(", ");
    const urlsSummary = report.indicators.urls
      .slice(0, 15)
      .map((u) => u.value)
      .join(", ");
    const snippetsSummary = report.snippets
      .slice(0, 5)
      .map((s) => `[${s.source}]: ${s.code}`)
      .join("\n\n");

    const userPrompt = [
      `Nama berkas: ${safeFileName}`,
      `Nama label aplikasi: ${safeLabel}`,
      `Nama paket (package name): ${safePackageName}`,
      `SDK Target: ${report.manifest.targetSdk ?? "N/A"}, Min: ${report.manifest.minSdk ?? "N/A"}`,
      `Daftar Izin Diminta (${report.manifest.permissions.length}): ${permissionsSummary || "Tidak ada"}`,
      `Jejak Indikator: ${report.indicators.telegramBotCount} bot Telegram terdeteksi, ${report.indicators.redactedContactCount} jejak kontak.`,
      `Endpoint URL Terdeteksi: ${urlsSummary || "Tidak ada"}`,
      `Cuplikan Kode Terdekompilasi:\n${snippetsSummary || "Tidak ada cuplikan spesifik"}`,
    ].join("\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return buildApkHeuristicAnalysis(report, rawFileName);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return buildApkHeuristicAnalysis(report, rawFileName);
    }

    const parsed = JSON.parse(content);

    const validRiskLevels = ["SAFE", "WARNING", "DANGEROUS", "MALWARE"] as const;
    const rawRisk = String(parsed.risk_level ?? "").toUpperCase();
    const riskLevel = validRiskLevels.includes(rawRisk as (typeof validRiskLevels)[number])
      ? (rawRisk as (typeof validRiskLevels)[number])
      : buildApkHeuristicAnalysis(report, rawFileName).riskLevel;

    const rawScore = Number(parsed.risk_score);
    const riskScore =
      Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 100
        ? Math.round(rawScore)
        : buildApkHeuristicAnalysis(report, rawFileName).riskScore;

    const scamCategory = sanitizeInvestigationText(
      String(parsed.scam_category || buildApkHeuristicAnalysis(report, rawFileName).scamCategory),
    ).slice(0, 190);

    const humanFriendlySummary = sanitizeInvestigationText(
      String(
        parsed.human_friendly_summary ||
          buildApkHeuristicAnalysis(report, rawFileName).humanFriendlySummary,
      ),
    ).slice(0, 10000);

    const deceptionTricks: string[] = Array.isArray(parsed.red_flags)
      ? parsed.red_flags
          .map((rf: { title?: string; plain_explanation?: string }) => {
            const title = rf.title ? `${rf.title}: ` : "";
            const desc = rf.plain_explanation || "";
            return sanitizeInvestigationText(`${title}${desc}`);
          })
          .filter(Boolean)
          .slice(0, 20)
      : buildApkHeuristicAnalysis(report, rawFileName).deceptionTricks;

    const emergencyActionPlan = {
      ifNotInstalled: sanitizeInvestigationText(
        String(
          parsed.emergency_action_plan?.if_not_installed ||
            buildApkHeuristicAnalysis(report, rawFileName).emergencyActionPlan.ifNotInstalled,
        ),
      ),
      ifAlreadyInstalled: sanitizeInvestigationText(
        String(
          parsed.emergency_action_plan?.if_already_installed ||
            buildApkHeuristicAnalysis(report, rawFileName).emergencyActionPlan.ifAlreadyInstalled,
        ),
      ),
    };

    return {
      riskLevel,
      riskScore,
      scamCategory,
      humanFriendlySummary,
      deceptionTricks,
      emergencyActionPlan,
      analysisSource: "DEEPSEEK_STATIC_APK",
      modelVersion: "deepseek-chat",
    };
  } catch {
    return buildApkHeuristicAnalysis(report, rawFileName);
  }
}
