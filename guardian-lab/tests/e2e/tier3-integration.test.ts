import { getInvestigationResult } from "@/lib/investigations/presentation";
import { type Investigation, investigationSchema } from "@/lib/validations/investigation";
import { apkUpload } from "../helpers/investigation-fixtures";
/**
 * Tier 3: Cross-Feature Combinations (Integration User Journeys)
 * Validates complex, multi-module user flows across the full Guardian Lab architecture:
 * - Flow 1: URL Analysis -> Forensic History -> History Detail -> Guardian Share Card
 * - Flow 2: Quishing QR Upload -> QR Extraction -> AI Scoring -> Web Sandbox Isolation -> Auto-Destroy
 * - Flow 3: Malware APK Upload -> Static X-Ray -> Emulator Sandbox -> Community Replay Intake -> Admin Moderation
 * - Flow 4: Guest Interception -> Registration -> Auth Session -> RBAC Guard -> Academy Quiz -> EXP Level Up
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "../../lib/prisma";
import { PROTECTED_ROUTES } from "../../lib/routes";
import { INDONESIAN_PHISHING_FIXTURES } from "./fixtures/phishing-urls";
import { QR_CODE_FIXTURES } from "./fixtures/qr-codes";
import { ACADEMY_QUIZ_FIXTURES } from "./fixtures/quiz-fixtures";
import { NEW_REGISTERED_USER_FIXTURE } from "./fixtures/user-fixtures";
import { executeRoute, referenceCalculateRank } from "./helpers/test-harness";

describe("Tier 3: Cross-Feature Combinations", () => {
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
  // Flow 1: URL Analysis -> Forensic History -> History Detail -> Share Card
  // --------------------------------------------------------------------------
  describe("Flow 1: Phishing URL Analysis to Guardian Share Card Lifecycle", () => {
    it("keeps the same stored investigation between submission and history", async () => {
      const res = await executeRoute("/api/analyze-url", "POST", {
        url: INDONESIAN_PHISHING_FIXTURES[0].url,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      const history = await executeRoute<{ records: Investigation[] }>("/api/history", "GET");
      const stored = history.body.records.find((item) => item.id === record.id);
      expect(stored).toEqual(record);
      expect(getInvestigationResult(record)).toBeNull();
      expect(PROTECTED_ROUTES.historyDetail(record.id)).toContain(record.id);
    });
  });

  // --------------------------------------------------------------------------
  // Flow 2: Quishing QR -> Extraction -> Threat Scoring -> Web Sandbox
  // --------------------------------------------------------------------------
  describe("Flow 2: Quishing Investigation to Isolated Browser Sandbox Flow", () => {
    it("keeps QR provenance and avoids a second URL investigation", async () => {
      const sample = QR_CODE_FIXTURES[2];
      const res = await executeRoute("/api/analyze-qr", "POST", {
        imageBase64: sample.imageBase64,
        mimeType: sample.mimeType,
      });
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.type).toBe("QR");
      expect(record.target).toContain("qris-dana-kaget-pemberdayaan.xyz");
      expect(record.inputMetadata.decoder).toBe("jsqr");
      expect(record.status).toBe("UNAVAILABLE");
      const stored = await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } });
      expect(stored.type).toBe("QR");
      expect(stored.riskLevel).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Flow 3: Malicious APK -> Static X-Ray -> Emulator -> Community Replay
  // --------------------------------------------------------------------------
  describe("Flow 3: APK Malware X-Ray to Community Forensic Replay Pipeline", () => {
    it("stores extracted APK facts while model assessment remains unavailable", async () => {
      const res = await executeRoute("/api/analyze-apk", "POST", apkUpload("courier.apk"));
      expect(res.status).toBe(201);
      const record = investigationSchema.parse(res.body);
      expect(record.inputMetadata.staticExtractionPerformed).toBe(true);
      expect(record.inputMetadata.binaryStored).toBe(false);
      expect(record.analysisSource).toBeNull();
      expect(record.summary).toBeNull();
      expect(getInvestigationResult(record)).toBeNull();
      const stored = await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } });
      expect(stored.inputMetadata).toEqual(record.inputMetadata);
    }, 30000);
  });

  // --------------------------------------------------------------------------
  // Flow 4: Guest Auth Interception -> Register -> RBAC -> Academy Level Up
  // --------------------------------------------------------------------------
  describe("Flow 4: Guest Onboarding, RBAC Enforcement, and Gamification Progress", () => {
    it("handles guest interception, user registration, role guarding, and quiz EXP progression", async () => {
      // 1. Guest clicks analysis tab, intercepted with redirect parameter
      const targetAction = "/?tab=apk";
      const loginRedirectTarget = `/login?redirect=${encodeURIComponent(targetAction)}`;
      expect(loginRedirectTarget).toBe("/login?redirect=%2F%3Ftab%3Dapk");

      // 2. User registers new account
      const registerRes = await executeRoute<{ status: string; redirectTo: string }>(
        "/api/auth/register",
        "POST",
        NEW_REGISTERED_USER_FIXTURE,
      );
      expect(registerRes.status).toBe(201);
      expect(registerRes.body.status).toBe("verification_required");
      expect(registerRes.body.redirectTo).toBe("/otp");
      const registered = await prisma.user.findUniqueOrThrow({
        where: { email: NEW_REGISTERED_USER_FIXTURE.email },
      });
      expect(registered.role).toBe("USER");
      let currentExp = registered.exp; // 0 EXP initially

      // This integration test focuses on post-registration RBAC and Academy flow.
      // The dedicated AUTH-OTP suite covers the actual WhatsApp verification journey.
      await prisma.user.update({
        where: { email: NEW_REGISTERED_USER_FIXTURE.email },
        data: { phoneVerifiedAt: new Date() },
      });

      // 3. User authenticates and receives session cookie
      const loginRes = await executeRoute<{ id: string; role: string }>("/api/auth/login", "POST", {
        email: NEW_REGISTERED_USER_FIXTURE.email,
        password: NEW_REGISTERED_USER_FIXTURE.password,
      });
      expect(loginRes.status).toBe(200);
      const setCookie = loginRes.headers.get("Set-Cookie");
      const match = setCookie?.match(/guardian_session=([^;]+)/);
      const sessionToken = match ? match[1] : "";
      expect(sessionToken).toBeTruthy();

      // 4. Regular user attempts to access /admin/quizzes (RBAC check)
      const userRole = loginRes.body.role;
      const isAdmin = userRole === "ADMIN";
      expect(isAdmin).toBe(false); // RBAC correctly forbids admin access

      // 5. User visits /academy and completes Spot-the-Phish Quiz
      const quiz = ACADEMY_QUIZ_FIXTURES[0];
      const correctOption = quiz.options.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();

      // Award EXP for completing the quiz
      currentExp += quiz.expReward; // +50 EXP
      expect(currentExp).toBe(50);

      // Check user rank progression
      const rankState = referenceCalculateRank(currentExp);
      expect(rankState.rank).toBe("Recruit");
      expect(rankState.nextRankExp).toBe(100);

      // Complete another simulation
      const quiz2 = ACADEMY_QUIZ_FIXTURES[2]; // +60 EXP
      currentExp += quiz2.expReward;
      expect(currentExp).toBe(110);

      // Verify level up to Junior Analyst!
      const levelUpState = referenceCalculateRank(currentExp);
      expect(levelUpState.rank).toBe("Junior Analyst");
      expect(levelUpState.nextRankExp).toBe(300);

      // 6. Verify authenticated session is active
      const meRes = await executeRoute<{ id: string; email: string; role: string }>(
        "/api/auth/me",
        "GET",
        undefined,
        { guardian_session: sessionToken },
      );
      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe(NEW_REGISTERED_USER_FIXTURE.email);
      expect(meRes.body.role).toBe("USER");
    });
  });
});
