import { z } from "zod";

const reasonCodes = z.array(z.string().regex(/^[a-z_]{1,128}$/)).max(50);
const thresholdsSchema = z
  .object({ warning: z.number().min(0).max(1), high: z.number().min(0).max(1) })
  .refine((value) => value.warning <= value.high);
const humanSchema = z.object({
  title: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(5000),
  recommended_action: z.literal("perlu_verifikasi"),
});
const geekSchema = z.object({
  scope: z.literal("url_only"),
  model_version: z.string().regex(/^[a-zA-Z0-9_-]{1,191}$/).nullable(),
  artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  feature_schema: z.string().regex(/^[a-zA-Z0-9_-]{1,191}$/).nullable(),
  score_reference: z.literal("research_calibration_not_traffic_probability"),
  thresholds: thresholdsSchema.nullable(),
  context_flags: reasonCodes,
  content_inspected: z.literal(false),
  qr_image_decoded_by_service: z.literal(false),
});
const common = z.object({
  mode: z.literal("shadow"),
  input_type: z.enum(["URL", "QR"]),
  decision: z.literal("needs_review"),
  needs_further_review: z.literal(true),
  production_ready: z.literal(false),
  noncommercial_research_only: z.literal(true),
  reason_codes: reasonCodes,
  human: humanSchema,
});

/** Completed evidence retains the original score; the integer UI score is only a display. */
export const urlModelEvidenceSchema = common
  .extend({
    status: z.literal("complete"),
    risk_band: z.enum(["LOW", "MEDIUM", "HIGH"]),
    model_score: z.number().min(0).max(1),
    geek: geekSchema.extend({
      model_version: geekSchema.shape.model_version.unwrap(),
      artifact_sha256: geekSchema.shape.artifact_sha256.unwrap(),
      feature_schema: geekSchema.shape.feature_schema.unwrap(),
      thresholds: thresholdsSchema,
    }),
  })
  .refine(
    (value) => {
      const { warning, high } = value.geek.thresholds;
      const expected =
        value.model_score >= high ? "HIGH" : value.model_score >= warning ? "MEDIUM" : "LOW";
      return value.risk_band === expected;
    },
    "Kategori indikator tidak sesuai skor dan threshold model.",
  );

export const guardianMlResponseSchema = z.union([
  urlModelEvidenceSchema,
  common.extend({
    status: z.enum(["unsupported_input", "unavailable"]),
    risk_band: z.null(),
    model_score: z.null(),
    geek: geekSchema,
  }),
]);

export type UrlModelEvidence = z.infer<typeof urlModelEvidenceSchema>;
export type GuardianMlResponse = z.infer<typeof guardianMlResponseSchema>;

/** Shared by saved investigations and immutable community snapshots. */
export function matchesUrlModel(result: {
  analysisSource: string;
  modelVersion: string;
  riskLevel: string;
  riskScore: number;
  technicalEvidence: { urlModel?: UrlModelEvidence };
  type?: string;
}) {
  const model = result.technicalEvidence.urlModel;
  if (!model) return result.analysisSource !== "GUARDIAN_ML";
  return (
    result.analysisSource === "GUARDIAN_ML" &&
    model.risk_band === result.riskLevel &&
    Math.round(model.model_score * 100) === result.riskScore &&
    model.geek.model_version === result.modelVersion &&
    (result.type === undefined || model.input_type === result.type)
  );
}

export const URL_MODEL_NOTICE =
  "Indikator riset dari pola URL, perlu verifikasi. Skor bukan probabilitas phishing pada trafik nyata. Skor rendah belum menjamin tautan aman. Isi halaman dan redirect belum diperiksa.";

export function getUrlModelLabel(band: UrlModelEvidence["risk_band"]) {
  return `Indikator ${band === "HIGH" ? "tinggi" : band === "MEDIUM" ? "sedang" : "rendah"} (${band})`;
}
