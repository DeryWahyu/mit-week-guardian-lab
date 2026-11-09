import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.env.SANDBOX_BROKER_URL;
const key = process.env.SANDBOX_BROKER_KEY;
assert(base && key, "Konfigurasi broker belum tersedia.");
const id = randomUUID();
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const request = (path, options = {}) =>
  fetch(new URL(path, base), {
    headers,
    signal: AbortSignal.timeout(70000),
    ...options,
  });
const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8", timeout: 15000 }).trim();
try {
  const response = await request("/sessions", {
    method: "POST",
    body: JSON.stringify({ sessionId: id, targetUrl: "https://example.com/" }),
  });
  assert.equal(response.status, 201, "Browser lokal harus tersedia.");
  const session = await response.json();
  const container = docker(
    "ps",
    "-q",
    "--filter",
    `label=guardian.sandbox.session=${id}`,
    "--filter",
    "ancestor=guardian-sandbox-web:1",
  );
  assert(container);
  const bytes = readFileSync(new URL("../tests/fixtures/apk/resources-only.apk", import.meta.url));
  // Write through the container's mount namespace: Docker archive/cp cannot see this tmpfs.
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "python3",
      "-c",
      "import sys,os; p='/home/kasm-user/Downloads/fixture.crdownload'; open(p,'wb').write(sys.stdin.buffer.read()); os.rename(p,'/home/kasm-user/Downloads/received.apk')",
    ],
    { input: bytes, timeout: 15000 },
  );
  let artifact;
  for (let attempt = 0; attempt < 20; attempt++) {
    const state = await (await request(`/sessions/${id}`)).json();
    artifact = state.downloads?.[0];
    if (artifact) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(artifact, "Watcher harus mengarantina APK yang selesai ditulis.");
  assert.equal(artifact.size, bytes.length);
  assert.equal(artifact.sha256, createHash("sha256").update(bytes).digest("hex"));
  const transfer = await request(`/sessions/${id}/downloads/${artifact.id}`);
  assert.equal(transfer.status, 200);
  assert.deepEqual(Buffer.from(await transfer.arrayBuffer()), bytes);
  const blocked = new URL(`Downloads/.guardian-quarantine/${artifact.id}.apk`, session.streamUrl);
  blocked.search = new URL(session.streamUrl).search;
  assert.equal((await fetch(blocked)).status, 403);
  assert.equal((await request(`/sessions/${id}/downloads/${randomUUID()}`)).status, 404);
  console.log(
    "PASS: karantina APK, hash, transfer privat, blokir unduhan lokal, dan berkas tidak ditemukan.",
  );
} finally {
  await request(`/sessions/${id}`, { method: "DELETE" });
  assert.equal(docker("ps", "-aq", "--filter", `label=guardian.sandbox.session=${id}`), "");
}
