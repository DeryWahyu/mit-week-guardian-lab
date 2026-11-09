import { scrubPii } from "./pii-scrubber";

const SENSITIVE_KEYS =
  "password|passwd|pwd|token|secret|otp|pin|session(?:_?id)?|authorization|" +
  "email|phone|mobile|nik|account|credential|access_token|api_key|reset_token|auth_token";
const SENSITIVE_KEY = new RegExp(`^(?:${SENSITIVE_KEYS})$`, "i");
const SENSITIVE_ASSIGNMENT = new RegExp(
  `((?:^|[/;,&])(?:${SENSITIVE_KEYS})(?:=|:))[^/;,&]*`,
  "gi",
);

function redactCandidates(value: string) {
  const scrubbed = scrubPii(value).sanitizedText;
  return scrubbed
    .replace(/(?<!\d)(?:\d[ -]?){8,}(?!\d)/g, "REDACTED")
    .replace(/[a-z\d_-]{24,}(?:\.[a-z\d_-]{16,}){0,2}/gi, (candidate) =>
      /\d/.test(candidate) || /^[a-f]{24,}$/i.test(candidate) || candidate.includes(".")
        ? "REDACTED"
        : candidate,
    );
}

/** No network access. Redaction is heuristic, not proof of complete anonymization. */
export function sanitizeModelUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (redactCandidates(url.hostname) !== url.hostname) return null;
    url.username = "";
    url.password = "";
    let decoded = url.pathname;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!/%[a-f\d]{2}/i.test(decoded)) break;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (/%[a-f\d]{2}/i.test(decoded) || /[\p{Cc}\p{Cf}\\]/u.test(decoded)) return null;
    let redacted = decoded.replace(SENSITIVE_ASSIGNMENT, "$1REDACTED");
    const segments = redacted.split("/");
    for (let index = segments.length - 1; index > 0; index--) {
      if (SENSITIVE_KEY.test(segments[index - 1]) && segments[index]) segments[index] = "REDACTED";
    }
    redacted = segments.join("/");
    for (let attempt = 0; attempt < 5; attempt++) {
      const next = redactCandidates(redacted);
      if (next === redacted) break;
      redacted = next;
    }
    if (redactCandidates(redacted) !== redacted) return null;
    // Leave non-sensitive path encoding intact for frozen-model parity.
    if (redacted !== decoded)
      url.pathname = redacted.split("/").map(encodeURIComponent).join("/");
    // Keep context-presence flags, without retaining query keys, values or fragments.
    if (url.search) url.search = "REDACTED";
    if (url.hash) url.hash = "REDACTED";
    return url.href.length <= 16384 ? url.href : null;
  } catch {
    return null;
  }
}
