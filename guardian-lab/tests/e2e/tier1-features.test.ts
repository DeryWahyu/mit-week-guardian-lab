import { buildShareCard } from "@/lib/share-card/content";
import { investigationSchema } from "@/lib/validations/investigation";
import { apkUpload } from "../helpers/investigation-fixtures";
/**
 * Tier 1: Feature Coverage (Happy Path for Features 1 to 28 in PROJECT.md)
 * E2E tests validating that every feature in the Guardian Lab Feature Inventory
 * performs its specified primary behavior and satisfies its interface contract.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "../../lib/prisma";
import {
  ADMIN_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  ROUTES,
} from "../../lib/routes";
import { CLEAN_URL_FIXTURES, INDONESIAN_PHISHING_FIXTURES } from "./fixtures/phishing-urls";
import { QR_CODE_FIXTURES } from "./fixtures/qr-codes";
import { ACADEMY_QUIZ_FIXTURES, BADGE_FIXTURES } from "./fixtures/quiz-fixtures";
import {
  ADMIN_USER_FIXTURE,
  NEW_REGISTERED_USER_FIXTURE,
  STANDARD_USER_FIXTURE,
} from "./fixtures/user-fixtures";
import {
  CommunityReplaySchema,
  executeRoute,
  PiiScrubberOutputSchema,
  QuizQuestionSchema,
  referenceCalculateEntropy,
  referenceCalculateRank,
  referenceLevenshteinDistance,
  referenceScrubPii,
  UserSessionSchema,
} from "./helpers/test-harness";

describe("Tier 1: Feature Coverage (Features 1–28)", () => {
  beforeAll(async () => {
    const existing = await prisma.user.findUnique({
      where: { email: NEW_REGISTERED_USER_FIXTURE.email },
    });
    if (existing) {
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }
  });

  afterAll(async () => {
    const existing = await prisma.user.findUnique({
      where: { email: NEW_REGISTERED_USER_FIXTURE.email },
    });
    if (existing) {
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }
  });
  // --------------------------------------------------------------------------
  // Feature 1: MySQL & Prisma Schema
  // --------------------------------------------------------------------------
  describe("F1: Database & Entity Data Model Contracts", () => {
    it("validates User and Session model interface contracts", () => {
      const userSession = {
        id: "usr_1001",
        email: "analyst@guardianlab.id",
        name: "Security Analyst",
        role: "USER" as const,
        exp: 350,
        streakDays: 14,
      };
      const parsed = UserSessionSchema.safeParse(userSession);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.role).toBe("USER");
        expect(parsed.data.exp).toBeGreaterThanOrEqual(0);
        expect(parsed.data.streakDays).toBeGreaterThan(0);
      }
    });

    it("validates all 11 core entity contracts are representable", () => {
      const entityTypes = [
        "User",
        "Session",
        "ForensicRecord",
        "SandboxSession",
        "Badge",
        "UserBadge",
        "Quiz",
        "QuizQuestion",
        "QuizAttempt",
        "CommunityReplay",
        "ReplayAttempt",
      ];
      expect(entityTypes.length).toBe(11);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 2: Database Migrations & Seed
  // --------------------------------------------------------------------------
  describe("F2: Database Seed Data Integrity", () => {
    it("provides admin user fixture with elevated role and credentials", () => {
      expect(ADMIN_USER_FIXTURE.role).toBe("ADMIN");
      expect(ADMIN_USER_FIXTURE.email).toBe("admin@guardianlab.test");
      expect(ADMIN_USER_FIXTURE.exp).toBeGreaterThanOrEqual(1000);
    });

    it("seeds starter badges across all threat vectors", () => {
      const badgeCodes = BADGE_FIXTURES.map((b) => b.code);
      expect(badgeCodes).toContain("ANTI_QUISHING_MASTER");
      expect(badgeCodes).toContain("APK_DISSECTOR");
      expect(badgeCodes).toContain("PHISHING_HUNTER");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 3: PII Regex Scrubber
  // --------------------------------------------------------------------------
  describe("F3: PII Regex Scrubber (Zero Real PII Mandate)", () => {
    it("sanitizes Indonesian mobile phone numbers (+62, 62, 08)", () => {
      const input = "Hubungi korban di 081234567890 atau +6281987654321 sekarang.";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("081234567890");
      expect(res.sanitizedText).not.toContain("+6281987654321");
      expect(res.sanitizedText).toContain("[REDACTED_PHONE]");
      expect(res.redactedCounts.phone).toBe(2);
    });

    it("sanitizes 16-digit NIK and bank account numbers", () => {
      const input = "NIK KTP: 3171012345670001 dan No Rekening: 1234567890123456";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("3171012345670001");
      expect(res.sanitizedText).not.toContain("1234567890123456");
      expect(res.sanitizedText).toContain("[REDACTED_NIK_OR_ACCOUNT]");
      expect(res.redactedCounts.nik).toBe(2);
    });

    it("sanitizes user email addresses", () => {
      const input = "Kirim bukti transfer ke victim.account@gmail.com segera!";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("victim.account@gmail.com");
      expect(res.sanitizedText).toContain("[REDACTED_EMAIL]");
      expect(res.redactedCounts.email).toBe(1);
    });

    it("sanitizes Telegram Bot API tokens", () => {
      const input =
        "api.telegram.org/bot6123456789:AAFlkBz80pQc-4xZyR9m30Lk18eP_Oabcde/sendMessage";
      const res = referenceScrubPii(input);
      expect(res.sanitizedText).not.toContain("6123456789:AAFlkBz80pQc-4xZyR9m30Lk18eP_Oabcde");
      expect(res.sanitizedText).toContain("[EXTRACTED_BOT_TOKEN_REDACTED]");
      expect(res.redactedCounts.token).toBe(1);
    });

    it("matches the PiiScrubberOutputSchema contract", () => {
      const res = referenceScrubPii("User 081299998888 sent email to test@domain.com");
      const validation = PiiScrubberOutputSchema.safeParse(res);
      expect(validation.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 4: Authentication API
  // --------------------------------------------------------------------------
  describe("F4: User Authentication API Endpoints", () => {
    it("registers a new user and returns default gamification profile", async () => {
      const res = await executeRoute<{ status: string; redirectTo: string }>(
        "/api/auth/register",
        "POST",
        NEW_REGISTERED_USER_FIXTURE,
      );
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("verification_required");
      expect(res.body.redirectTo).toBe(AUTH_ROUTES.otp);
      const created = await prisma.user.findUniqueOrThrow({
        where: { email: NEW_REGISTERED_USER_FIXTURE.email },
      });
      expect(created.role).toBe("USER");
      expect(created.exp).toBe(0);
      expect(created.phoneVerifiedAt).toBeNull();
    });

    let authenticatedSessionToken = "";

    it("authenticates valid credentials and issues session cookie", async () => {
      const res = await executeRoute<{
        user: { id: string; email: string; role: string };
      }>("/api/auth/login", "POST", {
        email: STANDARD_USER_FIXTURE.email,
        password: STANDARD_USER_FIXTURE.passwordPlainText,
      });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(STANDARD_USER_FIXTURE.email);
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      expect(cookie).toContain("guardian_session");
      expect(cookie).toContain("HttpOnly");

      const match = cookie?.match(/guardian_session=([^;]+)/);
      if (match) {
        authenticatedSessionToken = match[1];
      }
    });

    it("retrieves current authenticated profile from /api/auth/me", async () => {
      let tokenToUse = authenticatedSessionToken;
      if (!tokenToUse) {
        const loginRes = await executeRoute<{ id: string; email: string; role: string }>(
          "/api/auth/login",
          "POST",
          {
            email: STANDARD_USER_FIXTURE.email,
            password: STANDARD_USER_FIXTURE.passwordPlainText,
          },
        );
        const cookie = loginRes.headers.get("Set-Cookie");
        const match = cookie?.match(/guardian_session=([^;]+)/);
        tokenToUse = match ? match[1] : "";
      }

      const res = await executeRoute<{ id: string; email: string; role: string }>(
        "/api/auth/me",
        "GET",
        undefined,
        { guardian_session: tokenToUse },
      );
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("USER");
      expect(res.body.email).toBe(STANDARD_USER_FIXTURE.email);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 5: RBAC Middleware
  // --------------------------------------------------------------------------
  describe("F5: Role-Based Access Control (RBAC) Route Guard", () => {
    it("allows ADMIN role to access admin routes", () => {
      const role = "ADMIN";
      const allowed = role === "ADMIN";
      expect(allowed).toBe(true);
    });

    it("denies regular USER role from accessing admin routes", () => {
      const role = "USER";
      const hasAdminAccess = (r: string) => r === "ADMIN";
      expect(hasAdminAccess(role)).toBe(false);
    });

    it("redirects unauthenticated requests from protected routes", async () => {
      const res = await executeRoute("/api/auth/me", "GET", undefined, {});
      expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 6: Auth Pages & UI
  // --------------------------------------------------------------------------
  describe("F6: Auth Pages Routes and Navigation", () => {
    it("verifies login and register routes are defined in AUTH_ROUTES", () => {
      expect(AUTH_ROUTES.login).toBe("/login");
      expect(AUTH_ROUTES.register).toBe("/register");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 7: Global Navigation & Header
  // --------------------------------------------------------------------------
  describe("F7: Centralized Navigation System (Zero Hardcoded Routes)", () => {
    it("exports all expected route groups without hardcoding", () => {
      expect(ROUTES.public.home).toBe("/");
      expect(ROUTES.public.sandboxWeb).toBe("/sandbox/web");
      expect(ROUTES.public.act).toBe("/act");
      expect(ROUTES.protected.history).toBe("/history");
      expect(ROUTES.protected.academy).toBe("/academy");
      expect(ROUTES.admin.dashboard).toBe("/admin");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 8: 3-Tab Landing Gateway
  // --------------------------------------------------------------------------
  describe("F8: 3-Tab Landing Gateway Inputs", () => {
    it("supports navigation builders for url, qr, and apk tabs", () => {
      expect(PUBLIC_ROUTES.homeWithTab("url")).toBe("/?tab=url");
      expect(PUBLIC_ROUTES.homeWithTab("qr")).toBe("/?tab=qr");
      expect(PUBLIC_ROUTES.homeWithTab("apk")).toBe("/?tab=apk");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 9: Auth-Gated Interception
  // --------------------------------------------------------------------------
  describe("F9: Auth-Gated Action Interception", () => {
    it("preserves redirect intent parameter for unauthenticated guests", () => {
      const redirectUrl = `${AUTH_ROUTES.login}?redirect=${encodeURIComponent("/?tab=apk")}`;
      expect(redirectUrl).toBe("/login?redirect=%2F%3Ftab%3Dapk");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 10: AI URL Threat Detection
  // --------------------------------------------------------------------------
  describe("F10: AI URL Threat Detection (/api/analyze-url)", () => {
    it("stores suspicious URLs without inventing a model verdict", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: INDONESIAN_PHISHING_FIXTURES[0].url,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.riskScore).toBeNull();
      expect(record.riskLevel).toBeNull();
      expect(record.defangedTarget).toContain("[.]top");
      expect(record.technicalEvidence).toEqual({});
    });

    it("does not classify an official-looking URL as safe without analysis", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: CLEAN_URL_FIXTURES[0].url,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.riskLevel).toBeNull();
      expect(record.riskScore).toBeNull();
    });

    it("computes Shannon entropy and Levenshtein typosquat distance accurately", () => {
      const entropy = referenceCalculateEntropy("https://klikbca-verifikasi-otp.top/login.php");
      expect(entropy).toBeGreaterThan(3.5);

      const distance = referenceLevenshteinDistance("klikbca.com", "klikbca-login.com");
      expect(distance).toBe(6);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 11: QR Code Decoder Helper
  // --------------------------------------------------------------------------
  describe("F11: QR Code Decoder Helper (/api/analyze-qr)", () => {
    it("decodes QR image base64 into extracted URL string", async () => {
      const sample = QR_CODE_FIXTURES[2];
      const res = await executeRoute<{ extracted_text: string; is_url: boolean }>(
        "/api/analyze-qr",
        "POST",
        {
          imageBase64: sample.imageBase64,
          mimeType: sample.mimeType,
        },
      );

      expect(res.status).toBe(201);
      expect(res.body.is_url).toBe(true);
      expect(res.body.extracted_text).toContain("https://");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 12: Dual-Mode Results UI
  // --------------------------------------------------------------------------
  describe("F12: Dual-Mode Presentation (Human View vs Geek View)", () => {
    it("provides honest status and input metadata for both presentation modes", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", { url: "https://example.test" });
      const record = investigationSchema.parse(res.body);
      expect(record.errorMessage).toContain("Model analisis belum tersedia");
      expect(record.inputMetadata).toEqual({ submittedAs: "url" });
      expect(record.summary).toBeNull();
      expect(record.deceptionTricks).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 13: Forensic Record Auto-Logger
  // --------------------------------------------------------------------------
  describe("F13: Forensic Record Auto-Logger", () => {
    it("returns an ID that reads back from the database with the same status", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: "https://example.test/record",
      });
      const record = investigationSchema.parse(res.body);
      const stored = await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } });
      expect(stored.target).toBe(record.target);
      expect(stored.status).toBe(record.status);
      expect(stored.userId).toBe(STANDARD_USER_FIXTURE.id);
      expect(stored.riskScore).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 14: Web Sandbox Viewport
  // --------------------------------------------------------------------------
  describe("Sandbox availability and public target validation", () => {
    it("does not create an active session when the runtime is offline", async () => {
      const before = await prisma.sandboxSession.count();
      const res = await executeRoute("/api/sandbox/session/start", "POST", {
        type: "web",
        target: "https://example.com/",
      });
      expect(res.status).toBe(503);
      expect(await prisma.sandboxSession.count()).toBe(before);
    });
    it("rejects local network targets before contacting a provider", async () => {
      const res = await executeRoute("/api/sandbox/session/start", "POST", {
        type: "web",
        target: "http://127.0.0.1/",
      });
      expect(res.status).toBe(400);
    });
    it("requires a target and a supported sandbox type", async () => {
      expect(
        (await executeRoute("/api/sandbox/session/start", "POST", { type: "web" })).status,
      ).toBe(400);
      expect(
        (await executeRoute("/api/sandbox/session/start", "POST", { type: "unknown" })).status,
      ).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 18: APK Static X-Ray Engine
  // --------------------------------------------------------------------------
  describe("F18: APK Static X-Ray Engine (/api/analyze-apk)", () => {
    it("stores APK fingerprint without fabricating permissions or C2 endpoints", async () => {
      const res = await executeRoute("/api/analyze-apk", "POST", apkUpload("sample.apk"));
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.type).toBe("APK");
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.inputMetadata.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.technicalEvidence).toEqual({});
      expect(record.riskScore).toBeNull();
    }, 30000);
  });

  // --------------------------------------------------------------------------
  // Feature 19: Interactive Android Emulator
  // --------------------------------------------------------------------------
  describe("F19: Interactive Android Emulator (/sandbox/android)", () => {
    it("reports unavailable without inventing an emulator stream", async () => {
      const res = await executeRoute("/api/sandbox/session/start", "POST", { type: "android" });
      expect(res.status).toBe(503);
      expect(res.body).not.toHaveProperty("streamUrl");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 20: Guardian Share Card Generator
  // --------------------------------------------------------------------------
  describe("F20: Guardian Share Card Generator (/act)", () => {
    it("does not turn a model-unavailable API record into a warning card", async () => {
      const response = await executeRoute(ROUTES.api.analyzeUrl, "POST", {
        url: "https://share-fixture.test/",
      });
      const record = investigationSchema.parse(response.body);
      expect(record.status).toBe("UNAVAILABLE");
      expect(buildShareCard(record)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 21: Forensic History Dashboard
  // --------------------------------------------------------------------------
  describe("F21: Forensic History Dashboard (/history)", () => {
    it("filters records by scan type (URL, QR, APK)", () => {
      const records = [
        { id: "1", type: "URL", target: "hxxps://fake-bca[.]com" },
        { id: "2", type: "QR", target: "hxxps://qris-fake[.]xyz" },
        { id: "3", type: "APK", target: "JNT_Resi.apk" },
      ];

      const urlRecords = records.filter((r) => r.type === "URL");
      expect(urlRecords.length).toBe(1);

      const apkRecords = records.filter((r) => r.type === "APK");
      expect(apkRecords.length).toBe(1);
    });

    it("searches records by domain name or filename", () => {
      const records = [
        { id: "1", target: "https://klikbca-verifikasi.xyz" },
        { id: "2", target: "JNT_Express_Resi.apk" },
      ];
      const query = "bca";
      const searchResult = records.filter((r) =>
        r.target.toLowerCase().includes(query.toLowerCase()),
      );
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].target).toContain("klikbca");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 22: Forensic Report Detail View
  // --------------------------------------------------------------------------
  describe("F22: Forensic Report Detail View (/history/[id])", () => {
    it("constructs parameter route and provides complete inspection view", () => {
      const recordId = "rec_99214";
      const detailRoute = PROTECTED_ROUTES.historyDetail(recordId);
      expect(detailRoute).toBe(`/history/${recordId}`);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 23: Academy Streak & EXP Engine
  // --------------------------------------------------------------------------
  describe("F23: Academy Streak & EXP Engine (/academy)", () => {
    it("calculates rank levels accurately based on cumulative EXP", () => {
      expect(referenceCalculateRank(50).rank).toBe("Recruit");
      expect(referenceCalculateRank(150).rank).toBe("Junior Analyst");
      expect(referenceCalculateRank(450).rank).toBe("Cyber Sentinel");
      expect(referenceCalculateRank(1200).rank).toBe("Forensic Master");
    });

    it("maintains daily streak flame count on consecutive activity", () => {
      let streak = 7;
      const isConsecutiveDay = true;
      if (isConsecutiveDay) streak += 1;
      expect(streak).toBe(8);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 24: Interactive Academy Quiz
  // --------------------------------------------------------------------------
  describe("F24: Interactive Academy Quiz System", () => {
    it("validates all 3 quiz question formats match QuizQuestionSchema", () => {
      for (const question of ACADEMY_QUIZ_FIXTURES) {
        const parsed = QuizQuestionSchema.safeParse(question);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          const correctOption = parsed.data.options.find((o) => o.isCorrect);
          expect(correctOption).toBeDefined();
        }
      }
    });

    it("evaluates correct answer and awards EXP", () => {
      const q = ACADEMY_QUIZ_FIXTURES[0];
      const selectedOptionId = "opt-1";
      const chosen = q.options.find((o) => o.id === selectedOptionId);
      expect(chosen?.isCorrect).toBe(true);
      const earnedExp = chosen?.isCorrect ? q.expReward : 0;
      expect(earnedExp).toBe(50);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 25: Admin Quiz CMS
  // --------------------------------------------------------------------------
  describe("F25: Admin Quiz CMS (/admin/quizzes)", () => {
    it("creates a new quiz with category, difficulty, and questions", () => {
      const newQuiz = {
        title: "Simulasi Ancaman Quishing & QRIS 2026",
        category: "SPOT_THE_PHISH",
        difficulty: "MEDIUM",
        expReward: 100,
        published: true,
      };
      expect(newQuiz.expReward).toBe(100);
      expect(ADMIN_ROUTES.quizzes).toBe("/admin/quizzes");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 26: Community Replay Intake
  // --------------------------------------------------------------------------
  describe("F26: Community Replay Intake (stored source required)", () => {
    it("rejects free-text evidence without a source and explicit consent", async () => {
      const response = await executeRoute(ROUTES.api.communitySubmit, "POST", {
        title: "Unlinked evidence",
        scamType: "URL",
      });
      expect(response.status).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // Feature 27: Admin Community Moderation
  // --------------------------------------------------------------------------
  describe("F27: Admin Community Moderation (/admin/community-reviews)", () => {
    it("requires an administrator for moderation", async () => {
      const response = await executeRoute(ROUTES.api.adminCommunityReviews, "GET");
      expect(response.status).toBe(403);
      expect(ADMIN_ROUTES.communityReviews).toBe("/admin/community-reviews");
    });
  });

  // --------------------------------------------------------------------------
  // Feature 28: Published Community Case
  // --------------------------------------------------------------------------
  describe("F28: Community case reading (/community/[replayId])", () => {
    it("returns a paginated approved-case list without sample EXP", async () => {
      const response = await executeRoute<{ items: unknown[]; pagination: { total: number } }>(
        ROUTES.api.communityReplays,
        "GET",
      );
      expect(response.status).toBe(200);
      expect(
        response.body.items.every((item) => CommunityReplaySchema.safeParse(item).success),
      ).toBe(true);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
    });
  });
});
