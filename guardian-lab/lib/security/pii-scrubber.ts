/**
 * Guardian Lab: PII Scrubber Module
 * Sanitizes Indonesian phone numbers, 16-digit NIK/bank accounts, emails,
 * and Telegram bot tokens before sending sanitized URLs to the private AI service
 * or storing data in forensic archives.
 */

export interface PiiScrubResult {
  sanitizedText: string;
  redactedCounts: {
    phone: number;
    nik: number;
    email: number;
    token: number;
  };
}

// Redaction Token Constants
export const REDACTION_TAGS = {
  phone: "[REDACTED_PHONE]",
  nik: "[REDACTED_NIK_OR_ACCOUNT]",
  email: "[REDACTED_EMAIL]",
  token: "[EXTRACTED_BOT_TOKEN_REDACTED]",
} as const;

// 1. Telegram Bot Token: captures standalone tokens and URL-embedded /bot<token>
// e.g. 1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ123456789
export const TELEGRAM_BOT_TOKEN_REGEX =
  /(?:(?<=bot)|(?<![0-9a-zA-Z_]))([0-9]{9,10}:[a-zA-Z0-9_-]{35})\b/g;

// 2. Email Address: standard email format, ensures trailing sentence dot is not swallowed
// e.g. user.name+tag@sub.domain.co.id
export const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]*[a-zA-Z0-9]/g;

// 3. Indonesian NIK / 16-digit Bank Account / Card Number:
// Matches 16 consecutive digits or 4x4 grouped digits (e.g. 3171012345670001 or 1234-5678-9012-3456)
export const NIK_OR_ACCOUNT_REGEX = /\b(?:\d{16}|\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})\b/g;

// 4. Indonesian Mobile Phone Number:
// Matches +628..., 628..., 08... with 8 to 13 digits, optionally formatted with spaces/hyphens
export const INDONESIA_PHONE_REGEX = /(?<!\w)(?:\+62|62|0)[\s.-]?8[1-9](?:[\s.-]?[0-9]){6,10}\b/g;

// Non-global regexes for deterministic, stateless boolean presence testing.
// Without the /g flag, RegExp.prototype.test() never updates or mutates `lastIndex`,
// preventing stateful alternating false negative bugs.
const TELEGRAM_BOT_TOKEN_TEST_REGEX =
  /(?:(?<=bot)|(?<![0-9a-zA-Z_]))([0-9]{9,10}:[a-zA-Z0-9_-]{35})\b/;
const EMAIL_TEST_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]*[a-zA-Z0-9]/;
const NIK_OR_ACCOUNT_TEST_REGEX = /\b(?:\d{16}|\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})\b/;
const INDONESIA_PHONE_TEST_REGEX = /(?<!\w)(?:\+62|62|0)[\s.-]?8[1-9](?:[\s.-]?[0-9]){6,10}\b/;

/**
 * Scrubs all PII entities from input text.
 * Execution order: Token -> Email -> NIK -> Phone
 */
export function scrubPii(text: string): PiiScrubResult {
  if (!text || typeof text !== "string") {
    return {
      sanitizedText: "",
      redactedCounts: { phone: 0, nik: 0, email: 0, token: 0 },
    };
  }

  let tokenCount = 0;
  let emailCount = 0;
  let nikCount = 0;
  let phoneCount = 0;

  // 1. Scrub Telegram Bot Tokens
  let sanitized = text.replace(TELEGRAM_BOT_TOKEN_REGEX, () => {
    tokenCount++;
    return REDACTION_TAGS.token;
  });

  // 2. Scrub Emails
  sanitized = sanitized.replace(EMAIL_REGEX, () => {
    emailCount++;
    return REDACTION_TAGS.email;
  });

  // 3. Scrub NIK / 16-Digit Accounts
  sanitized = sanitized.replace(NIK_OR_ACCOUNT_REGEX, () => {
    nikCount++;
    return REDACTION_TAGS.nik;
  });

  // 4. Scrub Indonesian Mobile Numbers
  sanitized = sanitized.replace(INDONESIA_PHONE_REGEX, () => {
    phoneCount++;
    return REDACTION_TAGS.phone;
  });

  return {
    sanitizedText: sanitized,
    redactedCounts: {
      phone: phoneCount,
      nik: nikCount,
      email: emailCount,
      token: tokenCount,
    },
  };
}

/**
 * Checks if input text contains any sensitive PII.
 * Uses stateless non-global regular expressions so subsequent invocations
 * are strictly idempotent, deterministic, and re-entrant.
 */
export function hasPii(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  // Reset lastIndex on exported global regexes as an extra layer of defense
  TELEGRAM_BOT_TOKEN_REGEX.lastIndex = 0;
  EMAIL_REGEX.lastIndex = 0;
  NIK_OR_ACCOUNT_REGEX.lastIndex = 0;
  INDONESIA_PHONE_REGEX.lastIndex = 0;

  return (
    TELEGRAM_BOT_TOKEN_TEST_REGEX.test(text) ||
    EMAIL_TEST_REGEX.test(text) ||
    NIK_OR_ACCOUNT_TEST_REGEX.test(text) ||
    INDONESIA_PHONE_TEST_REGEX.test(text)
  );
}
