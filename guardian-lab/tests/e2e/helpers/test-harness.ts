/**
 * Test Harness & Reference Oracles for Guardian Lab E2E Test Suite
 * Provides contract validation schemas (Zod), authoritative reference implementations (Oracles),
 * and a strict dispatcher that executes live route handlers.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { communityCaseSchema } from "@/lib/validations/community";
import { getStandardSessionCookies } from "../../helpers/auth-fixtures";

// ============================================================================
// 1. Zod Contract Schemas (Derived directly from PROJECT.md & System Docs)
// ============================================================================

export const RedactedCountsSchema = z.object({
  phone: z.number().int().nonnegative(),
  nik: z.number().int().nonnegative(),
  email: z.number().int().nonnegative(),
  token: z.number().int().nonnegative(),
});

export const PiiScrubberOutputSchema = z.object({
  sanitizedText: z.string(),
  redactedCounts: RedactedCountsSchema,
});

export const UserSessionSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
  exp: z.number().int().nonnegative(),
  streakDays: z.number().int().positive(),
});

export const SandboxSessionStartSchema = z.object({
  sessionId: z.string().min(1),
  streamUrl: z.string().url(),
  expiresAt: z.number().positive(),
  isFallback: z.boolean(),
  viewport: z.enum(["desktop", "mobile"]).optional(),
});

export const SandboxSessionStopSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  destroyedSessionId: z.string(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  questionType: z.enum(["SPOT_THE_PHISH", "SOCIAL_ENGINEERING", "DANGEROUS_PERMISSIONS"]),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
  explanation: z.string(),
  expReward: z.number().positive(),
});

export const CommunityReplaySchema = communityCaseSchema;

// ============================================================================
// 2. Authoritative Reference Oracles (Mathematical & Specification Ground Truth)
// ============================================================================

/**
 * PII Scrubber Oracle
 * Baseline reference patterns for contract tests; production rules live in lib/security/pii-scrubber.ts.
 * - Phone: (\+62|62|0)8[1-9][0-9]{6,10} -> [REDACTED_PHONE]
 * - NIK / Bank Account: \b\d{16}\b -> [REDACTED_NIK_OR_ACCOUNT]
 * - Email: [a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+ -> [REDACTED_EMAIL]
 * - Telegram Bot Token: \b[0-9]{9,10}:[a-zA-Z0-9_-]{35}\b -> [EXTRACTED_BOT_TOKEN_REDACTED]
 */
export function referenceScrubPii(text: string): {
  sanitizedText: string;
  redactedCounts: { phone: number; nik: number; email: number; token: number };
} {
  const counts = { phone: 0, nik: 0, email: 0, token: 0 };

  const phoneRegex = /(?:\+62|62|0)8[1-9][0-9]{6,10}\b/g;
  const nikRegex = /\b\d{16}\b/g;
  const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
  const tokenRegex = /(?:\b|(?<=bot))[0-9]{9,10}:[a-zA-Z0-9_-]{35}\b/g;

  // 1. Scrub Telegram Bot Tokens
  let sanitized = text.replace(tokenRegex, () => {
    counts.token += 1;
    return "[EXTRACTED_BOT_TOKEN_REDACTED]";
  });

  // 2. Scrub NIK / Bank Account (16 digits)
  sanitized = sanitized.replace(nikRegex, () => {
    counts.nik += 1;
    return "[REDACTED_NIK_OR_ACCOUNT]";
  });

  // 3. Scrub Emails
  sanitized = sanitized.replace(emailRegex, () => {
    counts.email += 1;
    return "[REDACTED_EMAIL]";
  });

  // 4. Scrub Phone Numbers
  sanitized = sanitized.replace(phoneRegex, () => {
    counts.phone += 1;
    return "[REDACTED_PHONE]";
  });

  return { sanitizedText: sanitized, redactedCounts: counts };
}

/**
 * URL Defanger Oracle
 * Replaces http:// with hxxp://, https:// with hxxps://, and dots with [.]
 */
export function referenceDefangUrl(url: string): string {
  let defanged = url.replace(/^http:\/\//i, "hxxp://").replace(/^https:\/\//i, "hxxps://");
  // Defang dot in domains/paths
  defanged = defanged.replace(/\./g, "[.]");
  return defanged;
}

/**
 * Shannon Entropy Calculator Oracle
 * H(X) = -sum(P(x) * log2(P(x)))
 */
export function referenceCalculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

/**
 * Levenshtein Distance Calculator Oracle
 */
export function referenceLevenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[a.length][b.length];
}

/**
 * EXP & Rank Evaluator Oracle
 */
export function referenceCalculateRank(exp: number): {
  rank: "Recruit" | "Junior Analyst" | "Cyber Sentinel" | "Forensic Master";
  nextRankExp: number;
} {
  if (exp < 100) return { rank: "Recruit", nextRankExp: 100 };
  if (exp < 300) return { rank: "Junior Analyst", nextRankExp: 300 };
  if (exp < 600) return { rank: "Cyber Sentinel", nextRankExp: 600 };
  return { rank: "Forensic Master", nextRankExp: Infinity };
}

// ============================================================================
// 3. Strict Live Route Dispatcher
// ============================================================================

export interface RouteExecutionResult<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
  source: "LIVE_ROUTE";
}

/** Executes only the real handler. Missing methods, imports, and handler errors fail the test. */
export async function executeRoute<T>(
  routePath: string,
  method: "GET" | "POST" | "DELETE" = "POST",
  payload?: unknown,
  cookies?: Record<string, string>,
): Promise<RouteExecutionResult<T>> {
  const file = resolve(process.cwd(), `app${routePath}/route.ts`);
  if (!existsSync(file)) throw new Error(`Route handler not found: ${routePath}`);
  const module = await import(file);
  const handler = module[method];
  if (typeof handler !== "function")
    throw new Error(`Method ${method} is not implemented for ${routePath}`);
  const multipart = payload instanceof FormData;
  const headers = new Headers(multipart ? {} : { "Content-Type": "application/json" });
  const requestCookies =
    cookies ?? (routePath.startsWith("/api/auth/") ? {} : await getStandardSessionCookies());
  const cookieHeader = Object.entries(requestCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  if (cookieHeader) headers.set("Cookie", cookieHeader);
  const request = new Request(`http://localhost:3000${routePath}`, {
    method,
    headers,
    body:
      method !== "GET" && payload !== undefined
        ? multipart
          ? payload
          : JSON.stringify(payload)
        : undefined,
  });
  const response: Response = await handler(request);
  return {
    status: response.status,
    body: (await response.json()) as T,
    headers: response.headers,
    source: "LIVE_ROUTE",
  };
}
