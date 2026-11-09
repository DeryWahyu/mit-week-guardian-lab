import type { Prisma } from "@prisma/client";
import { sanitizeModelUrl } from "@/lib/security/model-url";
import { scrubPii } from "@/lib/security/pii-scrubber";

/** No credentials or query/fragment values are retained in investigation targets. */
export function sanitizeInvestigationText(input: string): string {
  let text = input;
  try {
    const url = new URL(input);
    if (["http:", "https:"].includes(url.protocol)) {
      return sanitizeModelUrl(input) ?? "[TAUTAN_DISAMARKAN]";
    }
  } catch {
    // Plain text QR payloads and filenames still pass through the PII scrubber.
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const decoded = decodeURIComponent(text);
      if (decoded === text) break;
      text = decoded;
    } catch {
      break;
    }
  }
  return scrubPii(text).sanitizedText;
}

export function sanitizeEvidence(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  if (typeof value === "string") return sanitizeInvestigationText(value);
  if (Array.isArray(value))
    return value.map((item) => (item === null ? null : sanitizeEvidence(item)));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|secret|token|credential|(?:^|_)otp|(?:^|_)pin(?:$|_)/i.test(key)
          ? Array.isArray(item)
            ? item.map(() => "[REDACTED]")
            : "[REDACTED]"
          : item == null
            ? null
            : sanitizeEvidence(item),
      ]),
    );
  }
  return value;
}

export function defangTarget(target: string): string {
  return target
    .replace(/^https/i, "hxxps")
    .replace(/^http:/i, "hxxp:")
    .replace(/\./g, "[.]");
}
