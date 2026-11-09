import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { GET as detail } from "@/app/api/academy/quizzes/[id]/route";
import { POST as submit } from "@/app/api/academy/submit-quiz/route";
import { DELETE as archive, PUT as update } from "@/app/api/admin/quizzes/[id]/route";
import { POST as create } from "@/app/api/admin/quizzes/route";
import { academyProgress } from "@/lib/academy/progress";
import { learningStreak } from "@/lib/academy/streak";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { type QuizInput, quizDetailSchema, quizResultSchema } from "@/lib/validations/academy";

const users: string[] = [];
let userToken = "",
  adminToken = "",
  quizId = "",
  revision = "",
  questionId = "";
const input: QuizInput = {
  title: "Latihan keamanan contoh",
  description: "Materi pengujian pilihan jamak.",
  category: "SPOT_THE_PHISH",
  difficulty: "EASY",
  expReward: 70,
  published: true,
  questions: [
    {
      questionText: "Pilih dua langkah yang sesuai.",
      questionType: "MULTIPLE_CHOICE",
      options: [
        { id: "a", text: "Periksa domain" },
        { id: "b", text: "Rahasiakan OTP" },
        { id: "c", text: "Bagikan kata sandi" },
      ],
      correctAnswers: ["a", "b"],
      explanation: "Periksa domain dan jangan bagikan kode rahasia.",
    },
  ],
};
function req(path: string, method: string, token: string, data?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}`, "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
}
const context = () => ({ params: Promise.resolve({ id: quizId }) });
const answer = (selected: string[], id = randomUUID()) => ({
  quizId,
  revision,
  submissionId: id,
  answers: { [questionId]: selected },
});
beforeAll(async () => {
  for (const role of ["USER", "ADMIN"] as const) {
    const user = await prisma.user.create({
      data: {
        name: "Academy test",
        email: `academy-${randomUUID()}@example.test`,
        passwordHash: "test-unused",
        role,
        phone: `+628140000000${role === "USER" ? "1" : "2"}`,
        phoneVerifiedAt: new Date(),
      },
    });
    users.push(user.id);
    const token = await createSessionToken(user);
    if (role === "USER") userToken = token;
    else adminToken = token;
  }
  const response = await create(req("/api/admin/quizzes", "POST", adminToken, input));
  expect(response.status).toBe(201);
  const data = await response.json();
  quizId = data.id;
  revision = data.updatedAt;
  questionId = data.questions[0].id;
});
afterAll(async () => {
  if (quizId) await prisma.quiz.deleteMany({ where: { id: quizId } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
});
describe("Academy server grading and persisted progress", () => {
  it("does not expose answer keys, explanations, or isCorrect flags", async () => {
    const r = await detail(req("/quiz", "GET", userToken), context());
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text).not.toContain("correctAnswers");
    expect(text).not.toContain("explanation");
    expect(text).not.toContain("isCorrect");
    expect(quizDetailSchema.parse(JSON.parse(text)).questions[0].multiple).toBe(true);
  });
  it("requires the exact multiple-answer set and awards zero EXP for failure", async () => {
    const r = await submit(req("/submit", "POST", userToken, answer(["a"])));
    const data = quizResultSchema.parse(await r.json());
    expect(data.score).toBe(0);
    expect(data.expEarned).toBe(0);
    expect(data.feedback[0].explanation).toContain("Periksa domain");
  });
  it("awards EXP only once even for concurrent successful submissions", async () => {
    const results = await Promise.all([
      submit(req("/submit", "POST", userToken, answer(["a", "b"]))),
      submit(req("/submit", "POST", userToken, answer(["b", "a"]))),
    ]);
    const data = await Promise.all(
      results.map(async (r) => {
        expect(r.status).toBe(200);
        return quizResultSchema.parse(await r.json());
      }),
    );
    expect(data.map((r) => r.expEarned).sort()).toEqual([0, 70]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[0] } })).exp).toBe(70);
  });
  it("returns the same result for an idempotent retry and rejects changing its payload", async () => {
    const payload = answer(["a", "b"]);
    const before = await prisma.quizAttempt.count({ where: { userId: users[0] } });
    const a = await submit(req("/submit", "POST", userToken, payload));
    const b = await submit(req("/submit", "POST", userToken, payload));
    expect(await a.json()).toEqual(await b.json());
    expect(await prisma.quizAttempt.count({ where: { userId: users[0] } })).toBe(before + 1);
    const c = await submit(
      req("/submit", "POST", userToken, { ...payload, answers: { [questionId]: ["c"] } }),
    );
    expect(c.status).toBe(409);
  });
  it("rejects missing, duplicate, unknown options and extra questions", async () => {
    for (const answers of [
      {},
      { [questionId]: ["a", "a"] },
      { [questionId]: ["unknown"] },
      { [questionId]: ["a", "b"], fake: ["a"] },
    ]) {
      const r = await submit(
        req("/submit", "POST", userToken, {
          quizId,
          revision,
          submissionId: randomUUID(),
          answers,
        }),
      );
      expect(r.status).toBe(400);
    }
  });
  it("rejects an outdated quiz revision without awarding EXP", async () => {
    const r = await submit(
      req("/submit", "POST", userToken, {
        ...answer(["a", "b"]),
        revision: "2000-01-01T00:00:00.000Z",
      }),
    );
    expect(r.status).toBe(409);
  });
  it("persists real completions, badge, streak, and recent attempts", async () => {
    const p = await academyProgress(users[0]);
    expect(p.exp).toBe(70);
    expect(p.completed).toBe(1);
    expect(p.streakDays).toBe(1);
    expect(p.badges.some((b) => b.title === "Langkah Pertama")).toBe(true);
    expect(p.recentAttempts.length).toBeGreaterThan(0);
    expect((await academyProgress(users[1])).exp).toBe(0);
  });
  it("validates admin content, rejects user authoring, and handles edit conflicts", async () => {
    expect((await create(req("/admin", "POST", userToken, input))).status).toBe(403);
    expect(
      (await create(req("/admin", "POST", adminToken, { ...input, questions: [] }))).status,
    ).toBe(400);
    expect(
      (
        await update(
          req("/admin", "PUT", adminToken, { ...input, revision: "2000-01-01T00:00:00.000Z" }),
          context(),
        )
      ).status,
    ).toBe(409);
  });
  it("archives without destroying attempts or EXP, and blocks further submissions", async () => {
    const before = await prisma.quizAttempt.count({ where: { quizId } });
    expect((await archive(req("/admin", "DELETE", adminToken), context())).status).toBe(200);
    expect((await detail(req("/quiz", "GET", userToken), context())).status).toBe(404);
    expect((await submit(req("/submit", "POST", userToken, answer(["a", "b"])))).status).toBe(404);
    expect(await prisma.quizAttempt.count({ where: { quizId } })).toBe(before);
  });
});
describe("WIB calendar learning streak", () => {
  it("starts at one, counts adjacent days, and does not increment twice on the same day", () => {
    const now = new Date("2026-11-02T17:01:00Z");
    expect(learningStreak(0, null, now, true)).toBe(1);
    expect(learningStreak(3, new Date("2026-11-02T16:59:00Z"), now, true)).toBe(4);
    expect(learningStreak(3, new Date("2026-11-02T17:00:00Z"), now, true)).toBe(3);
  });
  it("resets when a calendar day was missed and shows zero without learning history", () => {
    const now = new Date("2026-11-03T12:00:00Z");
    expect(learningStreak(7, new Date("2026-11-01T12:00:00Z"), now)).toBe(0);
    expect(learningStreak(7, null, now)).toBe(0);
    expect(learningStreak(7, new Date("2026-11-01T12:00:00Z"), now, true)).toBe(1);
  });
});
