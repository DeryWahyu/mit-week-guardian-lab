import { describe, expect, it } from "bun:test";
import QRCode from "qrcode";
import { POST as submitUrl } from "@/app/api/analyze-url/route";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import {
  apkMetadataSchema,
  MAX_APK_BYTES,
  MAX_QR_BYTES,
  qrFileSchema,
  scanUrlSchema,
} from "@/lib/validations/analysis-input";
import { investigationSchema } from "@/lib/validations/investigation";
import { executeRoute } from "../e2e/helpers/test-harness";
import { getStandardSessionCookies } from "../helpers/auth-fixtures";

describe("Unified URL input", () => {
  it.each([
    ["example.com/path", "https://example.com/path"],
    ["  HTTPS://EXAMPLE.COM  ", "https://example.com/"],
    ["example.com:8443/path", "https://example.com:8443/path"],
    ["http://example.com:8080/", "http://example.com:8080/"],
    ["https://bücher.test", "https://xn--bcher-kva.test/"],
    ["https://[::1]/", "https://[::1]/"],
  ])("normalizes %s consistently", (input, output) =>
    expect(scanUrlSchema.parse(input)).toBe(output),
  );

  it.each([
    "",
    "invalid",
    "https:example.com",
    "javascript:alert(1)",
    "ftp://example.com",
    "//example.com",
    "https://person:password@example.com",
    "https://example.com/a b",
    "https://example.com/a\u0000b",
    "https://example.com\\evil",
    "https://example..com",
    "https://.",
  ])("rejects invalid input %s", (input) => {
    expect(scanUrlSchema.safeParse(input).success).toBe(false);
  });

  it("applies the length limit after URL encoding as well", () => {
    expect(scanUrlSchema.safeParse(`https://example.test/${"あ".repeat(2000)}`).success).toBe(
      false,
    );
    expect(scanUrlSchema.safeParse(`https://example.test/${"x".repeat(16384)}`).success).toBe(
      false,
    );
  });

  it("saves normalized typed and QR URLs through one pipeline with distinct provenance", async () => {
    const typed = await executeRoute(API_ROUTES.analyzeUrl, "POST", {
      url: "example.test/shared?key=private-value",
    });
    const qr = await executeRoute(API_ROUTES.analyzeQr, "POST", {
      imageBase64: (await QRCode.toDataURL("example.test/shared?key=private-value")).split(",")[1],
      mimeType: "image/png",
    });
    expect(typed.status).toBe(201);
    expect(qr.status).toBe(201);
    const typedRecord = investigationSchema.parse(typed.body);
    const qrRecord = investigationSchema.parse(qr.body);
    expect(typedRecord.target).toBe(qrRecord.target);
    expect(typedRecord.id).not.toBe(qrRecord.id);
    expect(typedRecord.type).toBe("URL");
    expect(qrRecord.type).toBe("QR");
    expect(typedRecord.inputMetadata.submittedAs).toBe("url");
    expect(qrRecord.inputMetadata.submittedAs).toBe("qr");
    for (const record of [typedRecord, qrRecord]) {
      expect(record.status).toBe("UNAVAILABLE");
      expect(record.riskScore).toBeNull();
      expect(JSON.stringify(record)).not.toContain("private-value");
    }
  });

  it("does not store typed URL credentials", async () => {
    const before = await prisma.forensicRecord.count();
    const response = await executeRoute(API_ROUTES.analyzeUrl, "POST", {
      url: "https://user:private-password@example.test",
    });
    expect(response.status).toBe(400);
    expect(await prisma.forensicRecord.count()).toBe(before);
    expect(JSON.stringify(response.body)).not.toContain("private-password");
  });

  it("keeps a failed QR record for URLs rejected by the common validation", async () => {
    const response = await executeRoute(API_ROUTES.analyzeQr, "POST", {
      imageBase64: (await QRCode.toDataURL("https://user:private-password@example.test")).split(
        ",",
      )[1],
      mimeType: "image/png",
    });
    expect(response.status).toBe(422);
    const record = investigationSchema.parse(response.body);
    expect(record.type).toBe("QR");
    expect(record.errorCode).toBe("QR_INVALID_URL");
    expect(record.status).toBe("FAILED");
    expect(JSON.stringify(record)).not.toContain("private-password");
  });
});

describe("File selection boundaries", () => {
  it("rejects empty and oversized QR files", () => {
    for (const size of [0, MAX_QR_BYTES + 1])
      expect(qrFileSchema.safeParse({ name: "qr.png", type: "image/png", size }).success).toBe(
        false,
      );
    expect(
      qrFileSchema.safeParse({ name: "qr.png", type: "image/png", size: MAX_QR_BYTES }).success,
    ).toBe(true);
  });
  it("accepts an image extension when browser MIME is absent, with server pixel validation still required", () => {
    for (const type of ["", "application/octet-stream"])
      expect(qrFileSchema.safeParse({ name: "QR.PNG", type, size: 10 }).success).toBe(true);
    expect(qrFileSchema.safeParse({ name: "file.exe", type: "", size: 10 }).success).toBe(false);
    expect(
      qrFileSchema.safeParse({ name: "qr.svg", type: "image/svg+xml", size: 10 }).success,
    ).toBe(false);
  });
  it("rejects empty or oversized APK and accepts uppercase extension", () => {
    expect(
      apkMetadataSchema.safeParse({ fileName: "file.APK", fileSizeBytes: MAX_APK_BYTES }).success,
    ).toBe(true);
    for (const fileSizeBytes of [0, MAX_APK_BYTES + 1])
      expect(apkMetadataSchema.safeParse({ fileName: "file.apk", fileSizeBytes }).success).toBe(
        false,
      );
  });
  it("rejects multiple uploaded files without creating a record", async () => {
    const form = new FormData();
    for (const name of ["a.png", "b.png"])
      form.append("file", new File(["data"], name, { type: "image/png" }));
    const count = await prisma.forensicRecord.count();
    const response = await executeRoute(API_ROUTES.analyzeQr, "POST", form);
    expect(response.status).toBe(400);
    expect(await prisma.forensicRecord.count()).toBe(count);
  });
});

describe("Bounded request parsing", () => {
  it("rejects declared oversized bodies before parsing", async () => {
    const request = new Request("http://localhost/input", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "99999" },
      body: "{}",
    });
    await expect(readInput(request, 100, "json")).rejects.toMatchObject({ status: 413 });
  });
  it.each([undefined, "2"])(
    "counts actual streamed bytes even when Content-Length is %s",
    async (length) => {
      const headers = new Headers({ "content-type": "application/json" });
      if (length) headers.set("content-length", length);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"value":"'));
          controller.enqueue(new Uint8Array(1024));
          controller.close();
        },
      });
      const request = new Request("http://localhost/input", {
        method: "POST",
        headers,
        body: stream,
      });
      await expect(readInput(request, 100, "json")).rejects.toMatchObject({ status: 413 });
    },
  );
  it("reports malformed bodies and unsupported content types", async () => {
    await expect(
      readInput(
        new Request("http://localhost/input", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
        100,
        "json",
      ),
    ).rejects.toBeInstanceOf(InputError);
    await expect(
      readInput(
        new Request("http://localhost/input", { method: "POST", body: "text" }),
        100,
        "json",
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
  it("returns a bounded API error without an investigation ID", async () => {
    const cookies = await getStandardSessionCookies();
    const response = await submitUrl(
      new Request(`http://localhost:3000${API_ROUTES.analyzeUrl}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "200000",
          cookie: Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
        body: "{}",
      }),
    );
    expect(response.status).toBe(413);
    expect((await response.json()).id).toBeUndefined();
  });
});
