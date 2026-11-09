import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sandboxAvailable } from "@/lib/sandbox/provider";

type Service = {
  id: string;
  name: string;
  status: "healthy" | "unavailable" | "not_configured" | "configured";
  message: string;
  version: string | null;
  productionReady: boolean | null;
};
async function modelHealth(): Promise<Service> {
  const result: Service = {
    id: "model",
    name: "Model URL / QR V6",
    status: "not_configured",
    message: "Alamat layanan model belum dikonfigurasi.",
    version: null,
    productionReady: null,
  };
  const configured = process.env.GUARDIAN_ML_URL?.trim();
  if (!configured) return result;
  try {
    const base = new URL(configured);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== "/"
    )
      return result;
    const response = await fetch(new URL("/health", base), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error("health");
    const value = z
      .object({
        model_available: z.boolean(),
        production_ready: z.boolean(),
        model_version: z.string().max(191).optional(),
        model_id: z.string().max(191).optional(),
      })
      .parse(await response.json());
    return {
      ...result,
      status: value.model_available ? "healthy" : "unavailable",
      message: value.model_available
        ? "Model dapat dimuat. Kesiapan produksi mengikuti status layanan."
        : "Layanan merespons, artefak model belum tersedia.",
      version: value.model_version ?? value.model_id ?? null,
      productionReady: value.production_ready,
    };
  } catch {
    return {
      ...result,
      status: "unavailable",
      message: "Layanan model tidak merespons health check yang valid.",
    };
  }
}
export async function getAdminMonitor() {
  const [model, broker, database, sessions, delivery, latest] = await Promise.all([
    modelHealth(),
    (async (): Promise<Service> => {
      const configured = Boolean(process.env.SANDBOX_BROKER_URL && process.env.SANDBOX_BROKER_KEY);
      if (!configured)
        return {
          id: "sandbox",
          name: "Browser sandbox",
          status: "not_configured",
          message: "Broker sandbox belum dikonfigurasi.",
          version: null,
          productionReady: null,
        };
      const available = await sandboxAvailable();
      return {
        id: "sandbox",
        name: "Browser sandbox",
        status: available ? "healthy" : "unavailable",
        message: available
          ? "Broker melaporkan browser tersedia. Sesi maksimal 180 detik."
          : "Broker atau browser belum tersedia.",
        version: null,
        productionReady: null,
      };
    })(),
    (async (): Promise<Service> => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          id: "database",
          name: "Database",
          status: "healthy",
          message: "Koneksi database tersedia.",
          version: null,
          productionReady: null,
        };
      } catch {
        return {
          id: "database",
          name: "Database",
          status: "unavailable",
          message: "Koneksi database gagal.",
          version: null,
          productionReady: null,
        };
      }
    })(),
    prisma.sandboxSession
      .findMany({
        where: { status: { in: ["ACTIVE", "STARTING"] }, expiresAt: { gt: new Date() } },
        select: { id: true, type: true, status: true, startedAt: true, expiresAt: true },
        orderBy: { expiresAt: "asc" },
        take: 50,
      })
      .catch(() => null),
    prisma.authChallenge
      .groupBy({
        by: ["deliveryStatus"],
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
        _count: { _all: true },
      })
      .catch(() => null),
    prisma.forensicRecord
      .findFirst({
        where: { analysisSource: "GUARDIAN_ML", status: "COMPLETED", modelVersion: { not: null } },
        select: { modelVersion: true },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null),
  ]);
  const otpConfigured = Boolean(process.env.FONNTE_TOKEN?.trim());
  const count = (status: string) =>
    delivery
      ?.filter((row) => row.deliveryStatus === status)
      .reduce((sum, row) => sum + row._count._all, 0) ?? 0;
  return {
    checkedAt: new Date().toISOString(),
    latestModelVersion: latest?.modelVersion ?? null,
    services: [
      database,
      model,
      broker,
      {
        id: "otp",
        name: "Pengiriman OTP WhatsApp",
        status: otpConfigured ? ("configured" as const) : ("not_configured" as const),
        message: otpConfigured
          ? "Token tersedia. Status ini bukan pemeriksaan pengiriman langsung."
          : "Token Fonnte belum dikonfigurasi.",
        version: null,
        productionReady: null,
      },
    ],
    activeSessions:
      sessions?.map((row) => ({
        ...row,
        startedAt: row.startedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })) ?? null,
    deliveries: delivery
      ? {
          queued: count("QUEUED"),
          failed: count("FAILED"),
          pending: delivery
            .filter((row) => row.deliveryStatus === null)
            .reduce((sum, row) => sum + row._count._all, 0),
        }
      : null,
  };
}
