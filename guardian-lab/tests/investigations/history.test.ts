import { beforeAll, describe, expect, it } from "bun:test";
import type { Prisma } from "@prisma/client";
import { GET as detail } from "@/app/api/history/[id]/route";
import { GET as history } from "@/app/api/history/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import {
  historyFiltersSchema,
  historyQuerySchema,
  historyRequestParams,
  historyResponseSchema,
} from "@/lib/validations/history";
import { investigationSchema } from "@/lib/validations/investigation";
import { ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";
import { getStandardSessionCookies } from "../helpers/auth-fixtures";

const prefix = `phase4-history-${Date.now()}`;
let cookies: Record<string, string>;
let adminToken: string;
const ids: string[] = [];
function request(path: string, token?: string) {
  const cookie = token
    ? `${SESSION_COOKIE_NAME}=${token}`
    : Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
  return new Request(`http://localhost:3000${path}`, { headers: { cookie } });
}
async function list(query = "", token?: string) {
  const response = await history(request(`${API_ROUTES.history}?search=${prefix}&${query}`, token));
  expect(response.status).toBe(200);
  return historyResponseSchema.parse(await response.json());
}

describe("Stored results and paginated history", () => {
  beforeAll(async () => {
    cookies = await getStandardSessionCookies();
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: ADMIN_USER_FIXTURE.id } });
    adminToken = await createSessionToken(admin);
    for (let index = 0; index < 25; index++) {
      const id = `${prefix}-${index}`;
      ids.push(id);
      const createdAt = new Date(Date.UTC(2026, 9, 1 + index, 12));
      const completed = index < 3;
      const data: Prisma.ForensicRecordCreateInput = {
        id,
        user: { connect: { id: STANDARD_USER_FIXTURE.id } },
        target: `https://${prefix}-${index}.test/`,
        type: ["URL", "QR", "APK"][index % 3] as "URL" | "QR" | "APK",
        status: completed
          ? "COMPLETED"
          : index === 3
            ? "RECEIVED"
            : index === 4
              ? "PROCESSING"
              : index === 5
                ? "FAILED"
                : "UNAVAILABLE",
        riskScore: completed ? 90 : null,
        riskLevel: completed ? "PHISHING" : null,
        summary: completed ? "Controlled result fixture." : null,
        scamCategory: completed ? "Fixture" : null,
        analysisSource: completed ? (index === 1 ? "LEGACY_UNVERIFIED" : "TEST_WORKER") : null,
        modelVersion: index === 0 ? "fixture-v1" : null,
        defangedTarget: `hxxps://${prefix}-${index}[.]test/`,
        createdAt,
        startedAt: index === 4 || completed ? createdAt : null,
        finishedAt: [3, 4].includes(index) ? null : createdAt,
      };
      await prisma.forensicRecord.create({ data });
    }
    await prisma.forensicRecord.create({
      data: {
        userId: ADMIN_USER_FIXTURE.id,
        target: `https://${prefix}-other.test`,
        type: "URL",
        defangedTarget: "other",
        status: "UNAVAILABLE",
      },
    });
  });

  it("returns total/summary across all filtered records rather than only the first page", async () => {
    const body = await list();
    expect(body.records).toHaveLength(12);
    expect(body.pagination).toEqual({ page: 1, pageSize: 12, total: 25, totalPages: 3 });
    expect(body.summary).toEqual({
      total: 25,
      highRisk: 1,
      unavailable: 19,
      processing: 2,
      failed: 1,
    });
  });
  it("pages deterministically without duplicate or missing IDs", async () => {
    const all = (await Promise.all([list(), list("page=2"), list("page=3")])).flatMap(
      (body) => body.records,
    );
    expect(all).toHaveLength(25);
    expect(new Set(all.map((record) => record.id)).size).toBe(25);
    expect(all[0].id).toBe(ids[24]);
    expect(all[24].id).toBe(ids[0]);
    expect(all.every((record) => record.userId === STANDARD_USER_FIXTURE.id)).toBe(true);
  });
  it("supports page size and clearly represents an unavailable page", async () => {
    const small = await list("pageSize=5&page=2");
    expect(small.records).toHaveLength(5);
    expect(small.pagination.totalPages).toBe(5);
    const missing = await list("page=100");
    expect(missing.records).toEqual([]);
    expect(missing.pagination.total).toBe(25);
  });
  it("applies type/status/date filters before pagination and aggregation", async () => {
    const filtered = await list("type=QR&status=UNAVAILABLE");
    expect(
      filtered.records.every((record) => record.type === "QR" && record.status === "UNAVAILABLE"),
    ).toBe(true);
    expect(filtered.pagination.total).toBe(6);
    const range = await list("from=2026-10-10T00%3A00%3A00.000Z&to=2026-10-12T23%3A59%3A59.999Z");
    expect(range.pagination.total).toBe(3);
    expect(range.records.map((record) => record.id)).toEqual([ids[11], ids[10], ids[9]]);
  });
  it("does not treat legacy or incomplete reports as verified risk results", async () => {
    const filtered = await list("risk=PHISHING");
    expect(filtered.records.map((record) => record.id)).toEqual([ids[0]]);
    expect(filtered.summary.highRisk).toBe(1);
    const unavailable = await list("status=UNAVAILABLE&risk=PHISHING");
    expect(unavailable.pagination.total).toBe(0);
  });
  it("allows admin review without leaking other records to a user", async () => {
    expect((await list("", adminToken)).pagination.total).toBe(26);
    const other = await prisma.forensicRecord.findFirstOrThrow({
      where: { userId: ADMIN_USER_FIXTURE.id, target: { contains: prefix } },
    });
    const blocked = await detail(request(API_ROUTES.historyDetail(other.id)), {
      params: Promise.resolve({ id: other.id }),
    });
    expect(blocked.status).toBe(403);
    expect(JSON.stringify(await blocked.json())).not.toContain(other.target);
  });
  it("returns the same snapshot in list and detail and whitelists account relations", async () => {
    const record = (await list()).records[0];
    const response = await detail(request(API_ROUTES.historyDetail(record.id)), {
      params: Promise.resolve({ id: record.id }),
    });
    expect(response.status).toBe(200);
    const raw = await response.json();
    expect(investigationSchema.parse(raw)).toEqual(record);
    expect(raw.user).toBeUndefined();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("protects legacy credentials on read without changing the stored row", async () => {
    const record = await prisma.forensicRecord.create({
      data: {
        userId: STANDARD_USER_FIXTURE.id,
        target: "https://user:private-password@example.test/?password=private-value",
        type: "URL",
        defangedTarget: "raw",
        status: "COMPLETED",
        analysisSource: "LEGACY_UNVERIFIED",
        technicalEvidence: { botTokens: ["private-token"] },
      },
    });
    const response = await detail(request(API_ROUTES.historyDetail(record.id)), {
      params: Promise.resolve({ id: record.id }),
    });
    const body = await response.json();
    for (const value of ["private-password", "private-value", "private-token"])
      expect(JSON.stringify(body)).not.toContain(value);
    expect(
      (await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } })).target,
    ).toBe(record.target);
  });
  it("returns not-found and invalid-ID responses distinctly", async () => {
    expect(
      (
        await detail(request(API_ROUTES.historyDetail("missing-record")), {
          params: Promise.resolve({ id: "missing-record" }),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await detail(request(API_ROUTES.historyDetail("bad/id")), {
          params: Promise.resolve({ id: "bad/id" }),
        })
      ).status,
    ).toBe(400);
  });
  it.each([
    "page=0",
    "page=-1",
    "page=abc",
    "pageSize=51",
    "from=not-a-date",
    "from=2026-11-01T00:00:00Z&to=2026-10-01T00:00:00Z",
    "status=UNKNOWN",
  ])("rejects invalid query %s", async (query) => {
    const response = await history(request(`${API_ROUTES.history}?${query}`));
    expect(response.status).toBe(400);
  });
  it("validates calendar dates and converts local day boundaries to explicit UTC instants", () => {
    expect(
      historyQuerySchema.safeParse({ from: "2026-10-10T12:00:00Z", to: "2026-10-10T12:00:00.000Z" })
        .success,
    ).toBe(true);
    expect(historyFiltersSchema.safeParse({ from: "2026-02-30" }).success).toBe(false);
    const params = historyRequestParams(
      historyFiltersSchema.parse({ from: "2026-10-10", to: "2026-10-12" }),
    );
    const first = new Date(params.get("from") ?? ""),
      last = new Date(params.get("to") ?? "");
    expect(first.getDate()).toBe(10);
    expect(first.getHours()).toBe(0);
    expect(last.getDate()).toBe(12);
    expect(last.getHours()).toBe(23);
    expect(last.getMilliseconds()).toBe(999);
    expect(historyQuerySchema.safeParse(Object.fromEntries(params)).success).toBe(true);
  });
});
