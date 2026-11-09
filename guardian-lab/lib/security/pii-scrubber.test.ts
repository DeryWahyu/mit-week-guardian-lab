import { describe, expect, it } from "bun:test";
import { hasPii, REDACTION_TAGS, scrubPii } from "./pii-scrubber";

describe("PII Scrubber Module", () => {
  describe("Indonesian Phone Numbers", () => {
    it("redacts standard 08 numbers", () => {
      const input = "Hubungi kurir di 081234567890 untuk konfirmasi.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Hubungi kurir di ${REDACTION_TAGS.phone} untuk konfirmasi.`);
      expect(res.redactedCounts.phone).toBe(1);
    });

    it("redacts +628 international format", () => {
      const input = "Kirim konfirmasi ke +6281234567890 sekarang.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Kirim konfirmasi ke ${REDACTION_TAGS.phone} sekarang.`);
      expect(res.redactedCounts.phone).toBe(1);
    });

    it("redacts 628 without plus prefix", () => {
      const input = "Nomor pengirim: 628987654321";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Nomor pengirim: ${REDACTION_TAGS.phone}`);
      expect(res.redactedCounts.phone).toBe(1);
    });

    it("redacts formatted numbers with hyphens and spaces", () => {
      const input = "WhatsApp: 0812-3456-7890 atau +62 812 3456 7890.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(
        `WhatsApp: ${REDACTION_TAGS.phone} atau ${REDACTION_TAGS.phone}.`,
      );
      expect(res.redactedCounts.phone).toBe(2);
    });
  });

  describe("Indonesian NIK and 16-Digit Accounts", () => {
    it("redacts standard 16-digit NIK", () => {
      const input = "NIK KTP: 3171012345670001 harap diverifikasi.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`NIK KTP: ${REDACTION_TAGS.nik} harap diverifikasi.`);
      expect(res.redactedCounts.nik).toBe(1);
    });

    it("redacts 16-digit bank card with hyphens or spaces", () => {
      const input = "Transfer ke rekening 1234-5678-9012-3456 BCA.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Transfer ke rekening ${REDACTION_TAGS.nik} BCA.`);
      expect(res.redactedCounts.nik).toBe(1);
    });
  });

  describe("User Emails", () => {
    it("redacts standard email addresses", () => {
      const input = "Kirim feedback ke user.testing@example.com untuk tindak lanjut.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(
        `Kirim feedback ke ${REDACTION_TAGS.email} untuk tindak lanjut.`,
      );
      expect(res.redactedCounts.email).toBe(1);
    });

    it("preserves trailing punctuation when email is at end of sentence", () => {
      const input = "Hubungi admin di support@guardian-lab.id.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Hubungi admin di ${REDACTION_TAGS.email}.`);
      expect(res.redactedCounts.email).toBe(1);
    });
  });

  describe("Telegram Bot Tokens", () => {
    it("redacts standalone Telegram bot tokens", () => {
      const input = "Token: 6123456789:AAFlq32_kLk098Zsdfjklqwertyuiopasdf";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(`Token: ${REDACTION_TAGS.token}`);
      expect(res.redactedCounts.token).toBe(1);
    });

    it("redacts Telegram bot token embedded in Telegram API URL", () => {
      const input =
        "https://api.telegram.org/bot6123456789:AAFlq32_kLk098Zsdfjklqwertyuiopasdf/sendMessage?chat_id=-100";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(
        `https://api.telegram.org/bot${REDACTION_TAGS.token}/sendMessage?chat_id=-100`,
      );
      expect(res.redactedCounts.token).toBe(1);
    });
  });

  describe("Protection of Benign Text (No False Positives)", () => {
    it("does not corrupt benign timestamps, ports, or versions", () => {
      const input =
        "Server port 8080 active at 2026-10-31 18:00:00, version v1.2.3, size 1024 bytes.";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(input);
      expect(res.redactedCounts.phone).toBe(0);
      expect(res.redactedCounts.nik).toBe(0);
      expect(res.redactedCounts.email).toBe(0);
      expect(res.redactedCounts.token).toBe(0);
    });

    it("does not corrupt short digits or alphanumeric hashes", () => {
      const input = "Hash: e10adc3949ba59abbe56e057f20f883e and PIN: 1234";
      const res = scrubPii(input);
      expect(res.sanitizedText).toBe(input);
    });
  });

  describe("Combined Multi-Entity Threat Artifacts", () => {
    it("redacts all PII types concurrently with accurate counts", () => {
      const input = `
        Pelaku phishing: 081234567890
        KTP Korban: 3171012345670001
        Email: target@korban.id
        C2 Bot: https://api.telegram.org/bot6123456789:AAFlq32_kLk098Zsdfjklqwertyuiopasdf/send
      `;
      const res = scrubPii(input);
      expect(res.redactedCounts).toEqual({
        phone: 1,
        nik: 1,
        email: 1,
        token: 1,
      });
      expect(res.sanitizedText).toContain(REDACTION_TAGS.phone);
      expect(res.sanitizedText).toContain(REDACTION_TAGS.nik);
      expect(res.sanitizedText).toContain(REDACTION_TAGS.email);
      expect(res.sanitizedText).toContain(REDACTION_TAGS.token);
    });
  });

  describe("hasPii helper", () => {
    it("returns true when text contains PII", () => {
      expect(hasPii("Call me at 081234567890")).toBe(true);
    });

    it("returns false when text is benign", () => {
      expect(hasPii("Halo selamat pagi")).toBe(false);
    });
  });
});
