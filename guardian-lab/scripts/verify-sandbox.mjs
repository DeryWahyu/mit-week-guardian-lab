import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const base = process.env.SANDBOX_BROKER_URL;
const secret = process.env.SANDBOX_BROKER_KEY;
assert(base && secret, "Konfigurasi broker belum tersedia.");
const id = randomUUID();
let paused = false;
const headers = { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };
const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8", timeout: 15000 }).trim();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(path, options) {
  return fetch(new URL(path, base), { headers, signal: AbortSignal.timeout(70000), ...options });
}
async function cleanup() {
  if (paused) {
    docker("unpause", "guardian_sandbox_broker");
    paused = false;
  }
  await request(`/sessions/${id}`, { method: "DELETE" });
}
try {
  assert.equal((await fetch(new URL("/health", base))).status, 401);
  const response = await request("/sessions", {
    method: "POST",
    body: JSON.stringify({ sessionId: id, targetUrl: "https://example.com/" }),
  });
  assert.equal(response.status, 201);
  const session = await response.json();
  assert.equal(session.status, "ACTIVE");
  assert(session.expiresAt - Date.now() <= 180000);
  const stream = new URL(session.streamUrl);
  assert.equal((await fetch(new URL(`/s/${id}/`, stream))).status, 403);
  assert.equal((await fetch(stream)).status, 200);
  const browser = docker(
    "ps",
    "-q",
    "--filter",
    `label=guardian.sandbox.session=${id}`,
    "--filter",
    "ancestor=guardian-sandbox-web:1",
  );
  assert(browser);
  const curl = (url) =>
    docker(
      "exec",
      browser,
      "curl",
      "--max-time",
      "10",
      "--proxy",
      "http://guardian-egress:3128",
      "--noproxy",
      "",
      "-s",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      url,
    );
  assert.equal(curl("https://example.com/"), "200");
  for (const target of [
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://host.docker.internal:3000/",
    "http://[::1]/",
    "http://127.0.0.1.nip.io/",
  ])
    assert.equal(curl(target), "403");
  let directBlocked = false;
  try {
    docker(
      "exec",
      browser,
      "curl",
      "--max-time",
      "3",
      "--noproxy",
      "*",
      "--silent",
      "https://example.com/",
    );
  } catch {
    directBlocked = true;
  }
  assert(directBlocked, "Koneksi internet langsung harus diblokir.");
  const websocket = new URL(`/s/${id}/websockify`, stream);
  websocket.protocol = stream.protocol === "https:" ? "wss:" : "ws:";
  websocket.searchParams.set("ticket", stream.searchParams.get("ticket"));
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(websocket, ["binary"]);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Stream VNC tidak mengirim frame."));
    }, 10000);
    socket.onmessage = () => {
      clearTimeout(timer);
      socket.close();
      resolve();
    };
    socket.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Stream WebSocket VNC gagal."));
    };
  });
  console.log(
    "PASS: autentikasi stream, VNC WebSocket, internet publik, dan pemblokiran IP lokal/metadata/DNS lokal.",
  );
  if (process.argv.includes("--watchdog")) {
    docker("pause", "guardian_sandbox_broker");
    paused = true;
    console.log("Memverifikasi batas 180 detik saat proses broker dibekukan...");
    while (Date.now() < session.expiresAt + 5000) await wait(1000);
    assert.equal(docker("ps", "-aq", "--filter", `label=guardian.sandbox.session=${id}`), "");
    docker("unpause", "guardian_sandbox_broker");
    paused = false;
    console.log("PASS: browser dan proxy berhenti serta terhapus tanpa reaper broker.");
  } else {
    await cleanup();
    assert.equal(docker("ps", "-aq", "--filter", `label=guardian.sandbox.session=${id}`), "");
    assert.equal((await fetch(stream)).status, 403);
    const late = await request("/sessions", {
      method: "POST",
      body: JSON.stringify({ sessionId: id, targetUrl: "https://example.com/" }),
    });
    assert.equal(late.status, 503);
    assert.equal(docker("ps", "-aq", "--filter", `label=guardian.sandbox.session=${id}`), "");
    console.log("PASS: penghentian manual menghapus container dan menutup akses stream.");
  }
} finally {
  await cleanup();
}
