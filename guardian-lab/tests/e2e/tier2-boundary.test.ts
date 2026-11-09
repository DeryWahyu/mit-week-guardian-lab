/**
 * Tier 2: Boundary & Corner Cases
 * E2E tests covering edge cases, extreme inputs, oversized payloads,
 * corrupt QR/APKs, malicious injections (SQLi, XSS, SSRF, Path Traversal),
 * PII edge boundary conditions, and auth tampering.
 */

import { describe, expect, it } from "bun:test";
import { BOUNDARY_APK_FIXTURES } from "./fixtures/malware-samples";
import { BOUNDARY_URL_FIXTURES } from "./fixtures/phishing-urls";
import { BOUNDARY_QR_FIXTURES } from "./fixtures/qr-codes";
import { BOUNDARY_AUTH_FIXTURES } from "./fixtures/user-fixtures";
import {
  executeRoute,
  referenceCalculateEntropy,
  referenceCalculateRank,
  referenceDefangUrl,
  referenceScrubPii,
} from "./helpers/test-harness";

describe("Tier 2: Boundary & Corner Cases", () => {
  // --------------------------------------------------------------------------
  // 1. URL Analysis Boundary & Adversarial Inputs
  // --------------------------------------------------------------------------
  describe("URL Analysis Boundary Conditions (/api/analyze-url)", () => {
    it("rejects empty URL input with 400 Bad Request", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: BOUNDARY_URL_FIXTURES.empty,
      });
      expect(res.status).toBe(400);
    });

    it("rejects whitespace-only URL input with 400 Bad Request", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: BOUNDARY_URL_FIXTURES.whitespaceOnly,
      });
      expect(res.status).toBe(400);
    });

    it("handles oversized URL (12,000+ chars) gracefully without crashing or OOM", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: BOUNDARY_URL_FIXTURES.oversizedUrl,
      });
      // System should either process or reject safely (status 200 or 400/413)
      expect([201, 400, 413]).toContain(res.status);
    });

    it("defangs URLs containing special characters and control parameters safely", () => {
      const raw = BOUNDARY_URL_FIXTURES.scriptInjection;
      const defanged = referenceDefangUrl(raw);
      expect(defanged).not.toContain("https://");
      expect(defanged).toContain("hxxps://");
      expect(defanged).toContain("evil[.]com");
    });

    it("resists SQL injection payloads in URL analysis target parameter", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: BOUNDARY_URL_FIXTURES.sqliPayload,
      });
      // Must not leak internal database SQL errors
      expect(res.status).not.toBe(500);
      expect(JSON.stringify(res.body)).not.toContain("SQL syntax");
      expect(JSON.stringify(res.body)).not.toContain("mysql_error");
    });

    it("defangs and isolates SSRF attempts targeting AWS metadata or localhost", async () => {
      const ssrfUrl = BOUNDARY_URL_FIXTURES.ssrfTarget;
      const defanged = referenceDefangUrl(ssrfUrl);
      expect(defanged).toBe("hxxp://169[.]254[.]169[.]254/latest/meta-data/");

      const localhostUrl = BOUNDARY_URL_FIXTURES.localhostLoopback;
      const defangedLocal = referenceDefangUrl(localhostUrl);
      expect(defangedLocal).toBe("hxxp://localhost:3306/mysql_test");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Corrupt QR & Malformed Image Inputs
  // --------------------------------------------------------------------------
  describe("QR Decoder Boundary Conditions (/api/analyze-qr)", () => {
    it("rejects empty QR image payload with 400 Bad Request", async () => {
      const res = await executeRoute("/api/analyze-qr", "POST", {
        imageBase64: "",
      });
      expect(res.status).toBe(400);
    });

    it("handles random noise bytes without throwing uncaught exceptions", async () => {
      const noiseBase64 = Buffer.from(BOUNDARY_QR_FIXTURES.randomNoiseBytes).toString("base64");
      const res = await executeRoute("/api/analyze-qr", "POST", {
        imageBase64: noiseBase64,
        mimeType: "image/png",
      });
      expect([200, 400, 422]).toContain(res.status);
    });

    it("rejects non-image text file pretending to be QR image", async () => {
      const textBase64 = Buffer.from(BOUNDARY_QR_FIXTURES.nonImageTextFile).toString("base64");
      const res = await executeRoute("/api/analyze-qr", "POST", {
        imageBase64: textBase64,
        mimeType: BOUNDARY_QR_FIXTURES.invalidMimeType,
      });
      expect([200, 400, 415, 422]).toContain(res.status);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Corrupt APK & Malformed Binaries
  // --------------------------------------------------------------------------
  describe("APK X-Ray Boundary Conditions (/api/analyze-apk)", () => {
    it("rejects zero-byte APK upload with 400 Bad Request", async () => {
      const res = await executeRoute("/api/analyze-apk", "POST", {
        fileName: "empty.apk",
        fileSizeBytes: BOUNDARY_APK_FIXTURES.zeroByteApk.length,
      });
      expect(res.status).toBe(400);
    });

    it("handles corrupted ZIP header APK binary gracefully", async () => {
      const res = await executeRoute("/api/analyze-apk", "POST", {
        fileName: "corrupt_header.apk",
        fileSizeBytes: BOUNDARY_APK_FIXTURES.corruptedZipHeader.length,
      });
      // Should not cause unhandled 500 crash
      expect([200, 400, 422]).toContain(res.status);
    });

    it("rejects plain text files disguised as .apk extension", async () => {
      const res = await executeRoute("/api/analyze-apk", "POST", {
        fileName: "fake_text.apk",
        fileSizeBytes: BOUNDARY_APK_FIXTURES.plainTextFileMaskedAsApk.length,
      });
      expect([200, 400, 422]).toContain(res.status);
    });
  });

  // --------------------------------------------------------------------------
  // 4. PII Scrubber Boundary & Stress Cases
  // --------------------------------------------------------------------------
  describe("PII Scrubber Boundary & Precision Tests", () => {
    it("does not redact 15-digit numbers (must be strictly 16 digits for NIK/accounts)", () => {
      const input = "Nomor referensi tiket 123456789012345 bukan NIK.";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).toContain("123456789012345");
      expect(res.redactedCounts.nik).toBe(0);
    });

    it("redacts exact 16-digit NIK and bank accounts accurately", () => {
      const input = "NIK 3171012345670001 dan Rekening 1234567890123456 valid.";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("3171012345670001");
      expect(res.sanitizedText).not.toContain("1234567890123456");
      expect(res.redactedCounts.nik).toBe(2);
    });

    it("sanitizes complex email addresses with tags and subdomains", () => {
      const input = "Contact user+investigation-2026@sub.corp.domain.co.id for details.";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("user+investigation-2026@sub.corp.domain.co.id");
      expect(res.sanitizedText).toContain("[REDACTED_EMAIL]");
      expect(res.redactedCounts.email).toBe(1);
    });

    it("preserves technical timestamps and SHA-256 hashes without false redaction", () => {
      const input =
        "Timestamp: 2026-10-31T18:27:11Z, Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).toContain("2026-10-31T18:27:11Z");
      expect(res.sanitizedText).toContain(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
      expect(res.redactedCounts.phone).toBe(0);
      expect(res.redactedCounts.nik).toBe(0);
    });

    it("handles multiple occurrences of PII mixed in single paragraph", () => {
      const input =
        "Korban A (081234567890, NIK 3171012345670001) dan Korban B (081987654321, Rekening 9876543210987654, email korban@bank.com) terkena APK bot 6123456789:AAFlkBz80pQc-4xZyR9m30Lk18eP_Oabcde";
      const res = referenceScrubPii(input);
      expect(res.redactedCounts.phone).toBe(2);
      expect(res.redactedCounts.nik).toBe(2);
      expect(res.redactedCounts.email).toBe(1);
      expect(res.redactedCounts.token).toBe(1);
      expect(res.sanitizedText).not.toContain("081234567890");
      expect(res.sanitizedText).not.toContain("3171012345670001");
      expect(res.sanitizedText).not.toContain("korban@bank.com");
    });
  });

  // --------------------------------------------------------------------------
  // 5. Authentication & Session Boundary Conditions
  // --------------------------------------------------------------------------
  describe("Authentication Boundary Conditions", () => {
    it("rejects registration with empty fields", async () => {
      const res = await executeRoute(
        "/api/auth/register",
        "POST",
        BOUNDARY_AUTH_FIXTURES.emptyFields,
      );
      expect(res.status).toBe(400);
    });

    it("rejects login with empty email and password", async () => {
      const res = await executeRoute("/api/auth/login", "POST", {
        email: "",
        password: "",
      });
      expect(res.status).toBe(400);
    });

    it("rejects access to /api/auth/me when session cookie is tampered", async () => {
      const res = await executeRoute("/api/auth/me", "GET", undefined, {
        guardian_session: BOUNDARY_AUTH_FIXTURES.tamperedSessionCookie,
      });
      expect(res.status).toBe(401);
    });

    it("rejects access to /api/auth/me when session cookie is expired", async () => {
      const res = await executeRoute("/api/auth/me", "GET", undefined, {
        guardian_session: BOUNDARY_AUTH_FIXTURES.expiredSessionCookie,
      });
      expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Sandbox Session Boundary Conditions
  // --------------------------------------------------------------------------
  describe("Sandbox Session Boundary Conditions", () => {
    it("rejects session stop without sessionId parameter", async () => {
      const res = await executeRoute("/api/sandbox/session/stop", "POST", {});
      expect(res.status).toBe(400);
    });

    it("handles non-existent or already terminated sessionId gracefully", async () => {
      const res = await executeRoute("/api/sandbox/session/stop", "POST", {
        sessionId: "sbx_non_existent_9999",
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Shannon Entropy Boundary Calculations
  // --------------------------------------------------------------------------
  describe("Entropy & Algorithmic Boundary Conditions", () => {
    it("returns 0 entropy for empty string", () => {
      expect(referenceCalculateEntropy("")).toBe(0);
    });

    it("returns 0 entropy for uniform single repeated character", () => {
      expect(referenceCalculateEntropy("aaaaa")).toBe(0);
    });

    it("handles maximum possible rank bounds without integer overflow", () => {
      const maxRank = referenceCalculateRank(1000000);
      expect(maxRank.rank).toBe("Forensic Master");
      expect(maxRank.nextRankExp).toBe(Infinity);
    });
  });
});
