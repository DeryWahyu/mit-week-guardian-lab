import { investigationSchema } from "@/lib/validations/investigation";
import { apkUpload } from "../helpers/investigation-fixtures";
/**
 * Tier 4: Real-World Scenarios
 * Concrete end-to-end simulation of prevalent Indonesian cybercrime campaigns (2025–2026):
 * - Scenario 1: Modus Kurir Ekspedisi Paket & Undangan Pernikahan (Fake APK SMS stealer)
 * - Scenario 2: Typosquatting Perbankan Nasional (Bank BCA Phishing Campaign)
 * - Scenario 3: Modus Quishing (QRIS Palsu & Parking Ticket QR Code Phishing)
 * - Scenario 4: Investigasi Komunitas Rekening Penampung & Pinjol Ilegal (OJK/IASC Replay)
 */

import { describe, expect, it } from "bun:test";
import { INDONESIAN_APK_MALWARE_FIXTURES } from "./fixtures/malware-samples";
import { INDONESIAN_PHISHING_FIXTURES } from "./fixtures/phishing-urls";
import { QR_CODE_FIXTURES } from "./fixtures/qr-codes";
import { executeRoute, referenceCalculateRank, referenceScrubPii } from "./helpers/test-harness";

describe("Tier 4: Real-World Scenarios (Indonesian Cybercrime Defense)", () => {
  // --------------------------------------------------------------------------
  // Scenario 1: Modus Kurir J&T / Undangan Nikah (Fake APK SMS Stealer)
  // --------------------------------------------------------------------------
  describe("Scenario 1: Modus Kurir Ekspedisi Paket & Undangan Nikah APK", () => {
    it("does not infer SMS theft from an APK filename", async () => {
      const res = await executeRoute(
        "/api/analyze-apk",
        "POST",
        apkUpload(INDONESIAN_APK_MALWARE_FIXTURES[0].fileName),
      );
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.riskScore).toBeNull();
      expect(record.technicalEvidence).toEqual({});
      expect(record.deceptionTricks).toEqual([]);
    }, 30000);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Typosquatting Perbankan Nasional (Bank BCA Phishing)
  // --------------------------------------------------------------------------
  describe("Scenario 2: Typosquatting Perbankan Nasional (Bank BCA Phishing Attack)", () => {
    it("stores suspicious banking URLs without asserting a trained-model result", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: INDONESIAN_PHISHING_FIXTURES[0].url,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.defangedTarget).toContain("klikbca-verifikasi-otp[.]top");
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.riskLevel).toBeNull();
      expect(record.summary).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Modus Quishing QRIS Palsu / Parking Fine Ticket
  // --------------------------------------------------------------------------
  describe("Scenario 3: Modus Quishing (QRIS Palsu & Tiket Denda QR)", () => {
    it("decodes actual QR pixels and withholds Share Card findings while analysis is unavailable", async () => {
      const sample = QR_CODE_FIXTURES[2];
      const res = await executeRoute("/api/analyze-qr", "POST", {
        imageBase64: sample.imageBase64,
        mimeType: sample.mimeType,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.type).toBe("QR");
      expect(record.defangedTarget).toContain("qris-dana-kaget-pemberdayaan[.]xyz");
      expect(record.riskScore).toBeNull();
      expect(record.scamCategory).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Rekening Penampung & Pinjol Ilegal (OJK/IASC Replay)
  // --------------------------------------------------------------------------
  describe("Scenario 4: Investigasi Komunitas Rekening Penampung (OJK/IASC Replay)", () => {
    it("simulates community investigation with PII protection and forensic EXP reward", () => {
      // 1. Case evidence representing multi-layer account fraud (Data IASC OJK 2026)
      const rawCaseReport = `
        Kasus Penipuan Rekening Berlapis:
        Korban NIK 3201019988770002 mentransfer dana ke rekening penampung 1122334455667788
        setelah menerima pesan WhatsApp dari nomor 081399887766 mengatasnamakan undian berhadiah.
      `;

      // 2. Automatic PII Scrubbing
      const scrubbed = referenceScrubPii(rawCaseReport);
      expect(scrubbed.sanitizedText).not.toContain("3201019988770002");
      expect(scrubbed.sanitizedText).not.toContain("1122334455667788");
      expect(scrubbed.sanitizedText).not.toContain("081399887766");
      expect(scrubbed.redactedCounts.nik).toBe(2); // NIK + 16-digit rekening
      expect(scrubbed.redactedCounts.phone).toBe(1);

      // 3. Community Player investigates puzzle and completes forensic replay
      const initialPlayerExp = 250;
      const communityReplayExpReward = 100;
      const newExp = initialPlayerExp + communityReplayExpReward; // 350 EXP

      // 4. Verify rank progression from Junior Analyst to Cyber Sentinel
      const priorRank = referenceCalculateRank(initialPlayerExp);
      expect(priorRank.rank).toBe("Junior Analyst");

      const newRank = referenceCalculateRank(newExp);
      expect(newRank.rank).toBe("Cyber Sentinel");
      expect(newRank.nextRankExp).toBe(600);
    });
  });
});
