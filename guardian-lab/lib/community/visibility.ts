import type { Prisma } from "@prisma/client";

export const publishedCommunityWhere: Prisma.CommunityReplayWhereInput = {
  status: "APPROVED",
  withdrawnAt: null,
  consentedAt: { not: null },
  sourceRecordId: { not: null },
  sanitizedData: { path: "$.schemaVersion", equals: 1 },
};
