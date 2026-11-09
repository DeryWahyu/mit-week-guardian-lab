import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock Next.js navigation hooks for static markup testing
mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/login",
}));

// Mock Next.js font loader for static markup testing
mock.module("next/font/google", () => ({
  Bricolage_Grotesque: () => ({ variable: "font-auth-display" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-landing-sans", className: "font-landing-sans" }),
}));

// Mock Next.js Image component for static markup testing
mock.module("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    unoptimized: _unoptimized,
    fetchPriority: _fetchPriority,
    ...rest
  }: {
    src: unknown;
    alt?: string;
    className?: string;
    unoptimized?: boolean;
    fetchPriority?: string;
    [key: string]: unknown;
  }) => {
    const srcString =
      typeof src === "object" && src !== null && "src" in src
        ? (src as { src: string }).src
        : String(src || "image.png");
    return React.createElement("img", { src: srcString, alt: alt ?? "", className, ...rest });
  },
}));

describe("AUTH-UI-01..04, AUTH-ASSET-01, AUTH-FORM-01..02: Auth Forms & Layout SSR Rendering", () => {
  it("AUTH-UI-01 & AUTH-FORM-01: renders LoginForm with 'Selamat datang kembali.' and accessible password toggle", async () => {
    const { LoginForm } = await import("@/app/(auth)/login/_components/login-form");
    const html = renderToStaticMarkup(React.createElement(LoginForm));

    // Verify main copy and subtitle
    expect(html).toContain("Selamat datang kembali.");
    expect(html).toContain("Lanjutkan aktivitasmu bersama Guardian Lab.");

    // Verify input fields
    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).toContain('name="password"');

    // Verify accessible password toggle button
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Lihat password"');
    expect(html).toContain('aria-pressed="false"');

    // Verify links and submit button
    expect(html).toContain("Lupa password?");
    expect(html).toContain("Daftar");
    expect(html).toContain('type="submit"');
    expect(html).toContain("Masuk");

    // Must NOT contain old/unwanted "Zero Real PII" badge
    expect(html.toLowerCase()).not.toContain("zero real pii");
  });

  it("AUTH-UI-02 & AUTH-FORM-02: renders RegisterForm with separate accessible toggle buttons for password and confirmPassword", async () => {
    const { RegisterForm } = await import("@/app/(auth)/register/_components/register-form");
    const html = renderToStaticMarkup(React.createElement(RegisterForm));

    // Verify copy
    expect(html).toContain("Buat akun Guardian.");
    expect(html).toContain("Periksa ancaman digital dan simpan riwayat pemeriksaanmu.");

    // Verify form fields
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="phone"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="confirmPassword"');

    // Verify distinct accessible password toggle buttons
    expect(html).toContain('aria-label="Lihat password"');
    expect(html).toContain('aria-label="Lihat ulangi password"');

    // Verify submit button & prompt
    expect(html).toContain("Buat akun");
    expect(html).toContain("Sudah punya akun?");

    // Must NOT contain old/unwanted "Zero Real PII" badge
    expect(html.toLowerCase()).not.toContain("zero real pii");
  });

  it("AUTH-UI-03: renders ForgotForm with copy, phone input, and back-to-login navigation", async () => {
    const { ForgotForm } = await import("@/app/(auth)/forgot-password/_components/forgot-form");
    const html = renderToStaticMarkup(React.createElement(ForgotForm, { redirectTarget: "/" }));

    // Verify copy
    expect(html).toContain("Lupa password?");
    expect(html).toContain("Masukkan nomor WhatsApp yang terdaftar untuk menerima kode pemulihan.");

    // Verify phone input and submit
    expect(html).toContain('name="phone"');
    expect(html).toContain('type="tel"');
    expect(html).toContain("Kirim kode WhatsApp");
    expect(html).toContain("Kembali ke halaman masuk");

    // Must NOT contain old/unwanted "Zero Real PII" badge
    expect(html.toLowerCase()).not.toContain("zero real pii");
  });

  it("AUTH-UI-04: renders OtpForm initial SSR loading state without old badge", async () => {
    const { OtpForm } = await import("@/app/(auth)/otp/_components/otp-form");
    const html = renderToStaticMarkup(React.createElement(OtpForm));

    // Verify SSR status announcement
    expect(html).toContain("Menyiapkan verifikasi…");

    // Must NOT contain old/unwanted "Zero Real PII" badge
    expect(html.toLowerCase()).not.toContain("zero real pii");
  });

  it("AUTH-ASSET-01: renders AuthLayout with 3D fox mascot and brand mark, excluding Zero Real PII card", async () => {
    const { default: AuthLayout } = await import("@/app/(auth)/layout");
    const testChild = React.createElement("div", { id: "test-auth-form" }, "Auth Form Body");
    const html = renderToStaticMarkup(React.createElement(AuthLayout, null, testChild));

    // Verify child is rendered inside main
    expect(html).toContain('id="test-auth-form"');
    expect(html).toContain("<main>");

    // Verify brand header with link to home
    expect(html).toContain('aria-label="Guardian Lab, beranda"');

    // Verify AuthArtwork landmark and 3D fox mascot description
    expect(html).toContain('aria-label="Teman jelajah digitalmu"');
    expect(html).toContain(
      'alt="Guardian, rubah 3D berjaket cyan, menyambut dengan tangan terbuka sambil melihat ke arah form."',
    );

    // Verify NO Zero Real PII card or badge is rendered anywhere in AuthLayout
    expect(html.toLowerCase()).not.toContain("zero real pii");
    expect(html.toLowerCase()).not.toContain("badge");
  });
});
