import { describe, expect, it } from "bun:test";
import {
  ADMIN_ROUTES,
  API_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROUTES,
} from "./routes";

describe("routes constants", () => {
  it("defines public routes correctly", () => {
    expect(PUBLIC_ROUTES.home).toBe("/");
    expect(PUBLIC_ROUTES.sandboxWeb).toBe("/sandbox/web");
    expect(PUBLIC_ROUTES.sandboxAndroid).toBe("/sandbox/android");
    expect(PUBLIC_ROUTES.act).toBe("/act");
  });

  it("builds parameterized routes properly", () => {
    expect(PUBLIC_ROUTES.homeWithTab("qr")).toBe("/?tab=qr");
    expect(PUBLIC_ROUTES.homeWithMode("geek")).toBe("/?mode=geek");
    expect(PUBLIC_ROUTES.homeWithMode("geek", "apk")).toBe("/?mode=geek&tab=apk");
    expect(PUBLIC_ROUTES.sandboxWebWithTarget("https://evil.com/phish?id=123")).toBe(
      "/sandbox/web?target=https%3A%2F%2Fevil.com%2Fphish%3Fid%3D123",
    );
    expect(PUBLIC_ROUTES.actWithInvestigation("scan-123")).toBe("/act?id=scan-123");
    expect(PUBLIC_ROUTES.actWithInvestigation("scan?target=forged")).toBe(
      "/act?id=scan%3Ftarget%3Dforged",
    );
  });

  it("defines auth and protected routes correctly", () => {
    expect(AUTH_ROUTES.login).toBe("/login");
    expect(AUTH_ROUTES.register).toBe("/register");

    expect(PROTECTED_ROUTES.history).toBe("/history");
    expect(PROTECTED_ROUTES.historyDetail("hist-123")).toBe("/history/hist-123");
    expect(PROTECTED_ROUTES.academy).toBe("/academy");
    expect(PROTECTED_ROUTES.academyLesson("lesson-1")).toBe("/academy/lesson-1");
    expect(PROTECTED_ROUTES.community).toBe("/community");
    expect(PROTECTED_ROUTES.communityReplay("rep-99")).toBe("/community/rep-99");
  });

  it("defines admin routes correctly", () => {
    expect(ADMIN_ROUTES.dashboard).toBe("/admin");
    expect(ADMIN_ROUTES.quizzes).toBe("/admin/quizzes");
    expect(ADMIN_ROUTES.communityReviews).toBe("/admin/community-reviews");
    expect(ADMIN_ROUTES.users).toBe("/admin/users");
  });

  it("defines API routes correctly", () => {
    expect(API_ROUTES.analyzeUrl).toBe("/api/analyze-url");
    expect(API_ROUTES.analyzeQr).toBe("/api/analyze-qr");
    expect(API_ROUTES.analyzeApk).toBe("/api/analyze-apk");
    expect(API_ROUTES.sandboxSessionStart).toBe("/api/sandbox/session/start");
    expect(API_ROUTES.sandboxSessionStop).toBe("/api/sandbox/session/stop");
  });

  it("exports combined default ROUTES object", () => {
    expect(ROUTES.public).toEqual(PUBLIC_ROUTES);
    expect(ROUTES.auth).toEqual(AUTH_ROUTES);
    expect(ROUTES.protected).toEqual(PROTECTED_ROUTES);
    expect(ROUTES.admin).toEqual(ADMIN_ROUTES);
    expect(ROUTES.api).toEqual(API_ROUTES);
  });
});
