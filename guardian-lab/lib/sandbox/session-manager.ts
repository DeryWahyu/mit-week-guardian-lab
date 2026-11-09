import { randomUUID } from "node:crypto";
import type { SandboxSession } from "@prisma/client";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { providerSession, providerStart, providerStop, sandboxAvailable } from "./provider";
import { sandboxTarget } from "./target";
export const SANDBOX_TIMEOUT_SECONDS = 180;
async function response(
  session: SandboxSession,
  streamUrl: string | null = null,
  status: string = session.status,
  downloads: { id: string; size: number; sha256: string }[] = [],
) {
  const analyses = await prisma.sandboxDownloadAnalysis.findMany({
    where: { sessionId: session.id, recordId: { not: null } },
    select: { downloadId: true, recordId: true },
  });
  return {
    sessionId: session.id,
    status,
    expiresAt: session.expiresAt.getTime(),
    serverTime: Date.now(),
    streamUrl,
    isFallback: false as const,
    viewport: "desktop" as const,
    targetUrl: session.targetUrl,
    sourceInvestigationId: session.sourceInvestigationId,
    downloads,
    downloadAnalyses: analyses.filter(
      (item): item is { downloadId: string; recordId: string } => item.recordId !== null,
    ),
  };
}
export async function inspectSession(session: SandboxSession) {
  if (!["ACTIVE", "STARTING"].includes(session.status)) return response(session);
  try {
    const provider = await providerSession(session.id);
    // A stop request can complete while the provider response is in flight.
    const current = await prisma.sandboxSession.findUniqueOrThrow({ where: { id: session.id } });
    if (!["ACTIVE", "STARTING"].includes(current.status)) return response(current);
    if (
      !provider &&
      current.status === "STARTING" &&
      Date.now() - current.startedAt.getTime() < 70000
    )
      return response(current);
    if (!provider) {
      await prisma.sandboxSession.updateMany({
        where: { id: session.id, status: { in: ["STARTING", "ACTIVE"] } },
        data: {
          status: current.expiresAt.getTime() <= Date.now() ? "EXPIRED" : "FAILED",
          destroyedAt: new Date(),
        },
      });
      return response(await prisma.sandboxSession.findUniqueOrThrow({ where: { id: session.id } }));
    }
    if (current.expiresAt.getTime() <= Date.now()) {
      await providerStop(session.id);
      await prisma.sandboxSession.updateMany({
        where: { id: session.id, status: { in: ["STARTING", "ACTIVE"] } },
        data: { status: "EXPIRED", destroyedAt: new Date() },
      });
      return response(await prisma.sandboxSession.findUniqueOrThrow({ where: { id: session.id } }));
    }
    return response(current, provider.streamUrl, provider.status, provider.downloads);
  } catch {
    const current = await prisma.sandboxSession.findUniqueOrThrow({ where: { id: session.id } });
    return ["ACTIVE", "STARTING"].includes(current.status)
      ? response(current, null, "UNKNOWN")
      : response(current);
  }
}
export async function startSandboxSession(
  type: "web" | "android",
  target: string | undefined,
  userId: string,
  requestedId?: string,
  options: {
    stripParameters?: boolean;
    sourceInvestigationId?: string;
    role?: "USER" | "ADMIN";
  } = {},
) {
  if (type === "android")
    throw new InputError(
      "Eksekusi Android dinamis belum tersedia. Gunakan pemeriksaan APK statis.",
      503,
    );
  const targetUrl = sandboxTarget(target, options.stripParameters);
  if (options.sourceInvestigationId) {
    const source = await prisma.forensicRecord.findFirst({
      where: {
        id: options.sourceInvestigationId,
        ...(options.role === "ADMIN" ? {} : { userId }),
        type: { in: ["URL", "QR"] },
      },
    });
    if (!source) throw new InputError("Investigasi sumber tidak ditemukan.", 404);
    if (sandboxTarget(source.target, true) !== targetUrl)
      throw new InputError(
        "Tautan berbeda dari investigasi sumber. Buka sebagai tautan baru.",
        409,
      );
  }
  if (!(await sandboxAvailable()))
    throw new InputError("Sandbox web belum tersedia. Layanan container perlu diaktifkan.", 503);
  const id = requestedId ?? randomUUID();
  const reserved = await prisma.$transaction(
    async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { exp: { increment: 0 } } });
      const previous = await tx.sandboxSession.findUnique({ where: { id } });
      if (previous) {
        if (
          previous.userId !== userId ||
          previous.targetUrl !== targetUrl ||
          previous.sourceInvestigationId !== (options.sourceInvestigationId ?? null)
        )
          throw new InputError("ID sesi sudah digunakan.", 409);
        return { session: previous, created: false };
      }
      const active = await tx.sandboxSession.findFirst({
        where: { userId, status: { in: ["STARTING", "ACTIVE"] }, expiresAt: { gt: new Date() } },
      });
      if (active)
        throw new InputError("Selesaikan sesi sandbox yang masih berjalan terlebih dahulu.", 409);
      const session = await tx.sandboxSession.create({
        data: {
          id,
          userId,
          targetUrl,
          sourceInvestigationId: options.sourceInvestigationId,
          type: "WEB",
          status: "STARTING",
          expiresAt: new Date(Date.now() + 180000),
        },
      });
      return { session, created: true };
    },
    { isolationLevel: "ReadCommitted" },
  );
  if (!reserved.created) return inspectSession(reserved.session);
  try {
    const provider = await providerStart(id, targetUrl);
    const changed = await prisma.sandboxSession.updateMany({
      where: { id, status: "STARTING" },
      data: { status: "ACTIVE", expiresAt: new Date(provider.expiresAt) },
    });
    if (!changed.count) {
      await providerStop(id);
      throw new InputError("Sesi telah dihentikan sebelum browser siap.", 409);
    }
    const session = await prisma.sandboxSession.findUniqueOrThrow({ where: { id } });
    return response(session, provider.streamUrl, "ACTIVE", provider.downloads);
  } catch (error) {
    // A timed-out creation may still finish at the provider. Keep it reconcilable until cleanup is confirmed.
    try {
      await providerStop(id);
      await prisma.sandboxSession.updateMany({
        where: { id, status: "STARTING" },
        data: { status: "FAILED", destroyedAt: new Date() },
      });
    } catch {}
    throw error;
  }
}
export async function stopSandboxSession(
  sessionId: string,
  user: { id: string; role: "USER" | "ADMIN" },
) {
  const session = await prisma.sandboxSession.findFirst({
    where: { id: sessionId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
  });
  if (!session) return null;
  if (["ACTIVE", "STARTING"].includes(session.status)) await providerStop(sessionId);
  await prisma.sandboxSession.update({
    where: { id: sessionId },
    data: { status: "DESTROYED", destroyedAt: new Date() },
  });
  return {
    success: true,
    message: "Sesi sandbox dihentikan dan container dihapus.",
    destroyedSessionId: sessionId,
  };
}
export async function sandboxState(userId: string) {
  const [available, session] = await Promise.all([
    sandboxAvailable(),
    prisma.sandboxSession.findFirst({
      where: { userId, type: "WEB" },
      orderBy: { startedAt: "desc" },
    }),
  ]);
  return {
    available,
    androidAvailable: false as const,
    message: available
      ? "Sandbox web siap. Sesi dibatasi maksimal 180 detik."
      : "Sandbox web belum tersedia. Coba lagi nanti.",
    session: session ? await inspectSession(session) : null,
  };
}
