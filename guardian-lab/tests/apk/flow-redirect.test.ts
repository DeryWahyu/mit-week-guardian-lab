import { describe, expect, it, mock } from "bun:test";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requirePageUser } from "@/lib/auth/page-access";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import { createSessionToken, getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";

mock.module("next/font/google", () => ({
  Bricolage_Grotesque: () => ({ variable: "--font-landing-display" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-landing-sans", className: "font-landing-sans" }),
}));

function getRedirectTarget(error: unknown): string {
  if (isRedirectError(error)) {
    // digest format: NEXT_REDIRECT;action;destination;statusCode;
    const parts = (error as { digest: string }).digest.split(";");
    return parts[2] ?? "";
  }
  throw error;
}

describe("APK-01 & APK-02: Flow, authentication gates, and redirect normalization", () => {
  describe("APK-01: Guest & expired session protection on /apk", () => {
    it("redirects unauthenticated guests accessing /apk to /login?redirect=%2Fapk", async () => {
      try {
        await requirePageUser(undefined, PROTECTED_ROUTES.apk);
        expect.unreachable("Expected requirePageUser to throw redirect for guest");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe(AUTH_ROUTES.loginWithRedirect(PROTECTED_ROUTES.apk));
        expect(target).toBe("/login?redirect=%2Fapk");
      }
    });

    it("preserves investigation ID and geek mode in redirect when guest visits deep link", async () => {
      const deepLink = PROTECTED_ROUTES.apkWithInvestigation("inv-guest-sample", "geek");
      expect(deepLink).toBe("/apk?investigation=inv-guest-sample&mode=geek");

      try {
        await requirePageUser(undefined, deepLink);
        expect.unreachable("Expected requirePageUser to throw redirect for deep link");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe(AUTH_ROUTES.loginWithRedirect(deepLink));
        expect(target).toBe(
          "/login?redirect=%2Fapk%3Finvestigation%3Dinv-guest-sample%26mode%3Dgeek",
        );
      }
    });

    it("redirects expired session to /login?redirect=%2Fapk", async () => {
      // Create user with phone verified
      const dbUser = await prisma.user.findUniqueOrThrow({
        where: { id: STANDARD_USER_FIXTURE.id },
      });
      const uniquePhone = `+6281${Date.now().toString().slice(-8)}`;
      // Ensure phone and phoneVerifiedAt are set
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          phone: uniquePhone,
          phoneVerifiedAt: new Date(),
        },
      });

      const token = await createSessionToken({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        phone: uniquePhone,
        phoneVerifiedAt: new Date(),
      });

      // Expire session in the database
      await prisma.session.update({
        where: { token },
        data: { expiresAt: new Date(Date.now() - 3600000) },
      });

      // Emulate request with the expired session cookie
      const request = new Request("http://localhost:3000/apk", {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      });

      const user = await getCurrentUser(request);
      expect(user).toBeNull();

      try {
        if (!user) {
          await requirePageUser(undefined, PROTECTED_ROUTES.apk);
        }
        expect.unreachable("Expected redirect for expired session");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe("/login?redirect=%2Fapk");
      }
    });
  });

  describe("APK-02: Explicit post-login redirect for USER and ADMIN", () => {
    it("returns USER directly to /apk when explicitly requested", () => {
      const redirect = getPostLoginRedirect("USER", PROTECTED_ROUTES.apk);
      expect(redirect).toBe("/apk");
    });

    it("returns ADMIN directly to /apk when explicitly requested instead of default admin dashboard", () => {
      const redirect = getPostLoginRedirect("ADMIN", PROTECTED_ROUTES.apk);
      expect(redirect).toBe("/apk");
      expect(redirect).not.toBe(ADMIN_ROUTES.dashboard);
    });

    it("preserves deep investigation query params on APK post-login redirect", () => {
      const targetWithParams = "/apk?investigation=apk-case-999&mode=geek";
      expect(getPostLoginRedirect("USER", targetWithParams)).toBe(targetWithParams);
      expect(getPostLoginRedirect("ADMIN", targetWithParams)).toBe(targetWithParams);
    });

    it("defaults to role destination when no specific APK redirect is requested", () => {
      expect(getPostLoginRedirect("USER", null)).toBe(PUBLIC_ROUTES.home);
      expect(getPostLoginRedirect("USER", undefined)).toBe(PUBLIC_ROUTES.home);
      expect(getPostLoginRedirect("ADMIN", null)).toBe(ADMIN_ROUTES.dashboard);
      expect(getPostLoginRedirect("ADMIN", undefined)).toBe(ADMIN_ROUTES.dashboard);
    });
  });

  describe("APK-02: Open redirect rejection & sanitization", () => {
    it("rejects absolute external URLs and protocol-relative targets", () => {
      const unsafeTargets = [
        "https://evil.com/phishing",
        "http://malicious.test/login",
        "//evil.com/payload",
        "///evil.com",
        "////attacker.test/apk",
      ];

      for (const target of unsafeTargets) {
        expect(getSafeRedirectUrl(target, "/")).toBe("/");
        expect(getPostLoginRedirect("USER", target)).toBe(PUBLIC_ROUTES.home);
        expect(getPostLoginRedirect("ADMIN", target)).toBe(ADMIN_ROUTES.dashboard);
      }
    });

    it("rejects backslash payloads and encoded separators", () => {
      const backslashTargets = [
        "/\\evil.com",
        "\\/evil.com",
        "\\\\evil.com",
        "/apk\\malicious",
        "/%5Cevil.com",
        "/%2F%5Cevil.com",
        "/%255cevil.com",
      ];

      for (const target of backslashTargets) {
        expect(getSafeRedirectUrl(target, "/")).toBe("/");
        expect(getPostLoginRedirect("USER", target)).toBe(PUBLIC_ROUTES.home);
        expect(getPostLoginRedirect("ADMIN", target)).toBe(ADMIN_ROUTES.dashboard);
      }
    });

    it("rejects encoded control characters, CRLF, and null bytes", () => {
      const controlTargets = [
        "/%00/apk",
        "/%0d%0aSet-Cookie:evil=1",
        "/apk\r\nevil",
        "/apk\n/evil",
        "/%1fapk",
        "/%7fapk",
      ];

      for (const target of controlTargets) {
        expect(getSafeRedirectUrl(target, "/")).toBe("/");
        expect(getPostLoginRedirect("USER", target)).toBe(PUBLIC_ROUTES.home);
        expect(getPostLoginRedirect("ADMIN", target)).toBe(ADMIN_ROUTES.dashboard);
      }
    });

    it("rejects non-http pseudo protocols like javascript: and data:", () => {
      const scriptTargets = [
        "javascript:alert(1)",
        "javascript://evil.com",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
      ];

      for (const target of scriptTargets) {
        expect(getSafeRedirectUrl(target, "/")).toBe("/");
        expect(getPostLoginRedirect("USER", target)).toBe(PUBLIC_ROUTES.home);
      }
    });
  });

  describe("APK-01: Route normalization from /?tab=apk to /apk", () => {
    it("normalizes /?tab=apk to /apk", async () => {
      const HomePage = (await import("@/app/page")).default;
      const element = HomePage({ searchParams: Promise.resolve({ tab: "apk" }) });
      // LandingContent is the child of Suspense inside HomePage
      const content = element.props.children.props.children;

      try {
        await content.type(content.props);
        expect.unreachable("Expected tab=apk to redirect to /apk");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe("/apk");
      }
    });

    it("normalizes /?tab=apk&mode=geek to /apk?mode=geek", async () => {
      const HomePage = (await import("@/app/page")).default;
      const element = HomePage({ searchParams: Promise.resolve({ tab: "apk", mode: "geek" }) });
      const content = element.props.children.props.children;

      try {
        await content.type(content.props);
        expect.unreachable("Expected tab=apk&mode=geek to redirect");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe("/apk?mode=geek");
      }
    });

    it("normalizes /?tab=apk&investigation=<id> to /apk?investigation=<id>", async () => {
      const HomePage = (await import("@/app/page")).default;
      const element = HomePage({
        searchParams: Promise.resolve({ tab: "apk", investigation: "rec-test-123" }),
      });
      const content = element.props.children.props.children;

      try {
        await content.type(content.props);
        expect.unreachable("Expected tab=apk with investigation to redirect");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe("/apk?investigation=rec-test-123");
      }
    });

    it("normalizes /?tab=apk&investigation=<id>&mode=geek to /apk?investigation=<id>&mode=geek", async () => {
      const HomePage = (await import("@/app/page")).default;
      const element = HomePage({
        searchParams: Promise.resolve({
          tab: "apk",
          investigation: "rec-test-123",
          mode: "geek",
        }),
      });
      const content = element.props.children.props.children;

      try {
        await content.type(content.props);
        expect.unreachable("Expected tab=apk with investigation and geek mode to redirect");
      } catch (error) {
        const target = getRedirectTarget(error);
        expect(target).toBe("/apk?investigation=rec-test-123&mode=geek");
      }
    });

    it("does not redirect when tab is url or qr", async () => {
      const HomePage = (await import("@/app/page")).default;
      for (const tab of ["url", "qr"]) {
        const element = HomePage({ searchParams: Promise.resolve({ tab }) });
        const content = element.props.children.props.children;
        // Does not throw redirect
        const view = await content.type(content.props);
        expect(view).toBeDefined();
      }
    });
  });
});
