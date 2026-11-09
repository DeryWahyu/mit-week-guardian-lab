import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { POST as attempt } from "@/app/api/community/replays/[id]/attempt/route";
import { GET as challenge } from "@/app/api/community/replays/[id]/challenge/route";
import { academyProgress } from "@/lib/academy/progress";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { buildChallenge } from "@/lib/community/challenge-questions";
import { buildCommunityReport } from "@/lib/community/report";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import { quizResultSchema } from "@/lib/validations/academy";
import { communityChallengeSchema } from "@/lib/validations/community-challenge";

const users: string[] = [];
let caseId = "",
  token = "",
  revision = "";
let answers: Record<string, string> = {};
const context = () => ({ params: Promise.resolve({ id: caseId }) });
const req = (method = "GET", body?: unknown, authenticated = true) =>
  new Request("http://localhost/api/community/test", {
    method,
    headers: {
      ...(authenticated ? { cookie: `${SESSION_COOKIE_NAME}=${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const submission = (id = randomUUID()) => ({ revision, answers, submissionId: id });
beforeAll(async () => {
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({
      data: {
        name: "Case fixture",
        email: `case-${randomUUID()}@example.test`,
        passwordHash: "unused",
        phone: `+628160000000${i}`,
        phoneVerifiedAt: new Date(),
      },
    });
    users.push(user.id);
    if (i === 1) token = await createSessionToken(user);
  }
  const source = await prisma.forensicRecord.create({
    data: {
      userId: users[0],
      type: "URL",
      target: "https://example.test/",
      defangedTarget: "hxxps://example[.]test/",
      status: "COMPLETED",
      riskLevel: "PHISHING",
      riskScore: 90,
      scamCategory: "Fictional case fixture",
      summary: "A fictional reviewed case for testing.",
      deceptionTricks: ["Meminta OTP"],
      technicalEvidence: { entropy: 3 },
      analysisSource: "TEST_WORKER",
      modelVersion: "test-v1",
      finishedAt: new Date(),
    },
  });
  const report = buildCommunityReport(serializeInvestigation(source));
  if (!report) throw new Error("Missing fixture report");
  const record = await prisma.communityReplay.create({
    data: {
      userId: users[0],
      sourceRecordId: source.id,
      consentedAt: new Date(),
      status: "APPROVED",
      title: "Challenge fixture",
      description: "Fictional test",
      scamType: "PHISHING",
      sanitizedData: report,
      reviewedAt: new Date(),
    },
  });
  caseId = record.id;
  const built = buildChallenge(caseId, record.updatedAt, report);
  revision = built.revision;
  answers = Object.fromEntries(built.questions.map((q) => [q.id, q.correctId]));
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: users } } });
});
describe("Reviewed community case practice", () => {
  it("requires authentication and never exposes keys or explanations before submission", async () => {
    expect((await challenge(req("GET", undefined, false), context())).status).toBe(401);
    const response = await challenge(req(), context());
    const text = await response.text();
    for (const key of ["correctId", "correctAnswers", "explanation"])
      expect(text).not.toContain(key);
    expect(communityChallengeSchema.parse(JSON.parse(text)).questions.length).toBe(3);
    expect(await prisma.replayAttempt.count({ where: { replayId: caseId } })).toBe(0);
  });
  it("rejects missing, foreign, extra answers and stale revision", async () => {
    for (const payload of [
      { ...submission(), answers: {} },
      { ...submission(), answers: { ...answers, extra: "wrong" } },
      { ...submission(), answers: { ...answers, risk: "foreign" } },
    ])
      expect((await attempt(req("POST", payload), context())).status).toBe(400);
    expect(
      (await attempt(req("POST", { ...submission(), revision: "a".repeat(64) }), context())).status,
    ).toBe(409);
  });
  it("awards a single reward under simultaneous successful submissions", async () => {
    const responses = await Promise.all([
      attempt(req("POST", submission()), context()),
      attempt(req("POST", submission()), context()),
    ]);
    const results = await Promise.all(
      responses.map(async (response) => {
        expect(response.status).toBe(200);
        return quizResultSchema.parse(await response.json());
      }),
    );
    expect(results.map((r) => r.expEarned).sort()).toEqual([0, 30]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: users[1] } })).exp).toBe(30);
  });
  it("retries without another attempt and rejects UUID reuse with different answers", async () => {
    const payload = submission();
    const before = await prisma.replayAttempt.count({ where: { replayId: caseId } });
    const a = await attempt(req("POST", payload), context());
    const b = await attempt(req("POST", payload), context());
    expect(await a.json()).toEqual(await b.json());
    expect(await prisma.replayAttempt.count({ where: { replayId: caseId } })).toBe(before + 1);
    expect(
      (
        await attempt(
          req("POST", { ...payload, answers: { ...answers, risk: "other" } }),
          context(),
        )
      ).status,
    ).toBe(409);
  });
  it("connects case progress and badge to Academy without leaking to another account", async () => {
    const progress = await academyProgress(users[1]);
    expect(progress.exp).toBe(30);
    expect(progress.casesSolved).toBe(1);
    expect(progress.streakDays).toBe(1);
    expect(progress.recentAttempts.some((a) => a.title.startsWith("Kasus:"))).toBe(true);
    expect(progress.badges.some((b) => b.title === "Pembaca Bukti")).toBe(true);
    expect((await academyProgress(users[0])).exp).toBe(0);
  });
  it("blocks unapproved cases and cross-origin submissions", async () => {
    const foreign = req("POST", submission());
    foreign.headers.set("Origin", "https://foreign.test");
    expect((await attempt(foreign, context())).status).toBe(403);
    await prisma.communityReplay.update({
      where: { id: caseId },
      data: { status: "PENDING_REVIEW" },
    });
    expect((await challenge(req(), context())).status).toBe(404);
    expect((await attempt(req("POST", submission()), context())).status).toBe(404);
  });
});
