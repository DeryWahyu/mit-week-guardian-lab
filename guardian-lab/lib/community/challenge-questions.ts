import { createHash } from "node:crypto";
import type { CommunityReport } from "@/lib/validations/community";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function question(
  caseId: string,
  id: string,
  questionText: string,
  choices: string[],
  explanation: string,
) {
  const options = [...new Set(choices)]
    .map((text) => ({ id: hash(`${caseId}:${id}:${text}`).slice(0, 16), text }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    id,
    questionText,
    options,
    multiple: false,
    correctId: hash(`${caseId}:${id}:${choices[0]}`).slice(0, 16),
    explanation,
  };
}
export function buildChallenge(caseId: string, updatedAt: Date, report: CommunityReport) {
  const evidence = report.technicalEvidence;
  const model = evidence.urlModel;
  const riskChoices = model
    ? [
        "Indikator model rendah menurut hasil tersimpan",
        "Indikator model sedang menurut hasil tersimpan",
        "Indikator model tinggi menurut hasil tersimpan",
      ]
    : [
        "Risiko rendah menurut hasil tersimpan",
        "Perlu diwaspadai menurut hasil tersimpan",
        "Risiko tinggi menurut hasil tersimpan",
      ];
  const riskIndex = ["SAFE", "LOW"].includes(report.riskLevel)
    ? 0
    : ["WARNING", "MEDIUM"].includes(report.riskLevel)
      ? 1
      : 2;
  const risk = riskChoices[riskIndex];
  const fact = evidence.permissions?.[0]
    ? `Izin ${evidence.permissions[0]} tercatat pada bukti.`
    : evidence.c2Endpoints?.[0]
      ? `Origin ${evidence.c2Endpoints[0]} tercatat pada bukti.`
      : `Laporan mencatat: ${(report.deceptionTricks[0] ?? report.summary).slice(0, 360)}`;
  const questions = [
    question(
      caseId,
      "risk",
      model
        ? "Kategori indikator model apa yang tercatat pada snapshot URL ini?"
        : "Kategori risiko apa yang dinyatakan hasil investigasi kasus ini?",
      [risk, ...riskChoices.filter((c) => c !== risk)],
      model
        ? "Jawaban mengikuti indikator model riset yang tersimpan. Indikator tetap perlu verifikasi dan bukan label phishing yang sudah dikonfirmasi."
        : "Gunakan kesimpulan hasil tersimpan, lalu baca alasan dan keterbatasannya. Nilai ini tidak membuktikan kondisi semua perangkat atau tautan lain.",
    ),
    question(
      caseId,
      "evidence",
      "Pernyataan mana yang benar-benar didukung snapshot kasus ini?",
      [
        fact,
        "Semua data di perangkat sudah pasti dicuri.",
        "Semua aplikasi dan tautan terkait sudah dijamin aman.",
      ],
      "Bedakan bukti yang tercatat dari asumsi tentang perilaku atau dampak yang belum dibuktikan.",
    ),
    question(
      caseId,
      "action",
      "Apa tindakan yang sesuai setelah membaca kasus ini?",
      [
        "Verifikasi sumber, hindari membagikan kredensial, dan gunakan hasil tersimpan saat memberi peringatan.",
        "Bagikan OTP untuk membuktikan bahwa layanan tersebut resmi.",
        "Nyatakan seluruh perangkat sudah aman hanya berdasarkan satu pemeriksaan.",
      ],
      "Hasil investigasi membantu mengambil keputusan. Jangan menyerahkan data pribadi atau membuat klaim yang melampaui bukti.",
    ),
  ];
  return {
    revision: hash(JSON.stringify([1, caseId, updatedAt.toISOString(), report])),
    questions,
  };
}
