import { describe, expect, it } from "bun:test";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { getPostLoginRedirect } from "./redirect";

describe("Post-login destinations", () => {
  it("returns users to the landing and preserves a pending landing analysis", () => {
    expect(getPostLoginRedirect("USER")).toBe(PUBLIC_ROUTES.home);
    expect(getPostLoginRedirect("USER", "/?tab=qr")).toBe("/?tab=qr");
    expect(getPostLoginRedirect("USER", "/history")).toBe(PUBLIC_ROUTES.home);
    expect(getPostLoginRedirect("USER", "/admin")).toBe(PUBLIC_ROUTES.home);
  });
  it.each([undefined, "/", "/history", "//evil.example", "/admin/quizzes"])(
    "always sends admins to their dashboard for requested target %s",
    (target) => {
      expect(getPostLoginRedirect("ADMIN", target)).toBe(ADMIN_ROUTES.dashboard);
    },
  );
  it.each([
    "//evil.example",
    "/\\evil.example",
    "/%5cevil.example",
    "/%252f%252fevil.example",
    "/%0a/evil.example",
    "https://evil.example",
  ])("rejects unsafe redirect %s", (target) => {
    expect(getSafeRedirectUrl(target)).toBe(PUBLIC_ROUTES.home);
    expect(getPostLoginRedirect("USER", target)).toBe(PUBLIC_ROUTES.home);
  });
});
