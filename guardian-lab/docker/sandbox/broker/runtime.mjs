import { randomBytes } from "node:crypto";
import https from "node:https";
import Docker from "dockerode";
import { refreshDownloads } from "./downloads.mjs";

export const docker = new Docker({ socketPath: "/var/run/docker.sock", timeout: 15000 });
export const sessions = new Map();
const cancelled = new Map();
const broker = process.env.BROKER_CONTAINER;
const managed = "guardian.sandbox.managed";
const webImage = process.env.SANDBOX_WEB_IMAGE || "guardian-sandbox-web:1";
const egressImage = process.env.SANDBOX_EGRESS_IMAGE || "guardian-sandbox-egress:1";
const maxSessions = Number(process.env.SANDBOX_MAX_SESSIONS ?? "3");
if (!Number.isInteger(maxSessions) || maxSessions < 1 || maxSessions > 3)
  throw new Error("SANDBOX_MAX_SESSIONS must be an integer from 1 to 3.");

const labels = (id, expiresAt) => ({
  [managed]: "true",
  "guardian.sandbox.session": id,
  "guardian.sandbox.expires": String(expiresAt),
});
const limits = {
  AutoRemove: true,
  Memory: 1536 * 1024 ** 2,
  MemorySwap: 1536 * 1024 ** 2,
  NanoCpus: 1000000000,
  PidsLimit: 512,
  CapDrop: ["ALL"],
  SecurityOpt: ["no-new-privileges:true"],
  LogConfig: { Type: "none" },
};
export async function readiness() {
  await Promise.all([
    docker.getImage(webImage).inspect(),
    docker.getImage(egressImage).inspect(),
  ]);
  return {
    web: true,
    android: false,
    androidReason: "Runtime Android dinamis belum dikonfigurasi. Gunakan bedah APK statis.",
  };
}
async function remove(container) {
  try {
    const info = await container.inspect();
    if (info.Config.Labels?.[managed] !== "true") throw new Error("Unmanaged container");
    await container.remove({ force: true, v: true });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }
}
async function cleanup(id) {
  const session = sessions.get(id);
  if (!session) return;
  session.stopping = true;
  for (const container of session.containers) await remove(container);
  if (session.network) {
    try {
      await session.network.disconnect({ Container: broker, Force: true });
    } catch (e) {
      if (![403, 404].includes(e.statusCode)) throw e;
    }
    try {
      await session.network.remove();
    } catch (e) {
      if (e.statusCode !== 404) throw e;
    }
  }
  sessions.delete(id);
}
async function ready(session) {
  return new Promise((resolve) => {
    const request = https.get(
      `${session.target}/`,
      {
        rejectUnauthorized: false,
        headers: {
          Authorization: `Basic ${Buffer.from(`kasm_user:${session.password}`).toString("base64")}`,
        },
        timeout: 1500,
        signal: AbortSignal.timeout(1500),
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}
export async function destroy(id) {
  cancelled.set(id, Date.now() + 180000);
  const s = sessions.get(id);
  if (!s) return;
  s.stopping = true;
  if (s.creating) await s.finished;
  await cleanup(id);
}
function check(session) {
  if (session.stopping) throw new Error("Session stopped");
}
export async function create(id, targetUrl) {
  if ((cancelled.get(id) ?? 0) > Date.now()) throw new Error("Session already stopped");
  const known = sessions.get(id);
  if (known) return known;
  if (sessions.size >= maxSessions) throw new Error("Kapasitas sandbox penuh. Coba beberapa saat lagi.");
  const expiresAt = Date.now() + 180000;
  const session = {
    id,
    expiresAt,
    password: randomBytes(32).toString("hex"),
    containers: [],
    ready: false,
    stopping: false,
  };
  sessions.set(id, session);
  const deadline = `GUARDIAN_EXPIRES_AT=${Math.floor(expiresAt / 1000)}`;
  try {
    session.creating = true;
    session.finished = new Promise((resolve) => {
      session.finish = resolve;
    });
    session.network = await docker.createNetwork({
      Name: `guardian-session-${id}`,
      Internal: true,
      EnableIPv6: false,
      Labels: labels(id, expiresAt),
    });

    await session.network.connect({ Container: broker });
    check(session);
    const proxy = await docker.createContainer({
      Image: egressImage,
      Labels: labels(id, expiresAt),
      Env: [deadline],
      NetworkingConfig: {
        EndpointsConfig: {
          [process.env.EGRESS_NETWORK]: {},
          [`guardian-session-${id}`]: { Aliases: ["guardian-egress"] },
        },
      },
      HostConfig: {
        ...limits,
        Memory: 256 * 1024 ** 2,
        MemorySwap: 256 * 1024 ** 2,
        NetworkMode: process.env.EGRESS_NETWORK,
        CapDrop: ["ALL"],
        CapAdd: ["SETUID", "SETGID"],
      },
    });
    session.containers.push(proxy);
    check(session);

    await proxy.start();
    check(session);
    const browser = await docker.createContainer({
      Image: webImage,
      Labels: labels(id, expiresAt),
      Env: [
        deadline,
        `VNC_PW=${session.password}`,
        `LAUNCH_URL=${targetUrl}`,
        "VNC_RESOLUTION=1280x720",
        "KASM_SVC_UPLOADS=0",
        "KASM_SVC_AUDIO=0",
        "KASM_SVC_AUDIO_INPUT=0",
        "KASM_SVC_GAMEPAD=0",
        "KASM_SVC_PRINTER=0",
        "KASM_SVC_SMARTCARD=0",
        "APP_ARGS=--start-maximized --disable-quic --force-webrtc-ip-handling-policy=disable_non_proxied_udp",
      ],
      HostConfig: {
        ...limits,
        ShmSize: 256 * 1024 ** 2,
        NetworkMode: session.network.id,
        Tmpfs: {
          "/home/kasm-user/Downloads":
            "rw,nosuid,nodev,noexec,size=64m,uid=1000,gid=1000,mode=0700",
        },
      },
    });
    session.containers.push(browser);
    await browser.start();
    check(session);
    const info = await browser.inspect();
    const network = Object.values(info.NetworkSettings.Networks)[0];
    session.target = `https://${network.IPAddress}:6901`;
    const end = Date.now() + 55000;
    while (Date.now() < end && !session.stopping) {
      if (await ready(session)) {
        check(session);
        await refreshDownloads(session);
        session.ready = true;
        return session;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.error("VNC readiness timed out");
    throw new Error("Browser terisolasi belum siap. Coba mulai lagi.");
  } catch (error) {
    console.error("Container startup failure", error.statusCode ?? "readiness");
    await cleanup(id);
    throw error;
  } finally {
    session.creating = false;
    session.finish?.();
  }
}
export async function reconcile() {
  // A broker restart invalidates all stream tickets and removes only our labeled resources.
  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${managed}=true`] },
  });
  for (const c of containers) await remove(docker.getContainer(c.Id));
  const networks = await docker.listNetworks({ filters: { label: [`${managed}=true`] } });
  for (const n of networks) {
    const network = docker.getNetwork(n.Id);
    const info = await network.inspect();
    for (const containerId of Object.keys(info.Containers ?? {}))
      await network.disconnect({ Container: containerId, Force: true });
    await network.remove();
  }
}
export async function reap() {
  for (const [id, expires] of cancelled) if (expires <= Date.now()) cancelled.delete(id);
  for (const s of sessions.values()) {
    if (s.expiresAt <= Date.now()) {
      await destroy(s.id);
      continue;
    }
    if (!s.ready || s.stopping) continue;
    try {
      const info = await s.containers.at(-1).inspect();
      if (!info.State.Running) await destroy(s.id);
      else await refreshDownloads(s);
    } catch (e) {
      if (e.statusCode === 404) await destroy(s.id);
      else throw e;
    }
  }
}
