import { describe, expect, it } from "bun:test";
import { analyzeThreatWithDeepSeek, buildHeuristicAnalysis } from "./deepseek";
import { analyzeLexicalUrl } from "./lexical";

describe("DeepSeek AI Analysis Engine & Heuristic Fallback", () => {
  it("builds correct heuristic analysis for safe target", () => {
    const lexical = analyzeLexicalUrl("https://klikbca.com");
    const result = buildHeuristicAnalysis("https://klikbca.com", lexical);

    expect(result.riskLevel).toBe("SAFE");
    expect(result.riskScore).toBeLessThanOrEqual(25);
    expect(result.defangedTarget).toBe("hxxps://klikbca[.]com");
    expect(result.emergencyActionPlan.ifNotClicked).toBeDefined();
    expect(typeof result.emergencyActionPlan.ifNotClicked).toBe("string");
  });

  it("builds correct heuristic analysis for phishing target", () => {
    const url = "https://klikbca-verifikasi-otp.top/login.php";
    const lexical = analyzeLexicalUrl(url);
    const result = buildHeuristicAnalysis(url, lexical);

    expect(result.riskLevel).toBe("PHISHING");
    expect(result.riskScore).toBeGreaterThanOrEqual(80);
    expect(result.humanFriendlySummary).toContain("mencuri");
    expect(result.deceptionTricks.length).toBeGreaterThan(0);
    expect(result.defangedTarget).toContain("klikbca-verifikasi-otp[.]top");
  });

  it("builds correct heuristic analysis for malware APK dropper", () => {
    const url = "https://undangan-nikah-digital-online.top/undangan.apk";
    const lexical = analyzeLexicalUrl(url);
    const result = buildHeuristicAnalysis(url, lexical);

    expect(result.riskLevel).toBe("MALWARE");
    expect(result.riskScore).toBeGreaterThanOrEqual(85);
    expect(result.scamCategory).toContain("APK");
  });

  it("executes analyzeThreatWithDeepSeek with fallback when key is not configured", async () => {
    const result = await analyzeThreatWithDeepSeek("https://klikbca-verifikasi.xyz");
    expect(result.target).toBe("https://klikbca-verifikasi.xyz");
    expect(result.riskLevel).toBeDefined();
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.humanFriendlySummary).toBeDefined();
  });
});
