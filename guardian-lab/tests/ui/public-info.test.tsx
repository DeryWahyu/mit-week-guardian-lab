import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage from "@/app/(public-info)/kebijakan-privasi/page";
import TermsPage from "@/app/(public-info)/ketentuan-penggunaan/page";
import AboutPage from "@/app/(public-info)/tentang/page";
import { PillarsSection } from "@/components/landing/pillars-section";
import { Footer } from "@/components/shared/footer";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

mock.module("next/image", () => ({
  default: ({ unoptimized: _unoptimized, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={(props.alt as string) || ""} />;
  },
}));

describe("INFO-01 & INFO-02 Public Information Pages & Footer Contracts", () => {
  it("renders Footer with 'Informasi' column containing Tentang, Kebijakan Privasi, and Ketentuan Penggunaan (INFO-01)", () => {
    const markup = renderToStaticMarkup(<Footer variant="landing" />);
    expect(markup).toContain("Informasi");
    expect(markup).toContain(PUBLIC_ROUTES.about);
    expect(markup).toContain("Tentang Guardian Lab");
    expect(markup).toContain(PUBLIC_ROUTES.privacy);
    expect(markup).toContain("Kebijakan Privasi");
    expect(markup).toContain(PUBLIC_ROUTES.terms);
    expect(markup).toContain("Ketentuan Penggunaan");

    // Must NOT contain legacy tech list or Next.js promotional links
    expect(markup).not.toContain("https://nextjs.org");
    expect(markup).not.toContain("Vercel");
  });

  it("ensures APK pillar card does NOT show 'Perlu login' label (INFO-01)", () => {
    const markup = renderToStaticMarkup(<PillarsSection />);
    expect(markup).toContain(PROTECTED_ROUTES.apk);
    expect(markup).toContain("Bedah file APK");
    expect(markup).toContain("Periksa APK");
    expect(markup).not.toContain("Perlu login");
  });

  it("renders /tentang page cleanly without database crash or auth gating (INFO-02)", () => {
    const markup = renderToStaticMarkup(<AboutPage />);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Tentang Guardian Lab");
    expect(markup).toContain("<h2");
    expect(markup).toContain("Mengenal risiko, satu langkah setiap kali");
    expect(markup).toContain("Kembali ke Beranda");
    expect(markup).toContain(PUBLIC_ROUTES.home);
  });

  it("renders /kebijakan-privasi page cleanly without database crash (INFO-02)", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Kebijakan Privasi");
    expect(markup).toContain("<h2");
    expect(markup).toContain("Data akun dan penggunaannya");
    expect(markup).toContain("Kembali ke Beranda");
  });

  it("renders /ketentuan-penggunaan page cleanly without database crash (INFO-02)", () => {
    const markup = renderToStaticMarkup(<TermsPage />);
    expect(markup).toContain("<h1");
    expect(markup).toContain("Ketentuan Penggunaan");
    expect(markup).toContain("<h2");
    expect(markup).toContain("Tujuan dan batas penggunaan");
    expect(markup).toContain("Kembali ke Beranda");
  });
});
