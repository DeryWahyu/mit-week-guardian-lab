import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { GET as detail } from "@/app/api/history/[id]/route";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import {
  createInvestigation,
  receiveUnavailableInvestigation,
  transitionInvestigation,
} from "@/lib/investigations/service";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import { type InvestigationResult, investigationSchema } from "@/lib/validations/investigation";
import { QR_CODE_FIXTURES } from "../e2e/fixtures/qr-codes";
import { ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";
import { executeRoute } from "../e2e/helpers/test-harness";
import { getStandardSessionCookies } from "../helpers/auth-fixtures";
import { apkUpload } from "../helpers/investigation-fixtures";

const userId = STANDARD_USER_FIXTURE.id;
const result: InvestigationResult = {
  riskLevel: "WARNING",
  riskScore: 40,
  scamCategory: "Test fixture",
  summary: "Controlled worker result for lifecycle validation.",
  deceptionTricks: ["Fixture observation"],
  technicalEvidence: { observed: true },
  analysisSource: "TEST_WORKER",
  modelVersion: "fixture-v1",
};
const create = () => createInvestigation({ userId, type: "URL", target: "https://example.test" });

async function detailRequest(id: string) {
  const cookies = await getStandardSessionCookies();
  return detail(
    new Request(`http://localhost:3000${API_ROUTES.historyDetail(id)}`, {
      headers: {
        cookie: Object.entries(cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
      },
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("Investigation lifecycle in MySQL", () => {
  it("receives an owner-bound record with no verdict or fabricated evidence", async () => {
    const record = await create();
    expect(record.status).toBe("RECEIVED");
    expect(record.userId).toBe(userId);
    expect(record.riskLevel).toBeNull();
    expect(record.riskScore).toBeNull();
    expect(record.technicalEvidence).toEqual({});
    expect(record.startedAt).toBeNull();
    expect(record.finishedAt).toBeNull();
  });

  it("tracks real processing and completion on the original ID", async () => {
    const record = await create();
    const processing = await transitionInvestigation({
      id: record.id,
      userId,
      status: "PROCESSING",
    });
    expect(processing.startedAt).toBeInstanceOf(Date);
    const completed = await transitionInvestigation({
      id: record.id,
      userId,
      status: "COMPLETED",
      result,
    });
    expect(completed.id).toBe(record.id);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.riskScore).toBe(40);
    expect(completed.finishedAt).toBeInstanceOf(Date);
    expect(completed.analysisSource).toBe("TEST_WORKER");
    expect(
      getInvestigationResult(investigationSchema.parse(JSON.parse(JSON.stringify(completed))))?.id,
    ).toBe(record.id);
  });

  it("rejects completion before processing", async () => {
    const record = await create();
    await expect(
      transitionInvestigation({ id: record.id, userId, status: "COMPLETED", result }),
    ).rejects.toThrow("transisi");
    expect(
      (await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } })).status,
    ).toBe("RECEIVED");
  });

  it("rejects mutation by a different owner", async () => {
    const record = await create();
    await expect(
      transitionInvestigation({
        id: record.id,
        userId: ADMIN_USER_FIXTURE.id,
        status: "PROCESSING",
      }),
    ).rejects.toThrow("transisi");
  });

  it("rejects invalid model results without partially writing a verdict", async () => {
    const record = await create();
    await transitionInvestigation({ id: record.id, userId, status: "PROCESSING" });
    await expect(
      transitionInvestigation({
        id: record.id,
        userId,
        status: "COMPLETED",
        result: { ...result, riskScore: 101 },
      }),
    ).rejects.toThrow();
    const stored = await prisma.forensicRecord.findUniqueOrThrow({ where: { id: record.id } });
    expect(stored.status).toBe("PROCESSING");
    expect(stored.riskScore).toBeNull();
  });

  it("records failure reason and timestamp without a score", async () => {
    const record = await create();
    const failed = await transitionInvestigation({
      id: record.id,
      userId,
      status: "FAILED",
      errorCode: "INPUT_READ_FAILED",
      errorMessage: "Input tidak dapat dibaca.",
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.riskScore).toBeNull();
    expect(failed.finishedAt).toBeInstanceOf(Date);
    expect(failed.errorCode).toBe("INPUT_READ_FAILED");
  });

  it("does not overwrite terminal outcomes", async () => {
    const record = await receiveUnavailableInvestigation({
      userId,
      type: "URL",
      target: "https://example.test",
    });
    await expect(
      transitionInvestigation({ id: record.id, userId, status: "PROCESSING" }),
    ).rejects.toThrow();
    expect(record.status).toBe("UNAVAILABLE");
    expect(record.startedAt).toBeNull();
    expect(record.riskScore).toBeNull();
    expect(record.analysisSource).toBeNull();
  });

  it("allows exactly one competing terminal update", async () => {
    const record = await create();
    await transitionInvestigation({ id: record.id, userId, status: "PROCESSING" });
    const outcomes = await Promise.allSettled([
      transitionInvestigation({ id: record.id, userId, status: "COMPLETED", result }),
      transitionInvestigation({
        id: record.id,
        userId,
        status: "FAILED",
        errorCode: "WORKER_FAILED",
        errorMessage: "Worker failed.",
      }),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
  });

  it("redacts URL credentials, query values, fragments, and encoded PII before storing", async () => {
    const record = await receiveUnavailableInvestigation({
      userId,
      type: "URL",
      target:
        "https://person:secret@example.test/%2561lice%2540example.com?password=verysecret&email=alice@example.com#private-value",
      inputMetadata: {
        password: "verysecret",
        note: "081234567890",
        nested: { token: "secret-token" },
      },
    });
    const serialized = JSON.stringify(record);
    for (const privateValue of [
      "person",
      "secret",
      "alice@example.com",
      "private-value",
      "081234567890",
    ])
      expect(serialized).not.toContain(privateValue);
    expect(record.target).toContain("REDACTED");
  });

  it("never returns a temporary ID when persistence fails", async () => {
    const count = await prisma.forensicRecord.count();
    expect(new URL(process.env.DATABASE_URL ?? "").pathname).toMatch(
      /^\/guardian_lab_test_\d+_\d+$/,
    );
    await prisma.$executeRawUnsafe(
      "RENAME TABLE `ForensicRecord` TO `InvestigationPersistenceProbe`",
    );
    try {
      const response = await executeRoute<Record<string, unknown>>(API_ROUTES.analyzeUrl, "POST", {
        url: "https://example.test",
      });
      expect(response.status).toBe(500);
      expect(response.body.id).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain("database unavailable");
    } finally {
      await prisma.$executeRawUnsafe(
        "RENAME TABLE `InvestigationPersistenceProbe` TO `ForensicRecord`",
      );
    }
    expect(await prisma.forensicRecord.count()).toBe(count);
  });

  it("ignores caller-supplied owner, status, and risk score", async () => {
    const response = await executeRoute(API_ROUTES.analyzeUrl, "POST", {
      url: "https://example.test",
      userId: ADMIN_USER_FIXTURE.id,
      status: "COMPLETED",
      riskScore: 0,
    });
    expect(response.status).toBe(201);
    const record = investigationSchema.parse(response.body);
    expect(record.userId).toBe(userId);
    expect(record.status).toBe("UNAVAILABLE");
    expect(record.riskScore).toBeNull();
  });

  it("returns the same committed record on repeated detail reads", async () => {
    const created = await create();
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await detailRequest(created.id);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("no-store");
      const record = investigationSchema.parse(await response.json());
      expect(record.id).toBe(created.id);
      expect(record.status).toBe("RECEIVED");
    }
  });

  it("filters owner history by status in the database", async () => {
    const record = await receiveUnavailableInvestigation({
      userId,
      type: "URL",
      target: "https://history-filter.test",
    });
    const { GET } = await import("@/app/api/history/route");
    const cookies = await getStandardSessionCookies();
    const response = await GET(
      new Request(
        `http://localhost:3000${API_ROUTES.history}?status=UNAVAILABLE&search=history-filter.test`,
        {
          headers: {
            cookie: Object.entries(cookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        },
      ),
    );
    const body = await response.json();
    expect(body.records).toHaveLength(1);
    expect(body.records[0].id).toBe(record.id);
    expect(body.pagination.total).toBe(1);
  });

  it("requires actual APK upload rather than trusting filename JSON", async () => {
    const response = await executeRoute(API_ROUTES.analyzeApk, "POST", {
      fileName: "fake.apk",
      fileSizeBytes: 999,
    });
    expect(response.status).toBe(400);
    const uploaded = await executeRoute(API_ROUTES.analyzeApk, "POST", apkUpload());
    expect(uploaded.status).toBe(201);
  }, 30000);

  it("does not decode a one-pixel test image as a phishing QR", async () => {
    const response = await executeRoute(API_ROUTES.analyzeQr, "POST", {
      imageBase64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=",
      mimeType: "image/png",
    });
    expect(response.status).toBe(422);
    const record = investigationSchema.parse(response.body);
    expect(record.type).toBe("QR");
    expect(record.status).toBe("FAILED");
    expect(record.errorCode).toBe("QR_DECODE_FAILED");
    expect(record.riskScore).toBeNull();
  });

  it("does not create a record for malformed input", async () => {
    const count = await prisma.forensicRecord.count();
    for (const url of ["", "invalid", "javascript:alert(1)", "ftp://example.test"]) {
      const response = await executeRoute(API_ROUTES.analyzeUrl, "POST", { url });
      expect(response.status).toBe(400);
    }
    expect(await prisma.forensicRecord.count()).toBe(count);
  });

  it("does not retain non-URL QR credentials", async () => {
    const sample = QR_CODE_FIXTURES[1];
    const response = await executeRoute(API_ROUTES.analyzeQr, "POST", {
      imageBase64: sample.imageBase64,
      mimeType: sample.mimeType,
    });
    expect(response.status).toBe(422);
    const record = investigationSchema.parse(response.body);
    expect(record.status).toBe("FAILED");
    expect(record.errorCode).toBe("QR_NOT_URL");
    expect(JSON.stringify(record)).not.toContain("SecretPassword");
  });

  it("withholds legacy and incomplete reports from completed-result presentation", async () => {
    const record = await create();
    const dto = investigationSchema.parse(JSON.parse(JSON.stringify(record)));
    expect(getInvestigationResult({ ...dto, status: "COMPLETED" })).toBeNull();
    expect(
      getInvestigationResult({
        ...dto,
        ...result,
        status: "COMPLETED",
        analysisSource: "LEGACY_UNVERIFIED",
      }),
    ).toBeNull();
  });

  it("preserves legacy data when applying the actual migration SQL", async () => {
    const table = "InvestigationMigrationProbe";
    await prisma.$executeRawUnsafe(
      `CREATE TABLE ${table} (id VARCHAR(191) PRIMARY KEY, userId VARCHAR(191) NOT NULL, riskLevel ENUM('SAFE','WARNING','DANGEROUS','PHISHING','MALWARE','CRITICAL','HIGH','MEDIUM','LOW') NOT NULL, riskScore INT NOT NULL, scamCategory VARCHAR(191) NOT NULL, summary TEXT NOT NULL, createdAt DATETIME(3) NOT NULL)`,
    );
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO ${table} VALUES ('legacy', 'owner', 'WARNING', 42, 'legacy category', 'preserved summary', '2026-01-01 12:00:00')`,
      );
      const sql = (
        await readFile(
          "prisma/migrations/20261101090000_investigation_lifecycle/migration.sql",
          "utf8",
        )
      ).replaceAll("ForensicRecord", table);
      for (const statement of sql.split(";").filter((part) => part.trim()))
        await prisma.$executeRawUnsafe(statement);
      const rows = await prisma.$queryRawUnsafe<
        {
          riskScore: number;
          summary: string;
          status: string;
          analysisSource: string;
          inputMetadata: unknown;
        }[]
      >(`SELECT * FROM ${table}`);
      expect(rows[0].riskScore).toBe(42);
      expect(rows[0].summary).toBe("preserved summary");
      expect(rows[0].status).toBe("COMPLETED");
      expect(rows[0].analysisSource).toBe("LEGACY_UNVERIFIED");
      expect(rows[0].inputMetadata).toEqual({});
    } finally {
      await prisma.$executeRawUnsafe(`DROP TABLE ${table}`);
    }
  });
});
