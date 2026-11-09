import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getInvestigationLabel,
  getInvestigationResult,
  getRiskPresentation,
} from "@/lib/investigations/presentation";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import { GeekViewPanel } from "./geek-view-panel";
import { KedokCard } from "./kedok-card";
import { ThreatScoreGauge } from "./threat-score-gauge";

const fixture: Investigation = {
  id: "fixture-result",
  userId: "fixture-user",
  target: "https://example.test/",
  type: "URL",
  status: "COMPLETED",
  riskLevel: "SAFE",
  riskScore: 0,
  scamCategory: "Controlled fixture",
  summary: "Controlled stored summary.",
  deceptionTricks: [],
  technicalEvidence: {},
  inputMetadata: {},
  analysisSource: "TEST_WORKER",
  modelVersion: "fixture-v1",
  errorCode: null,
  errorMessage: null,
  defangedTarget: "hxxps://example[.]test/",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  startedAt: "2026-11-01T00:00:00.000Z",
  finishedAt: "2026-11-01T00:00:01.000Z",
};
describe("Stored result presentation", () => {
  it("preserves a valid stored score of zero", () => {
    const result = getInvestigationResult(fixture);
    expect(result?.riskScore).toBe(0);
    const html = renderToStaticMarkup(
      <ThreatScoreGauge
        score={0}
        riskLevel="SAFE"
        defangedTarget={fixture.defangedTarget}
        scamCategory="Fixture"
      />,
    );
    expect(html).toContain("Skor risiko tersimpan");
    expect(html).toContain("SAFE");
    expect(html).not.toContain("Terverifikasi");
  });
  it("uses the stored verdict rather than inferring a different verdict from score", () => {
    expect(getRiskPresentation("PHISHING").high).toBe(true);
    const html = renderToStaticMarkup(
      <ThreatScoreGauge
        score={0}
        riskLevel="PHISHING"
        defangedTarget="fixture"
        scamCategory="Fixture"
      />,
    );
    expect(html).toContain("PHISHING");
    expect(html).not.toContain("AMAN");
  });
  it("does not produce risk or safety conclusions for pending, unavailable, failed, legacy or incomplete records", () => {
    for (const status of ["RECEIVED", "PROCESSING", "FAILED", "UNAVAILABLE"] as const)
      expect(getInvestigationResult({ ...fixture, status })).toBeNull();
    expect(getInvestigationResult({ ...fixture, analysisSource: "LEGACY_UNVERIFIED" })).toBeNull();
    expect(getInvestigationResult({ ...fixture, modelVersion: null })).toBeNull();
    expect(getInvestigationResult({ ...fixture, riskScore: null })).toBeNull();
    expect(getInvestigationResult({ ...fixture, riskScore: 101 })).toBeNull();
    expect(getInvestigationLabel({ ...fixture, summary: null })).toBe("Hasil belum lengkap");
  });
  it("does not invent entropy, C2, infrastructure, or clean-token evidence", () => {
    const result = getInvestigationResult(fixture);
    if (!result) throw new Error("Fixture should be complete");
    const html = renderToStaticMarkup(<GeekViewPanel result={result} />);
    expect(html).toContain("Belum ada bukti teknis");
    for (const invented of ["Cloudflare", "No active C2", "Clean from", "bits/char"])
      expect(html).not.toContain(invented);
  });
  it("renders the stored human explanation without a default fraud conclusion", () => {
    const html = renderToStaticMarkup(
      <KedokCard
        riskLevel="WARNING"
        scamCategory="Fixture"
        humanFriendlySummary={fixture.summary ?? ""}
      />,
    );
    expect(html).toContain(fixture.summary ?? "");
    expect(html).not.toContain("Kedok Penipu Terbongkar");
  });
  it("builds a reloadable result link using only ID and mode", () => {
    expect(PUBLIC_ROUTES.investigation(fixture.id, "geek")).toBe(
      "/?investigation=fixture-result&mode=geek",
    );
    expect(PUBLIC_ROUTES.investigation(fixture.id)).not.toContain(fixture.target);
  });
});
