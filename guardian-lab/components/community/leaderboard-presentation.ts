import type { z } from "zod";
import type { rankingEntrySchema, rankingSchema } from "@/lib/validations/platform";

export type RankingEntry = z.infer<typeof rankingEntrySchema>;
export type RankingData = z.infer<typeof rankingSchema>;

export function formatExp(value: number) {
  return value.toLocaleString("id-ID");
}
