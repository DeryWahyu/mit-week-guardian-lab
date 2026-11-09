import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("ASSET-01 & BRAND-01..04 Brand and Asset Integrity", () => {
  it("provides the single 3D fox 4-corner guide image at public/guide/guardian-lab-fox-3d-guide.png (BRAND-01)", () => {
    const guidePath = join(process.cwd(), "public/guide/guardian-lab-fox-3d-guide.png");
    expect(existsSync(guidePath)).toBe(true);
    const stat = statSync(guidePath);
    expect(stat.size).toBeGreaterThan(100_000);

    const guideDir = join(process.cwd(), "public/guide");
    const guideFiles = readdirSync(guideDir);
    expect(guideFiles).toEqual(["guardian-lab-fox-3d-guide.png"]);
  });

  it("contains all active brand images and auth WebP mascot (BRAND-02, AUTH-ASSET-01)", () => {
    const brandFiles = [
      "public/brand/guardian-lab-fox.webp",
      "public/brand/guardian-lab-koneksi.png",
      "public/brand/guardian-lab-fox-auth.webp",
    ];

    for (const file of brandFiles) {
      const fullPath = join(process.cwd(), file);
      expect(existsSync(fullPath)).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(1000);
    }
  });

  it("contains all 11 landing WebP illustrations and back-to-top FAB (BRAND-02, ASSET-01)", () => {
    const landingAssets = [
      "public/landing/guardian-hero-01.webp",
      "public/landing/guardian-input-guide.webp",
      "public/landing/guardian-recognize.webp",
      "public/landing/guardian-protect.webp",
      "public/landing/guardian-share.webp",
      "public/landing/guardian-apk-inspector.webp",
      "public/landing/guardian-explorer.webp",
      "public/landing/guardian-academy-reader.webp",
      "public/landing/guardian-community-helper.webp",
      "public/landing/guardian-cta-guide.webp",
      "public/landing/guardian-evidence-reader.webp",
      "public/landing/guardian-back-to-top.webp",
    ];

    for (const asset of landingAssets) {
      const path = join(process.cwd(), asset);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(1000);
    }
  });

  it("ensures no legacy design folder or old SVG mascot exists in public (ASSET-01, BRAND-03)", () => {
    expect(existsSync(join(process.cwd(), "design"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public/mascot.svg"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public/next.svg"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public/vercel.svg"))).toBe(false);
  });
});
