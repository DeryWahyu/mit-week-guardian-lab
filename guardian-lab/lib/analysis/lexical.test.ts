import { describe, expect, it } from "bun:test";
import {
  analyzeLexicalUrl,
  calculateLevenshteinDistance,
  calculateShannonEntropy,
} from "./lexical";

describe("Lexical Threat Scoring Engine", () => {
  describe("calculateShannonEntropy", () => {
    it("returns 0 for empty string", () => {
      expect(calculateShannonEntropy("")).toBe(0);
    });

    it("returns 0 for single-character repeated string", () => {
      expect(calculateShannonEntropy("aaaaaa")).toBe(0);
    });

    it("calculates entropy accurately with 3 decimal precision", () => {
      const entropy = calculateShannonEntropy("https://klikbca-verifikasi-otp.top/login.php");
      expect(entropy).toBeGreaterThan(3.5);
    });
  });

  describe("calculateLevenshteinDistance", () => {
    it("returns 0 for identical strings", () => {
      expect(calculateLevenshteinDistance("bca.co.id", "bca.co.id")).toBe(0);
    });

    it("calculates distance correctly for typosquatted domain", () => {
      expect(calculateLevenshteinDistance("klikbca.com", "klikbca-login.com")).toBe(6);
      expect(calculateLevenshteinDistance("mandiri", "mandlri")).toBe(1);
    });
  });

  describe("analyzeLexicalUrl", () => {
    it("identifies legitimate banking domain as SAFE", () => {
      const res = analyzeLexicalUrl("https://klikbca.com");
      expect(res.isLegitimateDomain).toBe(true);
      expect(res.suggestedRiskLevel).toBe("SAFE");
      expect(res.riskScore).toBeLessThanOrEqual(20);
    });

    it("identifies legitimate lab domain as SAFE", () => {
      const res = analyzeLexicalUrl("https://guardian-lab.security");
      expect(res.isLegitimateDomain).toBe(true);
      expect(res.suggestedRiskLevel).toBe("SAFE");
    });

    it("detects brand impersonation on high-risk TLD as PHISHING", () => {
      const res = analyzeLexicalUrl("https://klikbca-verifikasi-otp.top/login.php");
      expect(res.isLegitimateDomain).toBe(false);
      expect(res.brandImpersonated).toBe("Bank BCA");
      expect(res.isRiskyTld).toBe(true);
      expect(res.isHighEntropy).toBe(true);
      expect(res.riskScore).toBeGreaterThanOrEqual(80);
      expect(res.suggestedRiskLevel).toBe("PHISHING");
    });

    it("detects direct .apk path as MALWARE", () => {
      const res = analyzeLexicalUrl("https://undangan-nikah-digital-online.top/undangan.apk");
      expect(res.hasApkPath).toBe(true);
      expect(res.suggestedRiskLevel).toBe("MALWARE");
      expect(res.riskScore).toBeGreaterThanOrEqual(85);
    });

    it("includes relevant deception tricks in analysis", () => {
      const res = analyzeLexicalUrl("https://dana-kaget-saldo-gratis.xyz/claim");
      expect(res.brandImpersonated).toBe("DANA Indonesia");
      expect(res.deceptionTricks.length).toBeGreaterThan(0);
    });
  });
});
