import type { Prisma } from "@prisma/client";
import { predictUrl } from "@/lib/analysis/guardian-ml";
import { prisma } from "@/lib/prisma";
import { sanitizeModelUrl } from "@/lib/security/model-url";
import { scanUrlSchema } from "@/lib/validations/analysis-input";
import {
  createInvestigation,
  MODEL_UNAVAILABLE_MESSAGE,
  receiveFailedInvestigation,
  transitionInvestigation,
} from "./service";

/** One intake pipeline for typed URLs and QR-derived URLs; provenance remains distinct. */
export async function receiveUrlInvestigation(input: {
  userId: string;
  url: string;
  type: "URL" | "QR";
  inputMetadata?: Prisma.InputJsonObject;
}) {
  const url = sanitizeModelUrl(scanUrlSchema.parse(input.url));
  const intake = {
    userId: input.userId,
    target: url ?? "[TAUTAN_DISAMARKAN]",
    type: input.type,
    inputMetadata: { ...input.inputMetadata, submittedAs: input.type === "QR" ? "qr" : "url" },
  };
  if (!url)
    return receiveFailedInvestigation(
      intake,
      "MODEL_INPUT_PRIVACY",
      "Tautan belum dapat disanitasi untuk analisis. Hapus data pribadi atau token dari tautan dan kirim kembali.",
    );
  const record = await prisma.$transaction(async (database) => {
    const received = await createInvestigation(intake, database);
    return transitionInvestigation(
      { id: received.id, userId: input.userId, status: "PROCESSING" },
      database,
    );
  });
  // Network work must not hold a database transaction open.
  const prediction = await predictUrl(url, input.type);
  if (!prediction.ok || prediction.result.status === "unavailable") {
    return transitionInvestigation({
      id: record.id,
      userId: input.userId,
      status: "UNAVAILABLE",
      errorCode: prediction.ok ? "MODEL_UNAVAILABLE" : prediction.errorCode,
      errorMessage: MODEL_UNAVAILABLE_MESSAGE,
    });
  }
  const result = prediction.result;
  if (result.status !== "complete")
    return transitionInvestigation({
      id: record.id,
      userId: input.userId,
      status: "FAILED",
      errorCode: "MODEL_UNSUPPORTED_INPUT",
      errorMessage: "Format tautan ini belum didukung model URL. Tautan tetap memerlukan verifikasi.",
    });
  return transitionInvestigation({
    id: record.id,
    userId: input.userId,
    status: "COMPLETED",
    result: {
      riskLevel: result.risk_band,
      riskScore: Math.round(result.model_score * 100),
      scamCategory: "Analisis pola URL",
      summary: `${result.human.title}. ${result.human.explanation}`,
      deceptionTricks: [],
      technicalEvidence: { urlModel: result },
      analysisSource: "GUARDIAN_ML",
      modelVersion: result.geek.model_version,
    },
  });
}
