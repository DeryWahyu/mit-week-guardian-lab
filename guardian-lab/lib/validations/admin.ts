import { z } from "zod";
import { investigationStatusSchema, scanTypeSchema } from "./investigation";
export const adminActions = [
  "USER_SUSPEND",
  "USER_RESTORE",
  "USER_REVOKE_SESSIONS",
  "USER_SET_ROLE",
  "INVESTIGATION_REVIEW",
  "CASE_APPROVED",
  "CASE_REJECTED",
  "CASE_WITHDRAWN",
  "QUIZ_CREATED",
  "QUIZ_UPDATED",
  "QUIZ_ARCHIVED",
  "REPORT_EXPORTED",
] as const;
export const adminQuerySchema = z.object({
  q: z.string().trim().max(150).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  verified: z.enum(["yes", "no"]).optional(),
  action: z.enum(adminActions).optional(),
  actor: z.string().max(191).optional(),
});
export const adminReasonSchema = z.string().trim().min(10, "Alasan minimal 10 karakter.").max(1000);
export const userActionSchema = z
  .object({
    action: z.enum(["SUSPEND", "RESTORE", "REVOKE_SESSIONS", "SET_ROLE"]),
    reason: adminReasonSchema,
    role: z.enum(["USER", "ADMIN"]).optional(),
    revision: z.iso.datetime(),
  })
  .strict()
  .refine((v) => v.action !== "SET_ROLE" || Boolean(v.role), "Pilih peran tujuan.");
export const reviewStatusSchema = z.enum(["REVIEWED", "NEEDS_REVIEW", "ESCALATED"]);
export const investigationReviewSchema = z
  .object({
    status: reviewStatusSchema,
    note: adminReasonSchema,
    revision: z.iso.datetime().nullable(),
  })
  .strict();
export const adminInvestigationQuerySchema = z
  .object({
    q: z.string().trim().max(150).default(""),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    type: scanTypeSchema.optional(),
    status: investigationStatusSchema.optional(),
    review: reviewStatusSchema.optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "Tanggal awal tidak boleh melewati tanggal akhir.",
  );
export const adminRangeSchema = z
  .object({ from: z.iso.date().optional(), to: z.iso.date().optional() })
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "Tanggal awal tidak boleh melewati tanggal akhir.",
  );
const pagination = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
const contact = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  verified: z.boolean(),
  phone: z.string().nullable(),
  exp: z.number(),
  streakDays: z.number(),
  suspendedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastActiveAt: z.string(),
  sessions: z.number(),
  investigations: z.number(),
});
export const adminUsersSchema = z.object({ items: z.array(contact), pagination });
export const adminUserDetailSchema = contact.extend({
  suspensionReason: z.string().nullable(),
  sessionsList: z.array(z.object({ id: z.string(), createdAt: z.string(), expiresAt: z.string() })),
  activity: z.array(
    z.object({ id: z.string(), type: z.string(), label: z.string(), createdAt: z.string() }),
  ),
});
export const adminAuditSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      actor: z.string(),
      actorId: z.string().nullable(),
      action: z.enum(adminActions),
      entityType: z.string(),
      entityId: z.string(),
      reason: z.string().nullable(),
      details: z.record(z.string(), z.json()),
      createdAt: z.string(),
    }),
  ),
  pagination,
});
export const adminReviewSchema = z
  .object({
    status: reviewStatusSchema,
    note: z.string(),
    updatedAt: z.string(),
    reviewer: z.string(),
  })
  .nullable();
export const adminInvestigationsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      target: z.string(),
      type: scanTypeSchema,
      status: investigationStatusSchema,
      riskScore: z.number().nullable(),
      owner: z.string(),
      createdAt: z.string(),
      review: adminReviewSchema,
    }),
  ),
  pagination,
});
export const adminInvestigationDetailSchema = z.object({
  id: z.string(),
  owner: z.string(),
  review: adminReviewSchema,
});
export const adminMonitorSchema = z.object({
  checkedAt: z.string(),
  latestModelVersion: z.string().nullable(),
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["healthy", "unavailable", "not_configured", "configured"]),
      message: z.string(),
      version: z.string().nullable(),
      productionReady: z.boolean().nullable(),
    }),
  ),
  activeSessions: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        status: z.string(),
        startedAt: z.string(),
        expiresAt: z.string(),
      }),
    )
    .nullable(),
  deliveries: z.object({ queued: z.number(), failed: z.number(), pending: z.number() }).nullable(),
});
export const adminReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  totals: z.object({
    users: z.number(),
    newUsers: z.number(),
    investigations: z.number(),
    completed: z.number(),
    failed: z.number(),
    unavailable: z.number(),
    quizAttempts: z.number(),
    quizPassed: z.number(),
    communityPublished: z.number(),
    activeSandbox: z.number(),
  }),
  types: z.array(z.object({ label: z.string(), value: z.number() })),
  statuses: z.array(z.object({ label: z.string(), value: z.number() })),
  daily: z.array(
    z.object({
      date: z.string(),
      investigations: z.number(),
      users: z.number(),
      quizAttempts: z.number(),
    }),
  ),
});
export type AdminUsers = z.infer<typeof adminUsersSchema>;
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type AdminReport = z.infer<typeof adminReportSchema>;
