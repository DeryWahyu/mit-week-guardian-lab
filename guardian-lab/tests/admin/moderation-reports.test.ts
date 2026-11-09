import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Prisma } from "@prisma/client";
import { PUT as review } from "@/app/api/admin/community-reviews/[id]/route";
import { POST as withdraw } from "@/app/api/admin/community-reviews/[id]/withdraw/route";
import { POST as exportReport } from "@/app/api/admin/reports/export/route";
import { GET as challenge } from "@/app/api/community/replays/[id]/challenge/route";
import { GET as detail } from "@/app/api/community/replays/[id]/route";
import { GET as list } from "@/app/api/community/replays/route";
import { archiveQuiz, saveQuiz } from "@/lib/academy/admin";
import { getAdminReport, reportRange } from "@/lib/admin/reports";
import { buildCommunityReport } from "@/lib/community/report";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import { cleanupUsers, context, fixtureUser, request, tokenFor } from "./helpers";

const ids: string[] = [];
const quizzes: string[] = [];
let ownerId = "",
  actorId = "",
  actorToken = "",
  ownerToken = "",
  otherToken = "";
beforeAll(async () => {
  const owner = await fixtureUser(),
    actor = await fixtureUser("ADMIN"),
    other = await fixtureUser();
  ids.push(owner.id, actor.id, other.id);
  ownerId = owner.id;
  actorId = actor.id;
  actorToken = await tokenFor(actorId);
  ownerToken = await tokenFor(ownerId);
  otherToken = await tokenFor(other.id);
});
afterAll(async () => {
  await cleanupUsers(ids);
  await prisma.quiz.deleteMany({ where: { id: { in: quizzes } } });
});
async function source(extra: Partial<Prisma.ForensicRecordUncheckedCreateInput> = {}) {
  return prisma.forensicRecord.create({
    data: {
      userId: ownerId,
      type: "URL",
      status: "COMPLETED",
      target: "https://fictional.test/",
      defangedTarget: "hxxps://fictional[.]test/",
      riskLevel: "WARNING",
      riskScore: 45,
      scamCategory: "Isolated admin fixture",
      summary: "Fictional stored result for administrative workflow testing.",
      analysisSource: "TEST_WORKER",
      modelVersion: "fixture-v1",
      technicalEvidence: {},
      ...extra,
    },
  });
}
describe("Admin moderation, reporting and audit", () => {
  it("requires reasons for approval and withdrawal, hides withdrawn cases and retains snapshots", async () => {
    const record = await source();
    const report = buildCommunityReport(serializeInvestigation(record));
    if (!report) throw new Error("Fixture report invalid");
    const item = await prisma.communityReplay.create({
      data: {
        userId: ownerId,
        sourceRecordId: record.id,
        consentedAt: new Date(),
        title: "Isolated admin withdrawal fixture",
        description: "No real submission data.",
        scamType: "Fixture",
        sanitizedData: report,
      },
    });
    expect(
      (
        await review(
          request(`/api/admin/community-reviews/${item.id}`, actorToken, "PUT", {
            status: "APPROVED",
            privacyConfirmed: true,
          }),
          context(item.id),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await review(
          request(`/api/admin/community-reviews/${item.id}`, actorToken, "PUT", {
            status: "APPROVED",
            privacyConfirmed: true,
            adminNotes: "Fictional snapshot privacy checked.",
          }),
          context(item.id),
        )
      ).status,
    ).toBe(200);
    const saved = await prisma.communityReplay.findUniqueOrThrow({ where: { id: item.id } });
    expect(
      (await detail(request(`/api/community/replays/${item.id}`, otherToken), context(item.id)))
        .status,
    ).toBe(200);
    expect(
      (
        await withdraw(
          request(`/api/admin/community-reviews/${item.id}/withdraw`, actorToken, "POST", {
            reason: "short",
          }),
          context(item.id),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await withdraw(
          request(`/api/admin/community-reviews/${item.id}/withdraw`, actorToken, "POST", {
            reason: "Fixture publication requires follow-up review.",
          }),
          context(item.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (await detail(request(`/api/community/replays/${item.id}`, otherToken), context(item.id)))
        .status,
    ).toBe(404);
    expect(
      (
        await challenge(
          request(`/api/community/replays/${item.id}/challenge`, otherToken),
          context(item.id),
        )
      ).status,
    ).toBe(404);
    const own = await detail(
      request(`/api/community/replays/${item.id}`, ownerToken),
      context(item.id),
    );
    expect(own.status).toBe(200);
    expect((await own.json()).canPractice).toBe(false);
    const published = await list(
      request("/api/community/replays?q=Isolated%20admin%20withdrawal", otherToken),
    );
    expect((await published.json()).items).toHaveLength(0);
    const after = await prisma.communityReplay.findUniqueOrThrow({ where: { id: item.id } });
    expect(after.sanitizedData).toEqual(saved.sanitizedData);
    expect(after.reviewedAt).toEqual(saved.reviewedAt);
    expect(after.reviewerId).toBe(saved.reviewerId);
    expect(
      await prisma.adminAuditLog.count({
        where: { entityId: item.id, action: { in: ["CASE_APPROVED", "CASE_WITHDRAWN"] } },
      }),
    ).toBe(2);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: ownerId } })).exp).toBe(123);
  });
  it("uses WIB day boundaries and exports aggregates without targets or identities", async () => {
    await source({ createdAt: new Date("2037-03-01T16:59:59.999Z") });
    await source({
      createdAt: new Date("2037-03-01T17:00:00.000Z"),
      status: "UNAVAILABLE",
      riskScore: null,
      riskLevel: null,
    });
    const data = await getAdminReport({ from: "2037-03-01", to: "2037-03-01" });
    expect(data.totals.investigations).toBe(1);
    expect(data.daily).toEqual([
      { date: "2037-03-01", investigations: 1, users: 0, quizAttempts: 0 },
    ]);
    expect(reportRange({ from: "2036-01-01", to: "2036-12-31" }).days).toBe(366);
    expect(() => reportRange({ from: "2036-01-01", to: "2037-01-01" })).toThrow();
    expect(() => reportRange({ from: "2037-03-02", to: "2037-03-01" })).toThrow();
    expect(
      (
        await exportReport(
          request("/api/admin/reports/export", ownerToken, "POST", {
            from: "2037-03-01",
            to: "2037-03-01",
          }),
        )
      ).status,
    ).toBe(403);
    const response = await exportReport(
      request("/api/admin/reports/export", actorToken, "POST", {
        from: "2037-03-01",
        to: "2037-03-01",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    const body = await response.text();
    expect(body).toContain("2037-03-01,1,0,0");
    for (const forbidden of ["fictional.test", ownerId, actorId, "passwordHash", "@example.test"])
      expect(body).not.toContain(forbidden);
    expect(
      await prisma.adminAuditLog.count({ where: { actorId, action: "REPORT_EXPORTED" } }),
    ).toBe(1);
  });
  it("audits quiz create/update/archive atomically and preserves attempts", async () => {
    const input = {
      title: "Admin isolated quiz fixture",
      description: "Learning material used only in isolated database testing.",
      category: "SPOT_THE_PHISH" as const,
      difficulty: "EASY" as const,
      expReward: 25,
      published: true,
      questions: [
        {
          questionText: "Which action protects your account?",
          questionType: "MULTIPLE_CHOICE" as const,
          options: [
            { id: "a", text: "Check sender" },
            { id: "b", text: "Share password" },
          ],
          correctAnswers: ["a"],
          explanation: "Check the sender before sharing information.",
        },
      ],
    };
    const created = await saveQuiz(input, undefined, undefined, actorId);
    quizzes.push(created.id);
    await prisma.quizAttempt.create({
      data: { userId: ownerId, quizId: created.id, score: 100, passed: true, expEarned: 0 },
    });
    const updated = await saveQuiz(
      { ...input, title: "Admin revised quiz fixture" },
      created.id,
      created.updatedAt.toISOString(),
      actorId,
    );
    expect(updated.title).toBe("Admin revised quiz fixture");
    await expect(
      saveQuiz(input, created.id, created.updatedAt.toISOString(), actorId),
    ).rejects.toThrow();
    await archiveQuiz(created.id, actorId);
    expect(await prisma.quizAttempt.count({ where: { quizId: created.id } })).toBe(1);
    expect((await prisma.quiz.findUniqueOrThrow({ where: { id: created.id } })).published).toBe(
      false,
    );
    expect(await prisma.adminAuditLog.count({ where: { entityId: created.id, actorId } })).toBe(3);
  });
});
