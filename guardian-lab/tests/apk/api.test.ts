import { describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as historyDetail } from "@/app/api/history/[id]/route";
import { InvestigationView } from "@/components/shared/investigation-view";
import { getApkStaticReport } from "@/lib/apk/presentation";
import { acquireApkSlot } from "@/lib/apk/receive";
import { getInvestigationResult } from "@/lib/investigations/presentation";
import { createInvestigation } from "@/lib/investigations/service";
import { API_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import { buildShareCard } from "@/lib/share-card/content";
import { type Investigation, investigationSchema } from "@/lib/validations/investigation";
import { ADMIN_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";
import { executeRoute } from "../e2e/helpers/test-harness";
import { getStandardSessionCookies } from "../helpers/auth-fixtures";
import { apkUpload } from "../helpers/investigation-fixtures";

let mockInvestigationState: {
  record: Investigation | null;
  loading: boolean;
  refreshing: boolean;
  problem: { message: string } | null;
  retry: () => void;
} = {
  record: null,
  loading: false,
  refreshing: false,
  problem: null,
  retry: () => {},
};

mock.module("@/lib/hooks/use-investigation", () => ({
  useInvestigation: () => mockInvestigationState,
}));

describe("APK static investigation API", () => {
  it("persists static facts and reloads the identical report without fabricating an AI verdict", async () => {
    const response = await executeRoute(API_ROUTES.analyzeApk, "POST", apkUpload("plain-name.apk"));
    expect(response.status).toBe(201);
    const record = investigationSchema.parse(response.body),
      report = getApkStaticReport(record);
    expect(record.status).toBe("UNAVAILABLE");
    expect(record.riskLevel).toBeNull();
    expect(record.riskScore).toBeNull();
    expect(record.startedAt).not.toBeNull();
    expect(record.inputMetadata.staticExtractionPerformed).toBe(true);
    expect(record.inputMetadata.binaryStored).toBe(false);
    expect(report?.manifest.label).toBe("HelloApp");
    expect(report?.archive.dexCount).toBe(0);
    expect(report?.status).toBe("PARTIAL");
    expect(getInvestigationResult(record)).toBeNull();
    expect(buildShareCard(record)).toBeNull();
    const cookies = await getStandardSessionCookies();
    const request = new Request(`http://localhost:3000${API_ROUTES.historyDetail(record.id)}`, {
      headers: {
        cookie: Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join("; "),
      },
    });
    const stored = investigationSchema.parse(
      await (await historyDetail(request, { params: Promise.resolve({ id: record.id }) })).json(),
    );
    expect(stored.inputMetadata).toEqual(record.inputMetadata);
  }, 30000);
  it("saves a failed investigation for a fake APK instead of accepting its extension", async () => {
    const response = await executeRoute(
      API_ROUTES.analyzeApk,
      "POST",
      apkUpload("fake.apk", "MZ-not-an-APK"),
    );
    expect(response.status).toBe(422);
    const record = investigationSchema.parse(response.body);
    expect(record.status).toBe("FAILED");
    expect(record.errorCode).toBe("APK_INVALID_ARCHIVE");
    expect(record.riskScore).toBeNull();
    expect(getApkStaticReport(record)).toBeNull();
  });
  it("returns a visible busy response without accepting a duplicate job", async () => {
    const release = acquireApkSlot();
    expect(release).not.toBeNull();
    try {
      const response = await executeRoute(API_ROUTES.analyzeApk, "POST", apkUpload());
      expect(response.status).toBe(429);
      expect(response.body).not.toHaveProperty("id");
    } finally {
      release?.();
    }
    const finalRelease = acquireApkSlot();
    expect(finalRelease).not.toBeNull();
    finalRelease?.();
  });

  describe("APK-04: Authorization boundaries and type integrity", () => {
    it("returns 403 when accessing an APK investigation belonging to another user", async () => {
      const foreignRecord = await createInvestigation({
        userId: ADMIN_USER_FIXTURE.id,
        target: "confidential-admin-app.apk",
        type: "APK",
        inputMetadata: { binaryStored: false },
      });

      const cookies = await getStandardSessionCookies();
      const request = new Request(
        `http://localhost:3000${API_ROUTES.historyDetail(foreignRecord.id)}`,
        {
          headers: {
            cookie: Object.entries(cookies)
              .map(([k, v]) => `${k}=${v}`)
              .join("; "),
          },
        },
      );
      const response = await historyDetail(request, {
        params: Promise.resolve({ id: foreignRecord.id }),
      });
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("tidak memiliki akses");
    });

    it("returns 404 when accessing a non-existent investigation ID", async () => {
      const missingId = `c${"9".repeat(24)}`;
      const cookies = await getStandardSessionCookies();
      const request = new Request(`http://localhost:3000${API_ROUTES.historyDetail(missingId)}`, {
        headers: {
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
        },
      });
      const response = await historyDetail(request, {
        params: Promise.resolve({ id: missingId }),
      });
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toContain("tidak ditemukan");
    });

    it("provides redirection guidance and does not render as APK when loading a URL investigation on /apk", () => {
      const urlRecordId = `c${"1".repeat(24)}`;
      mockInvestigationState = {
        record: {
          id: urlRecordId,
          userId: "usr_user_002",
          target: "https://evil-phishing-url.test/login",
          type: "URL",
          status: "COMPLETED",
          riskLevel: "PHISHING",
          riskScore: 88,
          scamCategory: "Peniruan identitas",
          summary: "Halaman web meniru halaman login bank.",
          deceptionTricks: ["Form login palsu"],
          technicalEvidence: {},
          inputMetadata: {},
          analysisSource: "TEST_WORKER",
          modelVersion: "test-v1",
          errorCode: null,
          errorMessage: null,
          defangedTarget: "hxxps://evil-phishing-url[.]test/login",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        loading: false,
        refreshing: false,
        problem: null,
        retry: () => {},
      };

      const html = renderToStaticMarkup(
        createElement(InvestigationView, {
          id: urlRecordId,
          expectedType: "APK",
        }),
      );

      // Verify guidance message and navigation link
      expect(html).toContain("Jenis rekaman ini berbeda dari pemeriksaan di halaman ini.");
      expect(html).toContain("Buka hasil di riwayat");
      expect(html).toContain(PROTECTED_ROUTES.historyDetail(urlRecordId));

      // Verify it is NOT rendered as an APK report
      expect(html).not.toContain("Manifest");
      expect(html).not.toContain("Nama berkas APK");
      expect(html).not.toContain("Pemeriksaan kode");
    });

    it("provides redirection guidance and does not render as APK when loading a QR investigation on /apk", () => {
      const qrRecordId = `c${"2".repeat(24)}`;
      mockInvestigationState = {
        record: {
          id: qrRecordId,
          userId: "usr_user_002",
          target: "qris-palsu.png",
          type: "QR",
          status: "COMPLETED",
          riskLevel: "PHISHING",
          riskScore: 92,
          scamCategory: "QRIS Palsu",
          summary: "QR mengarah ke situs transfer palsu.",
          deceptionTricks: ["Stiker QR palsu"],
          technicalEvidence: {},
          inputMetadata: {},
          analysisSource: "TEST_WORKER",
          modelVersion: "test-v1",
          errorCode: null,
          errorMessage: null,
          defangedTarget: "hxxps://qris-scam[.]test",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        loading: false,
        refreshing: false,
        problem: null,
        retry: () => {},
      };

      const html = renderToStaticMarkup(
        createElement(InvestigationView, {
          id: qrRecordId,
          expectedType: "APK",
        }),
      );

      // Verify guidance message and navigation link
      expect(html).toContain("Jenis rekaman ini berbeda dari pemeriksaan di halaman ini.");
      expect(html).toContain("Buka hasil di riwayat");
      expect(html).toContain(PROTECTED_ROUTES.historyDetail(qrRecordId));

      // Verify it is NOT rendered as an APK report
      expect(html).not.toContain("Manifest");
      expect(html).not.toContain("Nama berkas APK");
    });

    it("renders APK investigation normally without mismatch banner when expectedType matches", () => {
      const apkRecordId = `c${"3".repeat(24)}`;
      mockInvestigationState = {
        record: {
          id: apkRecordId,
          userId: "usr_user_002",
          target: "legit-app.apk",
          type: "APK",
          status: "COMPLETED",
          riskLevel: "SAFE",
          riskScore: 10,
          scamCategory: "Aplikasi Terverifikasi",
          summary: "Tidak ditemukan anomali pada manifest APK.",
          deceptionTricks: [],
          technicalEvidence: {},
          inputMetadata: {
            staticExtractionPerformed: true,
            binaryStored: false,
          },
          analysisSource: "TEST_WORKER",
          modelVersion: "test-v1",
          errorCode: null,
          errorMessage: null,
          defangedTarget: "legit-app.apk",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        },
        loading: false,
        refreshing: false,
        problem: null,
        retry: () => {},
      };

      const html = renderToStaticMarkup(
        createElement(InvestigationView, {
          id: apkRecordId,
          expectedType: "APK",
        }),
      );

      // Should not contain mismatch message
      expect(html).not.toContain("Jenis rekaman ini berbeda dari pemeriksaan di halaman ini.");
      expect(html).toContain("Perbarui status");
    });
  });
});
