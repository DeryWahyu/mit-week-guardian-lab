import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareCardCanvas } from "@/components/act/share-card-canvas";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import { buildShareCard, sanitizeShareText } from "./content";

const fixture: Investigation = {
  id: "share-fixture",
  userId: "private-owner",
  target: "https://example.test/check",
  type: "URL",
  status: "COMPLETED",
  riskLevel: "PHISHING",
  riskScore: 91,
  scamCategory: "Peniruan layanan",
  summary: "Halaman meminta kode OTP.",
  deceptionTricks: ["Meniru tampilan layanan.", "Meminta kode rahasia."],
  technicalEvidence: { botTokens: ["must-not-be-exported"] },
  inputMetadata: {},
  analysisSource: "TEST_WORKER",
  modelVersion: "fixture-v1",
  errorCode: null,
  errorMessage: null,
  defangedTarget: "https://forged.test",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:01.000Z",
  startedAt: "2026-11-01T00:00:00.000Z",
  finishedAt: "2026-11-01T00:00:01.000Z",
};

describe("Share Card from stored investigation", () => {
  for (const status of ["RECEIVED", "PROCESSING", "FAILED", "UNAVAILABLE"] as const)
    it(`does not export ${status} even when stale findings exist`, () => {
      expect(buildShareCard({ ...fixture, status })).toBeNull();
    });
  it("blocks legacy, incomplete and invalid results", () => {
    for (const change of [
      { analysisSource: "LEGACY_UNVERIFIED" },
      { modelVersion: null },
      { summary: null },
      { riskScore: null },
      { riskScore: 101 },
      { scamCategory: "" },
    ])
      expect(buildShareCard({ ...fixture, ...change })).toBeNull();
  });
  it("uses stored score, category, source, timestamp and id", () => {
    const card = buildShareCard(fixture);
    expect(card?.riskScore).toBe(91);
    expect(card?.category).toBe(fixture.scamCategory ?? "");
    expect(card?.source).toBe("TEST_WORKER");
    expect(card?.date).toContain("UTC");
    expect(card?.text).toContain("ID: share-fixture");
    expect(card?.text).not.toContain("private-owner");
    expect(card?.text).not.toContain("must-not-be-exported");
    expect(card?.target).toBe("hxxps://example[.]test/check");
    expect(card?.text).not.toContain("forged");
  });
  for (const riskLevel of ["SAFE", "LOW"] as const)
    it(`keeps ${riskLevel} with score zero neutral and avoids unsupported safety claims`, () => {
      const card = buildShareCard({ ...fixture, riskLevel, riskScore: 0 });
      expect(card?.title).toBe("Ringkasan pemeriksaan");
      expect(card?.riskScore).toBe(0);
      expect(card?.text).toContain("bukan jaminan keamanan");
      expect(card?.text).not.toContain("AWAS MODUS PENIPUAN");
    });
  it("uses the verdict rather than inferring a new one from score", () => {
    const card = buildShareCard({ ...fixture, riskScore: 0 });
    expect(card?.risk.high).toBe(true);
    expect(card?.risk.label).toContain("PHISHING");
  });
  it("keeps zero, one or two real findings without inventing a third", () => {
    for (const count of [0, 1, 2]) {
      const card = buildShareCard({
        ...fixture,
        deceptionTricks: fixture.deceptionTricks.slice(0, count),
      });
      expect(card?.findings).toHaveLength(count);
      expect(card?.summary).toBe(fixture.summary ?? "");
    }
  });
  it("deduplicates whitespace/empty findings and limits long reports visibly", () => {
    const card = buildShareCard({
      ...fixture,
      summary: "x".repeat(1000),
      deceptionTricks: [" ", "Same finding", "Same finding", "Second", "Third", "Fourth"],
    });
    expect(card?.findings).toEqual(["Same finding", "Second", "Third"]);
    expect(card?.summary.length).toBe(360);
    expect(card?.truncated).toBe(true);
    expect(card?.text).toContain("dipersingkat");
  });
  it("retains the entire hostname when a long URL is shortened", () => {
    // Long, valid DNS labels below token heuristics preserve the complete authority.
    const hostname = `${Array.from({ length: 10 }, () => "guardianlearningsecure").join(".")}.test`;
    const card = buildShareCard({ ...fixture, target: `https://${hostname}/${"x".repeat(1000)}` });
    expect(card?.target).toContain(hostname.replace(/\./g, "[.]"));
    expect(card?.truncated).toBe(true);
  });
  it("fails closed for a hostname whose labels resemble credential tokens", () => {
    const hostname = `${"a".repeat(60)}.${"b".repeat(60)}.test`;
    const card = buildShareCard({ ...fixture, target: `https://${hostname}/` });
    expect(card?.target).toBe("[TAUTAN_DISAMARKAN]");
  });
  it("redacts credentials and query secrets inside prose and defangs all indicators", () => {
    const text = sanitizeShareText(
      "Hubungi demo@example.test atau +6281234567890. Buka https://name:secret@evil.test/x?token=private-secret dan www.evil.test.",
    );
    for (const secret of [
      "demo@",
      "+6281234567890",
      "secret@",
      "private-secret",
      "https://",
      "www.evil.test",
    ])
      expect(text).not.toContain(secret);
    expect(text).toContain("evil[.]test");
    expect(sanitizeShareText("ftp://example.test/x")).not.toContain("ftp://");
  });
  it("redacts percent-encoded PII and removes directional/control characters", () => {
    const text = sanitizeShareText("%64emo%40example.test\u202e\u0000");
    expect(text).not.toContain("demo@");
    expect(text).not.toContain("\u202e");
    expect(text).not.toContain("\u0000");
  });
  it("removes secrets when earlier PII redaction made an embedded URL invalid", () => {
    const text = sanitizeShareText(
      "Buka https://name:[REDACTED_EMAIL]/?key=private-query#secret-fragment",
    );
    for (const secret of ["private-query", "secret-fragment", "name:"])
      expect(text).not.toContain(secret);
    expect(text).toContain("[REDACTED_HOST]");
    expect(sanitizeShareText("https://example.test/?key=%2570rivate-value")).not.toContain(
      "rivate-value",
    );
  });
  it("preserves already defanged indicators when sanitized again", () => {
    const text = "Target hxxps://sample[.]test/check dan hxxps://endpoint[.]test/";
    expect(sanitizeShareText(text)).toBe(text);
    expect(sanitizeShareText(sanitizeShareText(text))).toBe(text);
  });
  it("labels APK as a file and escapes markup instead of embedding it", () => {
    const card = buildShareCard({
      ...fixture,
      type: "APK",
      target: "undangan.apk",
      summary: "<script>alert(1)</script>",
    });
    if (!card) throw new Error("Expected completed fixture");
    const html = renderToStaticMarkup(<ShareCardCanvas card={card} />);
    expect(html).toContain("Nama berkas APK");
    expect(html).not.toContain("Tautan Berbahaya");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("Verified Defense");
  });
  it("does not put target or findings in the generator URL", () => {
    const route = PUBLIC_ROUTES.actWithInvestigation(fixture.id);
    expect(route).toBe("/act?id=share-fixture");
    expect(route).not.toContain("target=");
  });
});
