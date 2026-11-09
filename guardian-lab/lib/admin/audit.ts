import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { adminActions, adminQuerySchema } from "@/lib/validations/admin";
import { redactAdminText } from "./security";

type AuditAction = (typeof adminActions)[number];
export async function appendAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    reason?: string;
    details?: Prisma.InputJsonObject;
  },
) {
  return tx.adminAuditLog.create({
    data: {
      ...input,
      reason: input.reason ? redactAdminText(input.reason) : null,
      details: Object.fromEntries(
        Object.entries(input.details ?? {}).map(([key, value]) => [
          key,
          typeof value === "string" ? redactAdminText(value) : value,
        ]),
      ),
    },
  });
}
export async function listAudit(query: z.infer<typeof adminQuerySchema>) {
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.actor ? { actorId: query.actor } : {}),
    ...(query.q
      ? {
          OR: [
            { entityId: { contains: query.q } },
            { reason: { contains: query.q } },
            { actor: { name: { contains: query.q } } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction(
    [
      prisma.adminAuditLog.findMany({
        where,
        include: { actor: { select: { name: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * 20,
        take: 20,
      }),
      prisma.adminAuditLog.count({ where }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    items: items.map(({ actor, ...item }) => ({
      ...item,
      actor: actor?.name ?? "Akun tidak tersedia",
      createdAt: item.createdAt.toISOString(),
    })),
    pagination: {
      page: query.page,
      pageSize: 20,
      total,
      totalPages: Math.max(1, Math.ceil(total / 20)),
    },
  };
}
