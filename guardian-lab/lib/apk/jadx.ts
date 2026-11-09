import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { listOutput } from "./files";
import { APK_LIMITS, ApkExtractionError } from "./limits";
import toolchain from "./toolchain.json";

let verified: Promise<string> | null = null;
export function verifyJadx() {
  if (!verified)
    verified = (async () => {
      const root = resolve(".tools/jadx");
      const jar = join(root, "lib", `jadx-${toolchain.version}-all.jar`);
      try {
        const data: unknown = JSON.parse(await readFile(join(root, "verified.json"), "utf8"));
        if (
          !data ||
          typeof data !== "object" ||
          !("archiveSha256" in data) ||
          data.archiveSha256 !== toolchain.sha256 ||
          !("files" in data) ||
          !Array.isArray(data.files)
        )
          throw new Error("Unverified tools");
        const expected = data.files.find(
          (file: unknown) =>
            file &&
            typeof file === "object" &&
            "path" in file &&
            file.path === `lib/jadx-${toolchain.version}-all.jar`,
        ) as { sha256?: string } | undefined;
        await access(jar);
        const hash = createHash("sha256")
          .update(await readFile(jar))
          .digest("hex");
        if (hash !== expected?.sha256) throw new Error("Toolchain changed");
        return jar;
      } catch {
        throw new ApkExtractionError(
          "APK_TOOLS_UNAVAILABLE",
          "Mesin ekstraksi APK belum siap. Administrator perlu memasang Java dan menjalankan apk:setup.",
          503,
        );
      }
    })().catch((error) => {
      verified = null;
      throw error;
    });
  return verified;
}

export async function runJadx(input: string, workdir: string, signal?: AbortSignal) {
  const jar = await verifyJadx(),
    output = join(workdir, "output");
  return new Promise<number | null>((resolveProcess, reject) => {
    const env: NodeJS.ProcessEnv = { NODE_ENV: "production" };
    for (const name of ["PATH", "Path", "SystemRoot", "WINDIR", "JAVA_HOME", "LANG", "LC_ALL"])
      if (process.env[name]) env[name] = process.env[name];
    const child = spawn(
      "java",
      [
        "-Xms32m",
        "-Xmx640m",
        "-XX:MaxMetaspaceSize=160m",
        "-XX:ActiveProcessorCount=4",
        `-Duser.home=${workdir}`,
        `-Djava.io.tmpdir=${workdir}`,
        "-cp",
        jar,
        "jadx.cli.JadxCLI",
        "--config",
        "none",
        "--disable-plugins",
        "jadx-script",
        "--no-debug-info",
        "--decompilation-mode",
        "simple",
        "--threads-count",
        "4",
        "--log-level",
        "error",
        "-d",
        output,
        input,
      ],
      { cwd: workdir, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    let failure: ApkExtractionError | null = null,
      checking = false;
    function stop(error: ApkExtractionError) {
      failure ??= error;
      child.kill("SIGKILL");
    }
    let logBytes = 0;
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => {
        logBytes += chunk.length;
        if (logBytes > 1024 * 1024)
          stop(
            new ApkExtractionError(
              "APK_OUTPUT_LIMIT",
              "Pesan proses ekstraksi melebihi batas pemeriksaan.",
            ),
          );
      });
    const timeout = setTimeout(
      () =>
        stop(
          new ApkExtractionError(
            "APK_TIMEOUT",
            `Ekstraksi melewati batas ${Math.round(APK_LIMITS.timeoutMs / 1000)} detik. Hasil belum dapat dilengkapi.`,
          ),
        ),
      APK_LIMITS.timeoutMs,
    );
    const abort = () =>
      stop(
        new ApkExtractionError("APK_CANCELLED", "Permintaan ekstraksi terputus sebelum selesai."),
      );
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    const watcher = setInterval(async () => {
      if (checking) return;
      checking = true;
      try {
        await listOutput(output);
      } catch (error) {
        stop(
          error instanceof ApkExtractionError
            ? error
            : new ApkExtractionError(
                "APK_OUTPUT_REJECTED",
                "Hasil ekstraksi tidak dapat diperiksa.",
              ),
        );
      } finally {
        checking = false;
      }
    }, 5000);
    function cleanup() {
      clearTimeout(timeout);
      clearInterval(watcher);
      signal?.removeEventListener("abort", abort);
    }
    child.on("error", () => {
      cleanup();
      reject(
        new ApkExtractionError(
          "APK_TOOLS_UNAVAILABLE",
          "Java tidak tersedia untuk menjalankan ekstraksi APK.",
          503,
        ),
      );
    });
    child.on("close", (code) => {
      cleanup();
      if (failure) reject(failure);
      else resolveProcess(code);
    });
  });
}
