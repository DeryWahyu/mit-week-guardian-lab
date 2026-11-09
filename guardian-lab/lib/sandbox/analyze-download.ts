import { createHash } from "node:crypto";
import { acquireApkSlot, receiveApk } from "@/lib/apk/receive";
import { InputError } from "@/lib/investigations/request-input";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { createInvestigation } from "@/lib/investigations/service";
import { prisma } from "@/lib/prisma";
import { providerDownload } from "./provider";

export async function analyzeSandboxDownload(
  sessionId: string,
  downloadId: string,
  userId: string,
  signal?: AbortSignal,
) {
  const session = await prisma.sandboxSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new InputError("Sesi sandbox tidak ditemukan.", 404);
  const existing = await prisma.sandboxDownloadAnalysis.findUnique({
    where: { sessionId_downloadId: { sessionId, downloadId } },
    include: { record: true },
  });
  if (existing?.record) return { record: serializeInvestigation(existing.record), status: 200 };
  if (session.status !== "ACTIVE" || session.expiresAt.getTime() <= Date.now())
    throw new InputError("Unduhan telah dihapus saat sesi berakhir.", 410);
  const release = acquireApkSlot();
  if (!release)
    throw new InputError("Mesin ekstraksi sedang digunakan. Coba kembali sebentar lagi.", 429);
  try {
    const bytes = await providerDownload(sessionId, downloadId);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const input = {
      userId,
      target: `sandbox-${downloadId}.apk`,
      inputMetadata: {
        fileName: `sandbox-${downloadId}.apk`,
        fileSizeBytes: bytes.length,
        sha256,
        binaryStored: false,
        staticExtractionPerformed: false,
        sourceSandboxSessionId: sessionId,
        sourceDownloadId: downloadId,
        ...(session.sourceInvestigationId
          ? { sourceInvestigationId: session.sourceInvestigationId }
          : {}),
      },
    };
    const reserved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM SandboxSession WHERE id = ${sessionId} FOR UPDATE`;
      const prior = await tx.sandboxDownloadAnalysis.findUnique({
        where: { sessionId_downloadId: { sessionId, downloadId } },
        include: { record: true },
      });
      if (prior?.record) return { record: prior.record, created: false };
      const current = await tx.sandboxSession.findUniqueOrThrow({ where: { id: sessionId } });
      if (current.status !== "ACTIVE" || current.expiresAt.getTime() <= Date.now())
        throw new InputError("Sesi berakhir sebelum berkas diterima. Mulai sesi baru.", 410);
      const record = await createInvestigation({ ...input, type: "APK" }, tx);
      await tx.sandboxDownloadAnalysis.upsert({
        where: { sessionId_downloadId: { sessionId, downloadId } },
        update: { recordId: record.id },
        create: { sessionId, downloadId, recordId: record.id },
      });
      return { record, created: true };
    });
    if (!reserved.created) return { record: serializeInvestigation(reserved.record), status: 200 };
    return await receiveApk(input, bytes, signal, reserved.record);
  } finally {
    release();
  }
}
