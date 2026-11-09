import type { Prisma, PrismaClient } from "@prisma/client";
import { buildCommunityReport } from "@/lib/community/report";
import { defangTarget } from "@/lib/investigations/privacy";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { investigationResultSchema } from "@/lib/validations/investigation";
import {
  DEMO_ANALYSIS_SOURCE,
  DEMO_VERSION,
  type DemoProfile,
  demoId,
  demoTime,
} from "./demo-content";

function metadata() {
  return {
    isDemo: true,
    seedVersion: DEMO_VERSION,
    note: "Data simulasi lokal, bukan hasil model AI.",
  };
}

async function seedApk(
  tx: Prisma.TransactionClient,
  userId: string,
  adminId: string,
  profile: DemoProfile,
  at: Date,
  secondary: boolean,
) {
  const key = secondary ? "secondary" : "primary";
  const target = `[DEMO] ${secondary ? "promo-latihan.apk" : profile.filename}`;
  const result = investigationResultSchema.parse({
    riskLevel: secondary ? "MEDIUM" : profile.riskLevel,
    riskScore: secondary ? 42 : profile.riskScore,
    scamCategory: `[DEMO] ${secondary ? "Izin aplikasi promosi" : profile.title}`,
    summary: `[DEMO] Skenario fiktif untuk mengisi tampilan lokal. ${secondary ? "Aplikasi promosi meminta akses kontak yang perlu ditinjau." : profile.title + "."} Skor dan bukti merupakan simulasi seeder, bukan pemeriksaan berkas atau keluaran AI. Izin tidak membuktikan pencurian data.`,
    deceptionTricks: [
      "[DEMO] Ajakan memasang aplikasi dari pesan yang sumbernya belum diverifikasi.",
    ],
    technicalEvidence: {
      permissions: secondary ? ["android.permission.READ_CONTACTS"] : profile.permissions,
    },
    analysisSource: DEMO_ANALYSIS_SOURCE,
    modelVersion: "demo-fixture-v1",
  });
  const record = await tx.forensicRecord.upsert({
    where: { id: demoId(profile.key, "apk", key) },
    update: {},
    create: {
      id: demoId(profile.key, "apk", key),
      userId,
      target,
      type: "APK",
      status: "COMPLETED",
      ...result,
      defangedTarget: defangTarget(target),
      inputMetadata: metadata(),
      createdAt: at,
      updatedAt: at,
      startedAt: at,
      finishedAt: at,
    },
  });
  if (record.userId !== userId) throw new Error("Pemilik rekaman demo tidak sesuai.");
  const existing = await tx.communityReplay.findUnique({ where: { sourceRecordId: record.id } });
  if (existing) return;
  const report = buildCommunityReport(serializeInvestigation(record));
  if (!report) return;
  const status = secondary ? profile.secondaryStatus : "APPROVED";
  const reviewed = status !== "PENDING_REVIEW";
  const reason =
    status === "REJECTED"
      ? "[DEMO] Contoh penolakan: narasi perlu diperjelas sebelum dipublikasikan. Tidak ada pengajuan nyata."
      : "[DEMO] Snapshot fiktif untuk latihan lokal, tanpa data korban atau hasil AI nyata.";
  const replay = await tx.communityReplay.create({
    data: {
      id: demoId(profile.key, "case", key),
      userId,
      sourceRecordId: record.id,
      title: `[DEMO] ${secondary ? "Pengajuan izin aplikasi promosi" : profile.title}`,
      description: report.summary,
      scamType: report.scamCategory,
      sanitizedData: report,
      consentedAt: at,
      status,
      reviewerId: reviewed ? adminId : null,
      reviewedAt: reviewed ? at : null,
      adminNotes: reviewed ? reason : null,
      createdAt: at,
      updatedAt: at,
    },
  });
  if (reviewed) {
    await tx.adminAuditLog.upsert({
      where: { id: demoId(profile.key, "review", key) },
      update: {},
      create: {
        id: demoId(profile.key, "review", key),
        actorId: adminId,
        action: status === "APPROVED" ? "CASE_APPROVED" : "CASE_REJECTED",
        entityType: "COMMUNITY_CASE",
        entityId: replay.id,
        reason,
        details: { ...metadata(), privacyConfirmed: status === "APPROVED" },
        createdAt: at,
      },
    });
  }
}

export async function seedDemoRecords(
  database: PrismaClient,
  userId: string,
  adminId: string,
  profile: DemoProfile,
  now: Date,
) {
  await database.$transaction(
    async (tx) => {
      const user = await tx.user.update({ where: { id: userId }, data: { exp: { increment: 0 } } });
      if (user.suspendedAt || user.role !== "USER") return;
      if (profile.items && profile.items.length > 0) {
        for (const item of profile.items) {
          const target = item.target;
          const at = demoTime(now, item.daysAgo, user.createdAt);
          const result = investigationResultSchema.parse({
            riskLevel: item.riskLevel,
            riskScore: item.riskScore,
            scamCategory: `[DEMO] ${item.scamCategory}`,
            summary: `[DEMO] ${item.summary}`,
            deceptionTricks: item.deceptionTricks.map((trick) => `[DEMO] ${trick}`),
            technicalEvidence: {},
            analysisSource: DEMO_ANALYSIS_SOURCE,
            modelVersion: "demo-fixture-v1",
          });
          const record = await tx.forensicRecord.upsert({
            where: { id: demoId(profile.key, item.key) },
            update: {},
            create: {
              id: demoId(profile.key, item.key),
              userId,
              target,
              type: item.type,
              status: "COMPLETED",
              ...result,
              defangedTarget: defangTarget(target),
              inputMetadata: metadata(),
              createdAt: at,
              updatedAt: at,
              startedAt: at,
              finishedAt: at,
            },
          });
          if (record.userId !== userId) throw new Error("Pemilik rekaman demo tidak sesuai.");
        }
      } else {
        for (const type of ["URL", "QR"] as const) {
          const target = `https://${profile.key}-latihan.example/${type === "QR" ? "kode-qr" : "konfirmasi"}`;
          const at = demoTime(now, type === "URL" ? 5 : 3, user.createdAt);
          const record = await tx.forensicRecord.upsert({
            where: { id: demoId(profile.key, type.toLowerCase()) },
            update: {},
            create: {
              id: demoId(profile.key, type.toLowerCase()),
              userId,
              target,
              type,
              status: "UNAVAILABLE",
              defangedTarget: defangTarget(target),
              summary:
                "[DEMO] Input sintetis tersimpan. Model V6 tidak dijalankan oleh seeder; skor dan risiko tidak ditentukan.",
              analysisSource: DEMO_ANALYSIS_SOURCE,
              inputMetadata: metadata(),
              errorCode: "DEMO_NO_MODEL_RUN",
              errorMessage: "[DEMO] Rekaman contoh tanpa pemanggilan model AI.",
              createdAt: at,
              updatedAt: at,
              finishedAt: at,
            },
          });
          if (record.userId !== userId) throw new Error("Pemilik rekaman demo tidak sesuai.");
        }
      }
      await seedApk(tx, userId, adminId, profile, demoTime(now, 8, user.createdAt), false);
      await seedApk(tx, userId, adminId, profile, demoTime(now, 1, user.createdAt), true);
    },
    { timeout: 15000 },
  );
}
