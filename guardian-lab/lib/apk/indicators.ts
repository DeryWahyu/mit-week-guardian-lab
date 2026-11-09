import { createHash } from "node:crypto";
import { scrubPii, TELEGRAM_BOT_TOKEN_REGEX } from "@/lib/security/pii-scrubber";
import { sanitizeShareText } from "@/lib/share-card/content";

const urlPattern = /https?:\/\/[^\s<>"'`\\]+/gi;
function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return `${sanitizeShareText(url.origin).replace(/\/$/, "")}${url.pathname !== "/" ? "/[PATH_REDACTED]" : "/"}`;
  } catch {
    return "[INVALID_URL_REDACTED]";
  }
}
export function sanitizeApkCode(code: string) {
  const safe = scrubPii(code.replace(urlPattern, safeUrl)).sanitizedText;
  return safe
    .replace(/"(?:\\.|[^"\\])*"/g, (literal) =>
      /^"android\.permission\.[A-Z0-9_]+"$/.test(literal) ? literal : '"[STRING_REDACTED]"',
    )
    .replace(/'(?:\\.|[^'\\])'/g, "'[CHAR_REDACTED]'")
    .replace(/\b\d{5,}\b/g, "[NUMBER_REDACTED]")
    .replace(/\/\*[\s\S]*?\*\//g, "/* [COMMENT_REDACTED] */")
    .replace(/\/\/[^\r\n]*/g, "// [COMMENT_REDACTED]")
    .replace(/\p{Cf}/gu, "")
    .slice(0, 1600);
}
export function createIndicatorScanner() {
  const urls: { value: string; source: string }[] = [],
    snippets: { source: string; code: string }[] = [];
  const tokens = new Set<string>(),
    uniqueUrls = new Set<string>();
  let contacts = 0,
    truncated = false;
  let fallback: { source: string; code: string } | null = null;
  function scan(content: string, source: string) {
    const cleanSource = sanitizeShareText(source).slice(0, 512);
    for (const match of content.matchAll(new RegExp(TELEGRAM_BOT_TOKEN_REGEX.source, "g")))
      tokens.add(createHash("sha256").update(match[1]).digest("hex"));
    const pii = scrubPii(content).redactedCounts;
    contacts += pii.phone + pii.email + pii.nik;
    for (const match of content.matchAll(new RegExp(urlPattern.source, "gi"))) {
      const value = safeUrl(match[0]),
        key = `${cleanSource}:${value}`;
      if (!uniqueUrls.has(key)) {
        uniqueUrls.add(key);
        if (urls.length < 100) urls.push({ value, source: cleanSource });
        else truncated = true;
      }
    }
    if (!source.endsWith(".java")) return;
    const lines = content.split(/\r?\n/);
    fallback ??= {
      source: `${cleanSource}:1`,
      code: sanitizeApkCode(lines.slice(0, 12).join("\n")),
    };
    for (let i = 0; i < lines.length && snippets.length < 8; i++) {
      if (!/api\.telegram\.org|https?:\/\/|READ_SMS|RECEIVE_SMS|SEND_SMS|chat_id/i.test(lines[i]))
        continue;
      snippets.push({
        source: `${cleanSource}:${i + 1}`,
        code: sanitizeApkCode(lines.slice(Math.max(0, i - 2), i + 3).join("\n")),
      });
      i += 3;
    }
  }
  return {
    scan,
    result: () => ({
      indicators: {
        urls,
        telegramBotCount: tokens.size,
        botFingerprints: [...tokens].slice(0, 100),
        redactedContactCount: contacts,
      },
      snippets: snippets.length ? snippets : fallback ? [fallback] : [],
      truncated: truncated || tokens.size > 100,
    }),
  };
}
