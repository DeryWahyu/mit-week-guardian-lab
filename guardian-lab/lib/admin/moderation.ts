import { Prisma } from "@prisma/client";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { appendAudit } from "./audit";
import { cleanAdminReason, lockAdmin } from "./security";
export async function withdrawCommunityCase(actorId: string, id: string, rawReason: string) {
  const reason = cleanAdminReason(rawReason);
  return prisma.$transaction(
    async (tx) => {
      await lockAdmin(tx, actorId);
      await tx.$queryRaw`SELECT id FROM CommunityReplay WHERE id = ${id} FOR UPDATE`;
      const record = await tx.communityReplay.findUnique({ where: { id } });
      if (!record) throw new InputError("Kasus tidak ditemukan.", 404);
      if (record.status !== "APPROVED" || record.withdrawnAt)
        throw new InputError("Hanya publikasi aktif yang dapat ditarik.", 409);
      await tx.communityReplay.update({
        where: { id },
        data: { withdrawnAt: new Date(), withdrawalReason: reason },
      });
      await appendAudit(tx, {
        actorId,
        action: "CASE_WITHDRAWN",
        entityType: "COMMUNITY_CASE",
        entityId: id,
        reason,
        details: { previousStatus: "APPROVED", publication: "WITHDRAWN" },
      });
      return { success: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
