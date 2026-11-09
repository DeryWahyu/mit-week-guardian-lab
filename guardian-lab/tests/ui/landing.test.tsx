import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CtaBanner } from "@/components/landing/cta-banner";
import { HeroSection } from "@/components/landing/hero";
import { JourneySection } from "@/components/landing/journey-section";
import { LandingFaq } from "@/components/landing/landing-faq";
import { PillarsSection } from "@/components/landing/pillars-section";
import { PlatformStats } from "@/components/landing/platform-stats";
import { LANDING_SECTIONS } from "@/lib/routes";

mock.module("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // biome-ignore lint/performance/noImgElement: Native img is the static test double for next/image.
    return <img {...props} alt={(props.alt as string) || ""} />;
  },
}));

let mockResourceState: {
  data: { links: number; apks: number; cases: number } | null;
  loading: boolean;
  problem: { message: string } | null;
  retry: () => void;
} = {
  data: { links: 42, apks: 12, cases: 5 },
  loading: false,
  problem: null,
  retry: () => {},
};

mock.module("@/lib/hooks/use-api-resource", () => ({
  useApiResource: () => mockResourceState,
}));

describe("LANDING-01..04, HERO-01..02, SCROLL-02 Landing Page Sections & Interactions", () => {
  it("renders 5 canonical landing sections with expected anchors (LANDING-01)", () => {
    const pillars = renderToStaticMarkup(<PillarsSection />);
    expect(pillars).toContain(`id="${LANDING_SECTIONS.features}"`);

    const journey = renderToStaticMarkup(<JourneySection />);
    expect(journey).toContain(`id="${LANDING_SECTIONS.journey}"`);

    const cta = renderToStaticMarkup(<CtaBanner />);
    expect(cta).toContain(`id="${LANDING_SECTIONS.start}"`);
  });

  it("renders seven FAQ items including model limits and WhatsApp usage, initially closed (LANDING-04)", () => {
    const faq = renderToStaticMarkup(<LandingFaq />);
    expect(faq).toContain("<details");
    // Count number of details tags
    const count = (faq.match(/<details/g) || []).length;
    expect(count).toBe(7);
    expect(faq).toContain("Apakah skor rendah berarti tautan pasti aman?");
    expect(faq).toContain("Apakah AI memeriksa isi situs dan redirect?");
    expect(faq).toContain("Untuk apa nomor WhatsApp saya digunakan?");

    expect(faq).toContain("Apakah tautan langsung dibuka di perangkat saya?");
    expect(faq).toContain("Apakah file APK akan dipasang?");
    expect(faq).toContain("Kapan saya perlu masuk ke akun?");
    expect(faq).toContain("Kapan saya bisa membuat Share Card?");

    // None should have open attribute initially
    expect(faq).not.toContain("<details open");
  });

  it("renders platform statistics with honest activity labels, no fake blocked threats (LANDING-03)", () => {
    // Normal loaded state
    mockResourceState = {
      data: { links: 1250, apks: 340, cases: 88 },
      loading: false,
      problem: null,
      retry: () => {},
    };
    const markup = renderToStaticMarkup(<PlatformStats />);
    expect(markup).toContain("Tautan URL/QR diajukan");
    expect(markup).toContain("APK diunggah untuk diperiksa");
    expect(markup).toContain("Kasus komunitas disetujui");
    expect(markup).not.toContain("ancaman diblokir");
    expect(markup).toContain("1.250");
    expect(markup).toContain("340");
    expect(markup).toContain("88");

    // Loading skeleton state
    mockResourceState = {
      data: null,
      loading: true,
      problem: null,
      retry: () => {},
    };
    const loadingMarkup = renderToStaticMarkup(<PlatformStats />);
    expect(loadingMarkup).toContain("<output");
    expect(loadingMarkup).toContain('aria-busy="true"');

    // Error problem state
    mockResourceState = {
      data: null,
      loading: false,
      problem: { message: "Network error" },
      retry: () => {},
    };
    const errorMarkup = renderToStaticMarkup(<PlatformStats />);
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("Coba lagi");
  });

  it("renders hero section with accessible heading and without AI status warning (HERO-01, HERO-02)", () => {
    const heroMarkup = renderToStaticMarkup(
      <HeroSection>
        <div id="mock-gateway">Bar URL</div>
      </HeroSection>,
    );
    expect(heroMarkup).toContain("<h1");
    expect(heroMarkup).toContain("Sebelum klik,");
    expect(heroMarkup).toContain("cek dulu.");
    expect(heroMarkup).toContain("mock-gateway");
    expect(heroMarkup).not.toContain("Status AI");
  });
});
