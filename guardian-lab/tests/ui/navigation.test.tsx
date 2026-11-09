import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Header } from "@/components/shared/header";
import { HeaderNavigation } from "@/components/shared/header-navigation";
import { isNavigationActive } from "@/lib/navigation";
import { ADMIN_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

mock.module("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("NAV-01..04 & SCROLL-01 Header, Navbar & Navigation Contracts", () => {
  it("renders header with progressbar and brand elements (NAV-04, SCROLL-01)", () => {
    const markup = renderToStaticMarkup(<Header variant="landing" />);
    expect(markup).toContain("<header");
    expect(markup).toContain('data-landing-progress="true"');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain("Guardian");
    expect(markup).toContain("Lab");
  });

  it("renders information navigation with 4 public links for variant='information' (NAV-04)", () => {
    const markup = renderToStaticMarkup(
      <HeaderNavigation signedIn={false} variant="information" />,
    );
    expect(markup).toContain("Beranda");
    expect(markup).toContain("Tentang Guardian Lab");
    expect(markup).toContain("Kebijakan Privasi");
    expect(markup).toContain("Ketentuan Penggunaan");
    expect(markup).toContain(PUBLIC_ROUTES.about);
    expect(markup).toContain(PUBLIC_ROUTES.privacy);
    expect(markup).toContain(PUBLIC_ROUTES.terms);
  });

  it("renders guest landing navigation with section anchor links and Masuk CTA (NAV-01, NAV-03)", () => {
    const navMarkup = renderToStaticMarkup(<HeaderNavigation signedIn={false} variant="landing" />);
    expect(navMarkup).toContain("#landing-beranda");
    expect(navMarkup).toContain("#landing-fitur");
    expect(navMarkup).toContain("#landing-cara-kerja");
    expect(navMarkup).toContain("#landing-komunitas");
    expect(navMarkup).toContain("#landing-mulai");

    const headerMarkup = renderToStaticMarkup(<Header variant="landing" initialUser={null} />);
    expect(headerMarkup).toContain("Masuk");
    expect(headerMarkup).toContain(AUTH_ROUTES.login);
  });

  it("renders authenticated header with user pill and admin badge if role is ADMIN (NAV-01, NAV-04)", () => {
    const adminUser = {
      id: "admin-1",
      email: "admin@test.id",
      name: "Admin Guardian",
      role: "ADMIN" as const,
      exp: 500,
      streakDays: 10,
    };
    const markup = renderToStaticMarkup(<Header initialUser={adminUser} variant="landing" />);
    expect(markup).toContain("Admin");
    expect(markup).toContain(ADMIN_ROUTES.dashboard);
    expect(markup).toContain("Admin Guardian");
  });

  it("determines active navigation correctly based on route and query (NAV-01, NAV-03)", () => {
    // Landing home tab
    expect(isNavigationActive(PUBLIC_ROUTES.home, "/", new URLSearchParams())).toBe(true);
    expect(isNavigationActive(PUBLIC_ROUTES.home, "/", new URLSearchParams("tab=url"))).toBe(true);
    expect(isNavigationActive(PUBLIC_ROUTES.home, "/", new URLSearchParams("tab=qr"))).toBe(true);
    expect(isNavigationActive(PUBLIC_ROUTES.home, "/", new URLSearchParams("tab=apk"))).toBe(false);

    // Protected feature pages
    expect(isNavigationActive(PROTECTED_ROUTES.apk, "/apk", new URLSearchParams())).toBe(true);
    expect(isNavigationActive(PUBLIC_ROUTES.home, "/apk", new URLSearchParams())).toBe(false);
    expect(isNavigationActive(PUBLIC_ROUTES.about, "/tentang", new URLSearchParams())).toBe(true);
  });
});
