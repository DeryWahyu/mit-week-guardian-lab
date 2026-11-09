import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomInt, randomUUID } from "node:crypto";
import { POST as createQuiz } from "@/app/api/admin/quizzes/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import type { QuizInput } from "@/lib/validations/academy";

let adminId = "";
let token = "";
beforeAll(async () => {
  const admin = await prisma.user.create({
    data: {
      name: "Audit admin",
      email: `audit-${randomUUID()}@example.test`,
      passwordHash: "unused",
      role: "ADMIN",
      phone: `+62812${randomInt(10000000, 99999999)}`,
      phoneVerifiedAt: new Date(),
    },
  });
  adminId = admin.id;
  token = await createSessionToken(admin);
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: adminId } });
});

const request = (path: string, data: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: `${SESSION_COOKIE_NAME}=${token}` },
    body: JSON.stringify(data),
  });

describe("System audit regressions", () => {
  it("preserves question order after sanitization and validation", async () => {
    const input: QuizInput = {
      title: "Audit question ordering",
      description: "Controlled three-question ordering regression.",
      category: "SPOT_THE_PHISH",
      difficulty: "EASY",
      expReward: 10,
      published: false,
      questions: [1, 2, 3].map((number) => ({
        questionText: `Question number ${number} in the intended order.`,
        questionType: "MULTIPLE_CHOICE",
        options: [
          { id: "a", text: "First option" },
          { id: "b", text: "Second option" },
        ],
        correctAnswers: ["a"],
        explanation: "Keep the intended question sequence.",
      })),
    };
    const response = await createQuiz(request(API_ROUTES.adminQuizzes, input));
    expect(response.status).toBe(201);
    const result = await response.json();
    try {
      const questions = await prisma.quizQuestion.findMany({
        where: { quizId: result.id },
        orderBy: { order: "asc" },
      });
      expect(questions.map((q) => q.order)).toEqual([1, 2, 3]);
      expect(questions.map((q) => q.questionText)).toEqual(
        input.questions.map((q) => q.questionText),
      );
    } finally {
      await prisma.quiz.delete({ where: { id: result.id } });
    }
  });
  it.each([`${"a".repeat(71)}1x`, `${"é".repeat(35)}a1x`])(
    "rejects passwords exceeding bcrypt's byte limit before creating an account",
    async (password) => {
      const email = `long-password-${randomUUID()}@example.test`;
      const result = await register(
        request(API_ROUTES.authRegister, {
          name: "Audit member",
          email,
          phone: "081234567890",
          password,
        }),
      );
      expect(result.status).toBe(400);
      expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
    },
  );

  it("preserves 72-byte passwords and rejects suffix aliases at verification", async () => {
    const password = `${"é".repeat(35)}a1`;
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword(`${password}x`, hash)).toBe(false);
    expect(await verifyPassword(`${password}y`, hash)).toBe(false);
  });

  it.each([login, register])(
    "bounds streamed auth JSON even without Content-Length",
    async (handler) => {
      const result = await handler(request(API_ROUTES.authLogin, { padding: "x".repeat(17000) }));
      expect(result.status).toBe(413);
    },
  );

  it("does not publish quiz fields that become empty after sanitization", async () => {
    const input: QuizInput = {
      title: "Audit sanitization test",
      description: "Controlled content for regression testing.",
      category: "SPOT_THE_PHISH",
      difficulty: "EASY",
      expReward: 10,
      published: true,
      questions: [
        {
          questionText: "Which choice is appropriate?",
          questionType: "MULTIPLE_CHOICE",
          options: [
            { id: "a", text: "\u202e\u202d" },
            { id: "b", text: "Visible answer" },
          ],
          correctAnswers: ["a"],
          explanation: "The correct answer must remain readable.",
        },
      ],
    };
    const before = await prisma.quiz.count();
    const result = await createQuiz(request(API_ROUTES.adminQuizzes, input));
    expect(result.status).toBe(400);
    expect(await prisma.quiz.count()).toBe(before);
  });
});
