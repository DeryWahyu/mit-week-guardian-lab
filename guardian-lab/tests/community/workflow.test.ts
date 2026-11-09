import { beforeAll, describe, expect, it } from "bun:test";
import type { Prisma } from "@prisma/client";
import { PUT as review } from "@/app/api/admin/community-reviews/[id]/route";
import { GET as queue } from "@/app/api/admin/community-reviews/route";
import { POST as attempt } from "@/app/api/community/replays/[id]/attempt/route";
import { GET as detail } from "@/app/api/community/replays/[id]/route";
import { GET as list } from "@/app/api/community/replays/route";
import { GET as preview, POST as submit } from "@/app/api/community/submit/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { buildCommunityReport } from "@/lib/community/report";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import {
  communityCaseSchema,
  communityListSchema,
  communityPreviewSchema,
} from "@/lib/validations/community";
import { ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";

const prefix = `community-${Date.now()}`;
let ownerToken: string, adminToken: string, otherToken: string;
let recordId: string, caseId: string;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function req(path: string, token = ownerToken, method = "GET", body?: unknown) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function source(changes: Partial<Prisma.ForensicRecordUncheckedCreateInput> = {}) {
  return prisma.forensicRecord.create({
    data: {
      userId: STANDARD_USER_FIXTURE.id,
      target: "https://name:secret@sample.test/check?key=private-query",
      type: "URL",
      status: "COMPLETED",
      riskLevel: "PHISHING",
      riskScore: 91,
      summary:
        "Kontak demo@example.test +6281234567890 dan https://name:secret@sample.test/?key=private-query",
      scamCategory: prefix,
      deceptionTricks: ["Meminta OTP.", "Meminta OTP."],
      technicalEvidence: {
        entropy: 0,
        permissions: ["android.permission.READ_SMS", "private-permission"],
        c2Endpoints: ["https://endpoint.test/bot-secret?key=private-query"],
        botTokens: ["not-for-export"],
        suspiciousDexStrings: ["not-for-export"],
      },
      defangedTarget: "forged",
      analysisSource: "TEST_WORKER",
      modelVersion: "fixture-v1",
      finishedAt: new Date(),
      ...changes,
    },
  });
}
const submitId = (id: string, token = ownerToken, extra = {}) =>
  submit(
    req(API_ROUTES.communitySubmit, token, "POST", {
      investigationId: id,
      consent: true,
      ...extra,
    }),
  );
const decide = (id: string, body: unknown, token = adminToken) => {
  const input =
    body && typeof body === "object" && "status" in body && body.status === "APPROVED"
      ? { adminNotes: "Bukti dan privasi snapshot telah diperiksa.", ...body }
      : body;
  return review(req(API_ROUTES.adminCommunityReview(id), token, "PUT", input), ctx(id));
};

describe("Stored investigation contribution and moderation", () => {
  beforeAll(async () => {
    ownerToken = await createSessionToken(
      await prisma.user.findUniqueOrThrow({ where: { id: STANDARD_USER_FIXTURE.id } }),
    );
    adminToken = await createSessionToken(
      await prisma.user.findUniqueOrThrow({ where: { id: ADMIN_USER_FIXTURE.id } }),
    );
    const other = await prisma.user.create({
      data: {
        name: "Fixture",
        email: `${prefix}@example.test`,
        passwordHash: "fixture",
        phone: "+6281500000001",
        phoneVerifiedAt: new Date(),
      },
    });
    otherToken = await createSessionToken(other);
    recordId = (await source()).id;
  });
  it("requires authentication and rejects cross-origin mutations", async () => {
    expect((await submit(req(API_ROUTES.communitySubmit, "", "POST", {}))).status).toBe(401);
    const request = req(API_ROUTES.communitySubmit, ownerToken, "POST", {
      investigationId: recordId,
      consent: true,
    });
    request.headers.set("Origin", "https://foreign.test");
    expect((await submit(request)).status).toBe(403);
  });
  it("requires explicit consent and rejects client supplied evidence/target", async () => {
    expect((await submitId(recordId, ownerToken, { consent: false })).status).toBe(400);
    expect((await submitId(recordId, ownerToken, { target: "forged" })).status).toBe(400);
    expect(
      (
        await submit(
          req(API_ROUTES.communitySubmit, ownerToken, "POST", {
            title: "forged",
            scamType: "fake",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("bounds body size and checks malformed JSON", async () => {
    const request = req(API_ROUTES.communitySubmit, ownerToken, "POST", { x: "x".repeat(5000) });
    expect((await submit(request)).status).toBe(413);
    const malformed = new Request("http://localhost:3000/api/community/submit", {
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: "{",
    });
    expect((await submit(malformed)).status).toBe(400);
  });
  it("allows only the source owner to preview/submit, including admin", async () => {
    for (const token of [otherToken, adminToken]) {
      expect((await submitId(recordId, token)).status).toBe(403);
      expect((await preview(req(API_ROUTES.communityPreview(recordId), token))).status).toBe(403);
    }
    expect((await submitId("missing-source")).status).toBe(404);
  });
  it("preview matches immutable sanitized snapshot and omits private identifiers/raw evidence", async () => {
    const res = await preview(req(API_ROUTES.communityPreview(recordId)));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const data = communityPreviewSchema.parse(await res.json());
    expect(data.existing).toBeNull();
    expect(data.report?.riskScore).toBe(91);
    expect(data.report?.technicalEvidence.entropy).toBe(0);
    expect(data.report?.technicalEvidence.permissions).toEqual(["android.permission.READ_SMS"]);
    expect(data.report?.technicalEvidence.c2Endpoints).toEqual(["hxxps://endpoint[.]test/"]);
    const text = JSON.stringify(data.report);
    for (const secret of [
      "demo@",
      "+6281234567890",
      "name:secret",
      "private-query",
      "not-for-export",
      "bot-secret",
      STANDARD_USER_FIXTURE.id,
      recordId,
    ])
      expect(text).not.toContain(secret);
    expect(data.report?.deceptionTricks).toHaveLength(1);
  });
  it("blocks pending, unavailable, failed, incomplete and legacy records", async () => {
    for (const changes of [
      { status: "RECEIVED" },
      { status: "PROCESSING" },
      { status: "UNAVAILABLE" },
      { status: "FAILED" },
      { analysisSource: "LEGACY_UNVERIFIED" },
      { riskScore: null },
    ] as const) {
      const record = await source(changes);
      expect((await submitId(record.id)).status).toBe(409);
    }
  });
  it("submits a genuine completed record exactly once", async () => {
    const response = await submitId(recordId);
    expect(response.status).toBe(201);
    const item = communityCaseSchema.parse(await response.json());
    caseId = item.id;
    expect(item.status).toBe("PENDING_REVIEW");
    const saved = await prisma.communityReplay.findUniqueOrThrow({ where: { id: caseId } });
    expect(saved.sourceRecordId).toBe(recordId);
    expect(saved.consentedAt).toBeInstanceOf(Date);
    expect(saved.sanitizedData).toEqual(item.report);
    const again = await submitId(recordId);
    expect(again.status).toBe(200);
    expect((await again.json()).id).toBe(caseId);
  });
  it("concurrent submissions return one id instead of creating duplicates", async () => {
    const record = await source();
    const results = await Promise.all([submitId(record.id), submitId(record.id)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 201]);
    const bodies = await Promise.all(results.map((r) => r.json()));
    expect(bodies[0].id).toBe(bodies[1].id);
    expect(await prisma.communityReplay.count({ where: { sourceRecordId: record.id } })).toBe(1);
  });
  it("pending cases stay private to their owner and admins", async () => {
    expect(
      (await detail(req(API_ROUTES.communityReplay(caseId), otherToken), ctx(caseId))).status,
    ).toBe(404);
    expect((await detail(req(API_ROUTES.communityReplay(caseId)), ctx(caseId))).status).toBe(200);
    expect(
      (await detail(req(API_ROUTES.communityReplay(caseId), adminToken), ctx(caseId))).status,
    ).toBe(200);
    const data = communityListSchema.parse(
      await (await list(req(`${API_ROUTES.communityReplays}?q=${prefix}`))).json(),
    );
    expect(data.items).toHaveLength(0);
  });
  it("lists private submissions with correct filtered total and pagination", async () => {
    const response = await list(
      req(`${API_ROUTES.communityReplays}?view=mine&q=${prefix}&pageSize=1`),
    );
    const data = communityListSchema.parse(await response.json());
    expect(data.items).toHaveLength(1);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.totalPages).toBe(2);
    expect(data.items[0].sourceRecordId).toBeString();
    expect((await list(req(`${API_ROUTES.communityReplays}?page=0`))).status).toBe(400);
  });
  it("only admin may review and approval requires privacy confirmation", async () => {
    expect((await queue(req(API_ROUTES.adminCommunityReviews))).status).toBe(403);
    expect(
      (await decide(caseId, { status: "APPROVED", privacyConfirmed: true }, ownerToken)).status,
    ).toBe(403);
    expect((await decide(caseId, { status: "APPROVED" })).status).toBe(400);
    expect((await decide(caseId, { status: "REJECTED", adminNotes: "short" })).status).toBe(400);
    expect(
      (await decide(caseId, { status: "REJECTED", adminNotes: "Valid reason", arbitrary: true }))
        .status,
    ).toBe(400);
  });
  it("moderator records approval, reviewer and date", async () => {
    const response = await decide(caseId, {
      status: "APPROVED",
      privacyConfirmed: true,
      adminNotes: "Kontak demo@example.test",
    });
    expect(response.status).toBe(200);
    const saved = await prisma.communityReplay.findUniqueOrThrow({ where: { id: caseId } });
    expect(saved.reviewerId).toBe(ADMIN_USER_FIXTURE.id);
    expect(saved.reviewedAt).toBeInstanceOf(Date);
    expect(saved.adminNotes).not.toContain("demo@example.test");
    expect(
      (await decide(caseId, { status: "REJECTED", adminNotes: "Another decision" })).status,
    ).toBe(409);
  });
  it("published cases expose sanitized report without author, source id or moderator notes", async () => {
    const response = await detail(req(API_ROUTES.communityReplay(caseId), otherToken), ctx(caseId));
    expect(response.status).toBe(200);
    const item = await response.json();
    expect(item.report.riskScore).toBe(91);
    for (const key of [
      "userId",
      "user",
      "sourceRecordId",
      "adminNotes",
      "reviewerId",
      "consentedAt",
    ])
      expect(item).not.toHaveProperty(key);
    const data = communityListSchema.parse(
      await (
        await list(req(`${API_ROUTES.communityReplays}?q=${prefix}&type=URL`, otherToken))
      ).json(),
    );
    expect(data.pagination.total).toBe(1);
    expect(data.items[0].id).toBe(caseId);
  });
  it("rejects a case with a sanitized reason visible only to its owner/admin", async () => {
    const record = await source({ type: "QR" });
    const item = await (await submitId(record.id)).json();
    expect(
      (
        await decide(item.id, {
          status: "REJECTED",
          adminNotes: "Data korban demo@example.test masih perlu ditinjau.",
        })
      ).status,
    ).toBe(200);
    const own = await (await detail(req(API_ROUTES.communityReplay(item.id)), ctx(item.id))).json();
    expect(own.status).toBe("REJECTED");
    expect(own.adminNotes).not.toContain("demo@example.test");
    expect(
      (await detail(req(API_ROUTES.communityReplay(item.id), otherToken), ctx(item.id))).status,
    ).toBe(404);
    expect((await (await submitId(record.id)).json()).id).toBe(item.id);
  });
  it("two admins cannot overwrite one another's decision", async () => {
    const record = await source();
    const item = await (await submitId(record.id)).json();
    const responses = await Promise.all([
      decide(item.id, { status: "APPROVED", privacyConfirmed: true }),
      decide(item.id, { status: "REJECTED", adminNotes: "Concurrent rejection reason" }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it("does not allow an admin to approve their own contribution", async () => {
    const record = await source({ userId: ADMIN_USER_FIXTURE.id });
    const item = await (await submitId(record.id, adminToken)).json();
    expect((await decide(item.id, { status: "APPROVED", privacyConfirmed: true })).status).toBe(
      403,
    );
    const own = await (
      await detail(req(API_ROUTES.communityReplay(item.id), adminToken), ctx(item.id))
    ).json();
    expect(own.canReview).toBe(false);
  });
  it("legacy submissions can be rejected but never published without a valid snapshot and consent", async () => {
    const legacy = await prisma.communityReplay.create({
      data: {
        userId: STANDARD_USER_FIXTURE.id,
        title: "legacy",
        description: "demo@example.test",
        scamType: "legacy",
        sanitizedData: {},
      },
    });
    expect((await decide(legacy.id, { status: "APPROVED", privacyConfirmed: true })).status).toBe(
      409,
    );
    expect(
      (
        await decide(legacy.id, {
          status: "REJECTED",
          adminNotes: "Snapshot hasil tidak tersedia.",
        })
      ).status,
    ).toBe(200);
  });
  it("preserves score zero and APK/QR types without inventing technical evidence", async () => {
    for (const type of ["APK", "QR"] as const) {
      const record = serializeInvestigation(
        await source({
          type,
          riskLevel: "SAFE",
          riskScore: 0,
          deceptionTricks: [],
          technicalEvidence: {},
        }),
      );
      const report = buildCommunityReport(record);
      expect(report?.type).toBe(type);
      expect(report?.riskScore).toBe(0);
      expect(report?.deceptionTricks).toHaveLength(0);
      expect(report?.technicalEvidence).toEqual({});
    }
  });
  it("reading or posting an incomplete attempt does not award EXP", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: STANDARD_USER_FIXTURE.id } });
    expect(
      (await attempt(req(API_ROUTES.replayAttempt(caseId), ownerToken, "POST", {}), ctx(caseId)))
        .status,
    ).toBe(400);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: STANDARD_USER_FIXTURE.id } })).exp,
    ).toBe(before.exp);
    expect(await prisma.replayAttempt.count({ where: { replayId: caseId } })).toBe(0);
  });
  it("keeps submitted snapshot consistent when source data is later corrected", async () => {
    await prisma.forensicRecord.update({
      where: { id: recordId },
      data: { summary: "Changed source", riskLevel: "SAFE", riskScore: 0 },
    });
    const data = communityPreviewSchema.parse(
      await (await preview(req(API_ROUTES.communityPreview(recordId)))).json(),
    );
    expect(data.report?.riskScore).toBe(91);
    expect(data.report?.summary).not.toBe("Changed source");
    const published = await (
      await detail(req(API_ROUTES.communityReplay(caseId), otherToken), ctx(caseId))
    ).json();
    expect(published.report).toEqual(data.report);
  });
  it("rejects invalid ids and reports missing review targets", async () => {
    expect((await detail(req(API_ROUTES.communityReplay("!")), ctx("!"))).status).toBe(400);
    expect((await preview(req(API_ROUTES.communityPreview("!")))).status).toBe(400);
    expect(
      (await decide("missing-case", { status: "APPROVED", privacyConfirmed: true })).status,
    ).toBe(404);
  });
  it("excludes legacy approvals from member feeds even with type filters", async () => {
    await prisma.communityReplay.create({
      data: {
        userId: STANDARD_USER_FIXTURE.id,
        title: `${prefix}-legacy-approval`,
        description: "demo@example.test",
        scamType: "legacy",
        status: "APPROVED",
        sanitizedData: { type: "URL" },
      },
    });
    const data = communityListSchema.parse(
      await (
        await list(
          req(`${API_ROUTES.communityReplays}?q=${prefix}-legacy-approval&type=URL`, otherToken),
        )
      ).json(),
    );
    expect(data.pagination.total).toBe(0);
  });
  it("retains snapshot for owner review but hides cases whose source was removed", async () => {
    const sourceRecord = await source();
    const item = await (await submitId(sourceRecord.id)).json();
    expect((await decide(item.id, { status: "APPROVED", privacyConfirmed: true })).status).toBe(
      200,
    );
    await prisma.forensicRecord.delete({ where: { id: sourceRecord.id } });
    expect(
      (await prisma.communityReplay.findUniqueOrThrow({ where: { id: item.id } })).sourceRecordId,
    ).toBeNull();
    expect(
      (await detail(req(API_ROUTES.communityReplay(item.id), otherToken), ctx(item.id))).status,
    ).toBe(404);
    expect((await detail(req(API_ROUTES.communityReplay(item.id)), ctx(item.id))).status).toBe(200);
  });
});
