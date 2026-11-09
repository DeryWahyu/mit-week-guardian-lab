import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, rmdir, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { ZipFile } from "yazl";
import { ApkStaticPanel } from "@/components/apk/apk-static-panel";
import { inspectApkArchive } from "@/lib/apk/archive";
import { extractApk } from "@/lib/apk/extract";
import { listOutput } from "@/lib/apk/files";
import { createIndicatorScanner, sanitizeApkCode } from "@/lib/apk/indicators";
import { APK_LIMITS } from "@/lib/apk/limits";
import { parseApkManifest } from "@/lib/apk/manifest";
import { getApkStaticReport } from "@/lib/apk/presentation";

const fixture = new URL("../fixtures/apk/hello.apk", import.meta.url);
export async function zip(entries: { name: string; content: string | Buffer; mode?: number }[]) {
  const archive = new ZipFile();
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    archive.outputStream.on("data", (chunk) => chunks.push(chunk));
    archive.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    archive.outputStream.on("error", reject);
  });
  for (const entry of entries)
    archive.addBuffer(Buffer.from(entry.content), entry.name, { mode: entry.mode });
  archive.end();
  return complete;
}
const xml = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.guardian.fixture" android:versionName="1.2" android:versionCode="42"><uses-sdk android:minSdkVersion="23" android:targetSdkVersion="35"/><uses-permission android:name="android.permission.READ_SMS"/><uses-permission-sdk-23 android:name="android.permission.INTERNET"/><application android:label="@string/app_name" android:debuggable="false" android:usesCleartextTraffic="false"/></manifest>`;

describe("APK archive preflight", () => {
  it("counts actual APK entries and DEX without extracting archive paths", async () => {
    const report = await inspectApkArchive(await readFile(fixture));
    expect(report.dexCount).toBe(1);
    expect(report.entryCount).toBeGreaterThan(10);
    expect(report.uncompressedBytes).toBeGreaterThan(1000);
  });
  it("rejects disguised text, truncated ZIP and missing manifest", async () => {
    for (const bytes of [
      Buffer.from("fake APK"),
      Buffer.from("PK\x03\x04"),
      await zip([{ name: "readme.txt", content: "not an APK" }]),
    ])
      await expect(inspectApkArchive(bytes)).rejects.toBeInstanceOf(Error);
  });
  it("rejects archive traversal, Windows paths, symlinks and ambiguous duplicate entries", async () => {
    const safe = await zip([
      { name: "aa/bb.txt", content: "test" },
      { name: "AndroidManifest.xml", content: xml },
    ]);
    for (const unsafe of [
      "../bb.txt",
      "a:/bb.txt",
      "/a/bb.txt",
      "nul/bb.tx",
      "aa/bb.tx ",
      "aa/bb.tx.",
      ".. /b.txt",
    ]) {
      const bytes = Buffer.from(safe.toString("binary").replaceAll("aa/bb.txt", unsafe), "binary");
      await expect(inspectApkArchive(bytes)).rejects.toBeInstanceOf(Error);
    }
    await expect(
      inspectApkArchive(
        await zip([
          { name: "AndroidManifest.xml", content: xml },
          { name: "androidmanifest.xml", content: xml },
        ]),
      ),
    ).rejects.toBeInstanceOf(Error);
    await expect(
      inspectApkArchive(
        await zip([
          { name: "AndroidManifest.xml", content: xml },
          { name: "link", content: "../outside", mode: 0o120777 },
        ]),
      ),
    ).rejects.toBeInstanceOf(Error);
  });
  it("rejects extreme compression ratios and oversized entry declarations", async () => {
    await expect(
      inspectApkArchive(
        await zip([
          { name: "AndroidManifest.xml", content: xml },
          { name: "bomb.dat", content: Buffer.alloc(2 * 1024 * 1024) },
        ]),
      ),
    ).rejects.toBeInstanceOf(Error);
    const bytes = await zip([{ name: "AndroidManifest.xml", content: xml }]);
    const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    bytes.writeUInt32LE(APK_LIMITS.entryBytes + 1, central + 24);
    await expect(inspectApkArchive(bytes)).rejects.toBeInstanceOf(Error);
  });
  it("verifies data CRC instead of trusting archive metadata", async () => {
    const bytes = await zip([{ name: "AndroidManifest.xml", content: xml }]);
    const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    bytes.writeUInt32LE(1, central + 16);
    await expect(inspectApkArchive(bytes)).rejects.toMatchObject({ code: "APK_ARCHIVE_REJECTED" });
  });
});

