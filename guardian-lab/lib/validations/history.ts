import { z } from "zod";
import {
  investigationSchema,
  investigationStatusSchema,
  riskLevelSchema,
  scanTypeSchema,
} from "./investigation";

export const historyQuerySchema = z
  .object({
    type: scanTypeSchema.optional(),
    risk: riskLevelSchema.optional(),
    status: investigationStatusSchema.optional(),
    search: z.string().trim().max(200).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine((query) => !query.from || !query.to || Date.parse(query.from) <= Date.parse(query.to), {
    message: "Tanggal akhir tidak boleh sebelum tanggal awal.",
    path: ["to"],
  });

export const historyFiltersSchema = z
  .object({
    type: z.union([scanTypeSchema, z.literal("ALL")]).default("ALL"),
    risk: z.union([riskLevelSchema, z.literal("ALL")]).default("ALL"),
    status: z.union([investigationStatusSchema, z.literal("ALL")]).default("ALL"),
    search: z.string().max(200).default(""),
    from: z.union([z.iso.date(), z.literal("")]).default(""),
    to: z.union([z.iso.date(), z.literal("")]).default(""),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "Tanggal akhir tidak boleh sebelum tanggal awal.",
    path: ["to"],
  });
export type HistoryFilters = z.infer<typeof historyFiltersSchema>;

export function historyRequestParams(filters: HistoryFilters) {
  const params = new URLSearchParams({ page: String(filters.page) });
  for (const key of ["type", "risk", "status"] as const)
    if (filters[key] !== "ALL") params.set(key, filters[key]);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  // Date controls describe local calendar days; the API receives explicit UTC boundaries.
  if (filters.from) params.set("from", new Date(`${filters.from}T00:00:00`).toISOString());
  if (filters.to) params.set("to", new Date(`${filters.to}T23:59:59.999`).toISOString());
  return params;
}

export const historyResponseSchema = z.object({
  records: z.array(investigationSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
  summary: z.object({
    total: z.number().int().nonnegative(),
    highRisk: z.number().int().nonnegative(),
    unavailable: z.number().int().nonnegative(),
    processing: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
});
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
