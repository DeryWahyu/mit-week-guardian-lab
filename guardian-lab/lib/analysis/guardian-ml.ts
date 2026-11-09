import { Buffer } from "node:buffer";
import { type GuardianMlResponse, guardianMlResponseSchema } from "@/lib/validations/guardian-ml";

type Prediction =
  | { ok: true; result: GuardianMlResponse }
  | { ok: false; errorCode: "MODEL_NOT_CONFIGURED" | "MODEL_UNAVAILABLE" };

/** The address is server configuration; submitted targets are never fetched. */
export async function predictUrl(url: string, inputType: "URL" | "QR"): Promise<Prediction> {
  const configured = process.env.GUARDIAN_ML_URL?.trim();
  if (!configured) return { ok: false, errorCode: "MODEL_NOT_CONFIGURED" };
  try {
    const base = new URL(configured);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== "/"
    )
      return { ok: false, errorCode: "MODEL_NOT_CONFIGURED" };
    const response = await fetch(new URL("/predict", base), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, input_type: inputType }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      redirect: "error",
    });
    if (
      ![200, 422, 503].includes(response.status) ||
      response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
        "application/json"
    ) {
      await response.body?.cancel();
      return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
    }
    // Bound the actual response stream, including chunked responses.
    const reader = response.body?.getReader();
    if (!reader) return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.length;
        if (length > 65536) {
          await reader.cancel();
          return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
        }
        chunks.push(chunk.value);
      }
    } finally {
      reader.releaseLock();
    }
    const payload: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const parsed = guardianMlResponseSchema.safeParse(payload);
    if (!parsed.success || parsed.data.input_type !== inputType)
      return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
    const expected = { complete: 200, unsupported_input: 422, unavailable: 503 };
    if (expected[parsed.data.status] !== response.status)
      return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
    return { ok: true, result: parsed.data };
  } catch {
    // Do not log request bodies, targets, upstream errors or service addresses.
    return { ok: false, errorCode: "MODEL_UNAVAILABLE" };
  }
}
