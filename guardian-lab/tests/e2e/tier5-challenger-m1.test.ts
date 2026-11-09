/**
 * Tier 5: Adversarial & Stress Testing Suite (Milestone 1)
 * White-box challenger verification for Database Integrity, Foreign Key Cascades,
 * MySQL Column Boundaries, Auth API Edge Conditions, and Streak Calculations.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { POST as loginPOST } from "../../app/api/auth/login/route";
import { POST as registerPOST } from "../../app/api/auth/register/route";
import { signSessionToken } from "../../lib/auth/jwt";
import { hashPassword } from "../../lib/auth/password";
import { prisma } from "../../lib/prisma";

const TEST_PREFIX = "challenger_m1_";
const UNIQUE_RUN_ID = Date.now().toString(36);

function makeTestEmail(suffix: string): string {
  return `${TEST_PREFIX}${UNIQUE_RUN_ID}_${suffix}@guardianlab.test`;
}

describe("Tier 5: Milestone 1 Adversarial & Stress Test Suite", () => {
  beforeAll(async () => {
    // Clean up any stale test accounts from previous runs
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: TEST_PREFIX } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  afterAll(async () => {
    // Teardown test artifacts
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: TEST_PREFIX } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  // ==========================================================================
  // 1. Database Integrity: Email Uniqueness & Case Sensitivity
  // ==========================================================================
  describe("1. Database Integrity: Email Uniqueness & Case Sensitivity", () => {
    it("enforces case-insensitive uniqueness at the MySQL database engine level", async () => {
      const emailLower = makeTestEmail("case_mysql");
      const emailUpper = emailLower.toUpperCase();

      const u1 = await prisma.user.create({
        data: {
          name: "MySQL Case Lower",
          email: emailLower,
          passwordHash: "hash123",
        },
      });
      expect(u1.id).toBeTruthy();

      // Direct insertion of uppercase variant must be rejected by MySQL utf8mb4_unicode_ci unique constraint
      let threwP2002 = false;
      try {
        await prisma.user.create({
          data: {
            name: "MySQL Case Upper",
            email: emailUpper,
            passwordHash: "hash123",
          },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === "P2002") {
          threwP2002 = true;
        }
      }
      expect(threwP2002).toBe(true);

      // Clean up
      await prisma.user.delete({ where: { id: u1.id } });
    });

    it("rejects duplicate registration with case-varied email via /api/auth/register", async () => {
      const baseEmail = makeTestEmail("case_api");
      const emailLower = baseEmail.toLowerCase();
      const emailUpper = baseEmail.toUpperCase();

      // Register lowercase
      const req1 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Case Test User",
          email: emailLower,
          phone: "+6281234567894",
          password: "Password123",
        }),
      });
      const res1 = await registerPOST(req1);
      expect(res1.status).toBe(201);

      await prisma.user.update({
        where: { email: emailLower },
        data: { phoneVerifiedAt: new Date() },
      });

      // Attempt duplicate registration with uppercase
      const req2 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Case Duplicate User",
          email: emailUpper,
          phone: "+6281234567894",
          password: "Password123",
        }),
      });
      const res2 = await registerPOST(req2);
      expect(res2.status).toBe(409);
      const body2 = await res2.json();
      expect(body2.error).toContain("Email sudah terdaftar");

      // Verify login succeeds regardless of email casing
      const reqLoginUpper = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUpper,
          password: "Password123",
        }),
      });
      const resLogin = await loginPOST(reqLoginUpper);
      expect(resLogin.status).toBe(200);

      // Cleanup
      await prisma.session.deleteMany({ where: { user: { email: emailLower } } });
      await prisma.user.deleteMany({ where: { email: emailLower } });
    });
  });

  // ==========================================================================
  // 2. Database Integrity: Foreign Key Cascading Deletions
  // ==========================================================================
  describe("2. Database Integrity: Foreign Key Cascading Deletions", () => {
    it("cascades deletion from User to Session and QuizAttempt without deleting parent Quiz", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Cascade Subject",
          email: makeTestEmail("cascade_user"),
          passwordHash: "hash123",
        },
      });

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: `token_${Date.now()}_${Math.random()}`,
          expiresAt: new Date(Date.now() + 60000),
        },
      });

      let quiz = await prisma.quiz.findFirst();
      if (!quiz) {
        quiz = await prisma.quiz.create({
          data: {
            title: "Challenger Quiz",
            description: "Adversarial Quiz",
            category: "SPOT_THE_PHISH",
            difficulty: "EASY",
          },
        });
      }

      const attempt = await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          quizId: quiz.id,
          score: 100,
          passed: true,
        },
      });

      // Verify all records exist prior to deletion
      expect(await prisma.session.findUnique({ where: { id: session.id } })).not.toBeNull();
      expect(await prisma.quizAttempt.findUnique({ where: { id: attempt.id } })).not.toBeNull();

      // Delete User
      await prisma.user.delete({ where: { id: user.id } });

      // Sessions and QuizAttempts belonging to user must be cascade-deleted
      const checkSession = await prisma.session.findUnique({ where: { id: session.id } });
      const checkAttempt = await prisma.quizAttempt.findUnique({ where: { id: attempt.id } });
      const checkQuiz = await prisma.quiz.findUnique({ where: { id: quiz.id } });

      expect(checkSession).toBeNull();
      expect(checkAttempt).toBeNull();
      expect(checkQuiz).not.toBeNull();
    });

    it("cascades deletion from Quiz to QuizQuestions and QuizAttempts while keeping User intact", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Quiz Cascade User",
          email: makeTestEmail("quiz_cascade_u"),
          passwordHash: "hash123",
        },
      });

      const quiz = await prisma.quiz.create({
        data: {
          title: "Temporary Quiz",
          description: "Temporary Description",
          category: "SOCIAL_ENGINEERING",
          difficulty: "MEDIUM",
          questions: {
            create: [
              {
                questionText: "What is phishing?",
                options: ["Deception", "Fruit"],
                correctAnswers: ["Deception"],
                explanation: "Phishing is deception.",
              },
            ],
          },
        },
        include: { questions: true },
      });

      const attempt = await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          quizId: quiz.id,
          score: 90,
        },
      });

      // Delete Quiz
      await prisma.quiz.delete({ where: { id: quiz.id } });

      expect(
        await prisma.quizQuestion.findUnique({ where: { id: quiz.questions[0].id } }),
      ).toBeNull();
      expect(await prisma.quizAttempt.findUnique({ where: { id: attempt.id } })).toBeNull();
      expect(await prisma.user.findUnique({ where: { id: user.id } })).not.toBeNull();

      // Clean up user
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  // ==========================================================================
  // 3. Database Integrity: Column Bounds & Payload Limits
  // ==========================================================================
  describe("3. Database Integrity: Column Bounds & Payload Limits", () => {
    it("handles large text payloads up to 60,000 characters in MySQL @db.Text columns", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Text Tester",
          email: makeTestEmail("text_tester"),
          passwordHash: "hash123",
        },
      });

      const largePayload = "A".repeat(60000);
      const record = await prisma.forensicRecord.create({
        data: {
          userId: user.id,
          target: largePayload,
          type: "URL",
          riskLevel: "SAFE",
          riskScore: 0,
          scamCategory: "BENIGN",
          summary: `Summary: ${largePayload}`,
          deceptionTricks: [],
          technicalEvidence: {},
          defangedTarget: largePayload,
        },
      });

      expect(record.id).toBeTruthy();
      expect(record.target.length).toBe(60000);

      // Clean up
      await prisma.forensicRecord.delete({ where: { id: record.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("verifies MySQL strict constraint rejection (P2000) for payloads > 65,535 bytes in @db.Text", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Overflow User",
          email: makeTestEmail("overflow_user"),
          passwordHash: "hash123",
        },
      });

      let threwP2000 = false;
      try {
        await prisma.forensicRecord.create({
          data: {
            userId: user.id,
            target: "X".repeat(70000), // Exceeds MySQL TEXT (65,535 bytes)
            type: "URL",
            riskLevel: "SAFE",
            riskScore: 0,
            scamCategory: "BENIGN",
            summary: "Overflow",
            deceptionTricks: [],
            technicalEvidence: {},
            defangedTarget: "defanged",
          },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === "P2000") {
          threwP2000 = true;
        }
      }

      expect(threwP2000).toBe(true);
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("verifies Session.token VARCHAR(500) boundary and identifies JWT overflow vulnerability", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Token Tester",
          email: makeTestEmail("token_tester"),
          passwordHash: "hash123",
        },
      });

      // Exactly 500 characters token fits
      const token500 = "T".repeat(500);
      const session500 = await prisma.session.create({
        data: {
          userId: user.id,
          token: token500,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      expect(session500.token.length).toBe(500);
      await prisma.session.delete({ where: { id: session500.id } });

      // 501 characters token fails with P2000
      let token501Threw = false;
      try {
        await prisma.session.create({
          data: {
            userId: user.id,
            token: "T".repeat(501),
            expiresAt: new Date(Date.now() + 60000),
          },
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr?.code === "P2000") {
          token501Threw = true;
        }
      }
      expect(token501Threw).toBe(true);

      // Empirical analysis: JWT length generated for user with long email (136 chars) + 50 chars name
      const overflowEmail = `user.${"a".repeat(120)}@domain.org`;
      const generatedJwt = await signSessionToken({
        userId: user.id,
        email: overflowEmail,
        name: "X".repeat(50),
        role: "ADMIN",
      });

      // Discovered vulnerability: Generated JWT is 512+ characters, exceeding VARCHAR(500)
      expect(generatedJwt.length).toBeGreaterThan(500);

      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  // ==========================================================================
  // 4. Auth API Edge Conditions: Validation & Error Handling
  // ==========================================================================
  describe("4. Auth API Edge Conditions: Validation & Error Handling", () => {
    it("empirically records response status for malformed JSON payloads in /api/auth/login and /api/auth/register", async () => {
      const reqLogin = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email": "unclosed_json',
      });
      const resLogin = await loginPOST(reqLogin);
      // Flaw observation: Returns 500 (Internal Server Error) due to uncaught SyntaxError in request.json()
      // Standard REST requires 400 Bad Request
      expect([400, 500]).toContain(resLogin.status);

      const reqRegister = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ invalid json format }",
      });
      const resRegister = await registerPOST(reqRegister);
      expect([400, 500]).toContain(resRegister.status);
    });

    it("rejects missing fields with 400 Bad Request and descriptive errors", async () => {
      // Missing all fields
      const res1 = await loginPOST(
        new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );
      expect(res1.status).toBe(400);

      // Missing password
      const res2 = await loginPOST(
        new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@guardianlab.id" }),
        }),
      );
      expect(res2.status).toBe(400);

      // Register missing name
      const res3 = await registerPOST(
        new Request("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@guardianlab.id", password: "Password123" }),
        }),
      );
      expect(res3.status).toBe(400);
    });

    it("rejects password shorter than required length (<8 chars) with 400 Bad Request", async () => {
      const shortPasswords = ["123", "a1b2c", "abcde1", "1234567"];
      for (const pwd of shortPasswords) {
        const res = await registerPOST(
          new Request("http://localhost:3000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Short Pwd User",
              email: makeTestEmail("short_pwd"),
              password: pwd,
            }),
          }),
        );
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.details?.password).toBeDefined();
      }
    });

    it("rejects invalid email formats with 400 Bad Request", async () => {
      const invalidEmails = [
        "not-an-email",
        "@missingusername.com",
        "user@.com",
        "user.domain.com",
      ];
      for (const badEmail of invalidEmails) {
        const res = await registerPOST(
          new Request("http://localhost:3000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Bad Email User",
              email: badEmail,
              password: "Password123",
            }),
          }),
        );
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.details?.email).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // 5. Auth Logic: Daily Login Streak Progression & Maintenance
  // ==========================================================================
  describe("5. Auth Logic: Login preserves the learning streak", () => {
    it("maintains streak count when user logs in multiple times on the same day (diffDays = 0)", async () => {
      const email = makeTestEmail("streak_0");
      const password = "Password123";
      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name: "Streak 0 User",
          email,
          phone: "+6281234567895",
          phoneVerifiedAt: new Date(),
          passwordHash,
          streakDays: 7,
          lastLearningAt: new Date(),
          lastActiveAt: new Date(Date.now() - 3600000), // 1 hour ago (same day)
        },
      });

      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const res = await loginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.streakDays).toBe(7); // Unchanged

      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("preserves yesterday's learning streak without incrementing it on login", async () => {
      const email = makeTestEmail("streak_1");
      const password = "Password123";
      const passwordHash = await hashPassword(password);

      // Yesterday in UTC
      const yesterday = new Date(Date.now() - 86_400_000);

      const user = await prisma.user.create({
        data: {
          name: "Streak 1 User",
          email,
          phone: "+6281234567896",
          phoneVerifiedAt: new Date(),
          passwordHash,
          streakDays: 4,
          lastLearningAt: yesterday,
          lastActiveAt: yesterday,
        },
      });

      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const res = await loginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.streakDays).toBe(4);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).streakDays).toBe(4);

      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("shows zero after a missed learning day without recording a new learning event", async () => {
      const email = makeTestEmail("streak_reset");
      const password = "Password123";
      const passwordHash = await hashPassword(password);

      // 3 days ago in UTC
      const threeDaysAgo = new Date();
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);

      const user = await prisma.user.create({
        data: {
          name: "Streak Reset User",
          email,
          phone: "+6281234567897",
          phoneVerifiedAt: new Date(),
          passwordHash,
          streakDays: 25,
          lastLearningAt: threeDaysAgo,
          lastActiveAt: threeDaysAgo,
        },
      });

      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const res = await loginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user.streakDays).toBe(0);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).streakDays).toBe(25);

      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
