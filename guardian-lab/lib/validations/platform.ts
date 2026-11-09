import { z } from "zod";
export const rankingEntrySchema = z.object({
  position: z.number().int(),
  alias: z.string(),
  exp: z.number().int(),
  rank: z.string(),
  streakDays: z.number().int(),
  isCurrentUser: z.boolean(),
});
export const rankingSchema = z.object({
  items: z.array(rankingEntrySchema),
  page: z.number().int(),
  totalPages: z.number().int(),
  total: z.number().int(),
});
export const rankingPageSchema = z.coerce.number().int().min(1).max(100000).default(1);
export const platformOverviewSchema = z.object({
  links: z.number().int(),
  apks: z.number().int(),
  cases: z.number().int(),
  ranking: z.array(rankingEntrySchema),
});
