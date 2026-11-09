import { describe, expect, it } from "bun:test";
import { defangUrl, isDefanged, refangUrl } from "./defang";

describe("Defanged URL Utility", () => {
  it("defangs https URLs correctly", () => {
    const original = "https://secure-bca.phish-login.com";
    const defanged = defangUrl(original);
    expect(defanged).toBe("hxxps://secure-bca[.]phish-login[.]com");
  });

  it("defangs http URLs correctly", () => {
    const original = "http://malicious-site.xyz/login.html?token=123";
    const defanged = defangUrl(original);
    expect(defanged).toBe("hxxp://malicious-site[.]xyz/login.html?token=123");
  });

  it("defangs bare domains without protocol", () => {
    const original = "promo-undian-dana.net";
    const defanged = defangUrl(original);
    expect(defanged).toBe("promo-undian-dana[.]net");
  });

  it("defangs IP addresses and preserves port", () => {
    const original = "http://192.168.1.1:8080/download/update.apk";
    const defanged = defangUrl(original);
    expect(defanged).toBe("hxxp://192[.]168[.]1[.]1:8080/download/update.apk");
  });

  it("refangs defanged URLs back to original", () => {
    const defanged = "hxxps://secure-bca[.]phish-login[.]com/portal";
    const refanged = refangUrl(defanged);
    expect(refanged).toBe("https://secure-bca.phish-login.com/portal");
  });

  it("detects defanged strings via isDefanged", () => {
    expect(isDefanged("hxxps://bank[.]com")).toBe(true);
    expect(isDefanged("bank[.]com")).toBe(true);
    expect(isDefanged("https://bank.com")).toBe(false);
  });

  it("handles empty and malformed inputs gracefully", () => {
    expect(defangUrl("")).toBe("");
    expect(refangUrl("")).toBe("");
    expect(isDefanged("")).toBe(false);
  });
});