describe("Manifest and evidence extraction", () => {
  it("parses actual namespaced declarations, flags and resource label", () => {
    const report = parseApkManifest(
      xml,
      '<resources><string name="app_name">Guardian Fixture</string></resources>',
    );
    expect(report.packageName).toBe("com.guardian.fixture");
    expect(report.versionName).toBe("1.2");
    expect(report.versionCode).toBe("42");
    expect(report.label).toBe("Guardian Fixture");
    expect(report.permissions).toEqual([
      "android.permission.READ_SMS",
      "android.permission.INTERNET",
    ]);
    expect(report.debuggable).toBe(false);
    expect(report.usesCleartextTraffic).toBe(false);
    expect(report.allowBackup).toBeNull();
  });
  it("rejects invalid XML, DTD/entity declarations and missing identity", () => {
    for (const value of [
      "<manifest",
      "<manifest/>",
      '<!DOCTYPE manifest [<!ENTITY x SYSTEM "file:///secret">]><manifest package="com.example"/>',
    ])
      expect(() => parseApkManifest(value)).toThrow();
  });
  it("does not silently drop excessive permission declarations", () => {
    expect(() =>
      parseApkManifest(
        `<manifest package="com.example">${'<uses-permission name="android.permission.INTERNET"/>'.repeat(1001)}</manifest>`,
      ),
    ).toThrow();
  });
  it("records masked URL origins and fingerprints, never raw credentials or bot tokens", () => {
    const token = `6123456789:${"A".repeat(35)}`;
    const content = `String url = "https://name:secret@api.telegram.org/bot${token}/sendMessage?chat_id=private-query";\nString key = "private-api-key";\nString email = "demo@example.test"; // +6281234567890\nString permission = "android.permission.READ_SMS";`;
    const scan = createIndicatorScanner();
    scan.scan(content, "sources/com/example/Main.java");
    const report = scan.result();
    expect(report.indicators.telegramBotCount).toBe(1);
    expect(report.indicators.botFingerprints).toEqual([
      createHash("sha256").update(token).digest("hex"),
    ]);
    expect(report.indicators.urls[0].value).toBe("hxxps://api[.]telegram[.]org/[PATH_REDACTED]");
    const text = JSON.stringify(report);
    for (const secret of [
      token,
      "name:secret",
      "private-query",
      "private-api-key",
      "demo@example.test",
      "+6281234567890",
      "https://",
    ])
      expect(text).not.toContain(secret);
    expect(report.snippets.length).toBeGreaterThan(0);
    expect(
      sanitizeApkCode("String x = \"private-value\"; char c = 'A'; long id = 123456789;"),
    ).not.toContain("private-value");
  });
  it("caps displayed indicators and marks incomplete coverage", () => {
    const scan = createIndicatorScanner();
    scan.scan(
      Array.from({ length: 120 }, (_, i) => `https://site${i}.test/path`).join("\n"),
      "source.java",
    );
    expect(scan.result().indicators.urls).toHaveLength(100);
    expect(scan.result().truncated).toBe(true);
  });
  it("does not copy unstructured asset secrets into code snippets", () => {
    const scan = createIndicatorScanner();
    scan.scan(
      "https://name:[REDACTED_EMAIL]/path?key=private-query\nprivate-secret",
      "resources/assets/evidence.txt",
    );
    expect(scan.result().snippets).toEqual([]);
    expect(JSON.stringify(scan.result())).not.toContain("private-query");
    const snippet = sanitizeApkCode(
      '// https://name:[REDACTED_EMAIL]/path?key=private-query\nString x = "private-secret";',
    );
    expect(snippet).not.toContain("private-query");
    expect(snippet).not.toContain("private-secret");
  });
  it("reads binary manifest and real DEX through the installed JADX engine", async () => {
    const report = await extractApk(await readFile(fixture));
    expect(report.engine).toBe("JADX");
    expect(report.manifest.packageName).toBe("com.example.hello.helloapp.app");
    expect(report.manifest.label).toBe("HelloApp");
    expect(report.manifest.minSdk).toBe("7");
    expect(report.archive.dexCount).toBe(1);
    expect(report.coverage.sourceFilesRead).toBeGreaterThan(10);
    expect(report.coverage.sourceBytesRead).toBeGreaterThan(1000);
    if (report.coverage.decompilerExitCode !== 0) {
      expect(report.status).toBe("PARTIAL");
      expect(report.warnings.length).toBeGreaterThan(0);
    }
    const human = renderToStaticMarkup(<ApkStaticPanel report={report} mode="human" />);
    const geek = renderToStaticMarkup(
      <ApkStaticPanel report={report} mode="geek" sha256="fixture-sha" />,
    );
    expect(human).toContain("HelloApp");
    expect(human).toContain("belum membuktikan");
    expect(human).not.toContain("AMAN TERVERIFIKASI");
    expect(geek).toContain("fixture-sha");
    expect(geek).toContain("sourceFilesRead");
  }, 30000);
  it("kills cancelled Java work and removes this process's temporary APK files", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(extractApk(await readFile(fixture), controller.signal)).rejects.toMatchObject({
      code: "APK_CANCELLED",
    });
    const leftovers = (await readdir(tmpdir())).filter((name) =>
      name.startsWith(`guardian-apk-${process.pid}-`),
    );
    expect(leftovers).toEqual([]);
  }, 15000);
  it("rejects oversized output before reading it into application memory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "guardian-apk-test-"));
    const path = join(directory, "oversized.java");
    try {
      await writeFile(path, "");
      await truncate(path, APK_LIMITS.outputBytes + 1);
      await expect(listOutput(directory)).rejects.toMatchObject({ code: "APK_OUTPUT_LIMIT" });
    } finally {
      await rm(path, { force: true });
      await rmdir(directory);
    }
  });
  it("does not trust arbitrary static-report metadata from old records", () => {
    expect(
      getApkStaticReport({
        type: "APK",
        inputMetadata: { apkStatic: { schemaVersion: 999 } },
      }),
    ).toBeNull();
  });
});
