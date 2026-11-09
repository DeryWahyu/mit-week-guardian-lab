import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { learningStreak } from "@/lib/academy/streak";
import { maskPhone } from "@/lib/auth/otp/core";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import type { adminQuerySchema, userActionSchema } from "@/lib/validations/admin";
import { appendAudit } from "./audit";
import { cleanAdminReason, lockAdmin } from "./security";

const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  phoneVerifiedAt: true,
  exp: true,
  streakDays: true,
  lastLearningAt: true,
  lastActiveAt: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { forensicRecords: true, sessions: { where: { expiresAt: { gt: new Date() } } } },
  },
} satisfies Prisma.UserSelect;
type UserRow = Prisma.UserGetPayload<{ select: typeof select }>;
function serialize(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ? maskPhone(user.phone) : null,
    verified: Boolean(user.phoneVerifiedAt),
    exp: user.exp,
    streakDays: learningStreak(user.streakDays, user.lastLearningAt),
    suspendedAt: user.suspendedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastActiveAt: user.lastActiveAt.toISOString(),
    sessions: user._count.sessions,
    investigations: user._count.forensicRecords,
  };
}
export async function listUsers(query: z.infer<typeof adminQuerySchema>) {
  const where: Prisma.UserWhereInput = {
    ...(query.q
      ? { OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }, { id: query.q }] }
      : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { suspendedAt: query.status === "active" ? null : { not: null } } : {}),
    ...(query.verified ? { phoneVerifiedAt: query.verified === "yes" ? { not: null } : null } : {}),
  };
  const freshSelect = {
    ...select,
    _count: {
      select: { forensicRecords: true, sessions: { where: { expiresAt: { gt: new Date() } } } },
    },
  } satisfies Prisma.UserSelect;
  const [items, total] = await prisma.$transaction(
    [
      prisma.user.findMany({
        where,
        select: freshSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
        skip: (query.page - 1) * 20,
      }),
      prisma.user.count({ where }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    items: items.map(serialize),
    pagination: {
      page: query.page,
      pageSize: 20,
      total,
      totalPages: Math.max(1, Math.ceil(total / 20)),
    },
  };
}
export async function userDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...select,
      suspensionReason: true,
      _count: {
        select: { forensicRecords: true, sessions: { where: { expiresAt: { gt: new Date() } } } },
      },
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        select: { id: true, createdAt: true, expiresAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      forensicRecords: {
        select: { id: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      quizAttempts: {
        select: { id: true, score: true, completedAt: true, quiz: { select: { title: true } } },
        orderBy: { completedAt: "desc" },
        take: 10,
      },
    },
  });
  if (!user) throw new InputError("Pengguna tidak ditemukan.", 404);
  return {
    ...serialize(user),
    suspensionReason: user.suspensionReason,
    sessionsList: user.sessions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    })),
    activity: [
      ...user.forensicRecords.map((r) => ({
        id: r.id,
        type: "INVESTIGATION",
        label: `${r.type} · ${r.status}`,
        createdAt: r.createdAt.toISOString(),
      })),
      ...user.quizAttempts.map((a) => ({
        id: a.id,
        type: "QUIZ",
        label: `${a.quiz.title} · ${a.score}/100`,
        createdAt: a.completedAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 15),
  };
}
export async function changeUser(
  actorId: string,
  id: string,
  input: z.infer<typeof userActionSchema>,
) {
  const reason = cleanAdminReason(input.reason);
  if (id === actorId)
    throw new InputError("Akun sendiri tidak dapat diubah melalui pengelolaan pengguna.", 409);
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE role = 'ADMIN' ORDER BY id FOR UPDATE`;
      await lockAdmin(tx, actorId);
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${id} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new InputError("Pengguna tidak ditemukan.", 404);
      if (user.updatedAt.toISOString() !== input.revision)
        throw new InputError("Akun telah berubah. Muat ulang sebelum melanjutkan.", 409);
      if (input.action === "SET_ROLE" && input.role === user.role)
        throw new InputError("Peran tujuan sama dengan peran saat ini.", 409);
      if (input.action === "SET_ROLE" && (!user.phoneVerifiedAt || user.suspendedAt))
        throw new InputError("Perubahan peran memerlukan akun aktif dan terverifikasi.", 409);
      const removesAdmin =
        user.role === "ADMIN" &&
        Boolean(user.phoneVerifiedAt && user.phone) &&
        !user.suspendedAt &&
        (input.action === "SUSPEND" || (input.action === "SET_ROLE" && input.role === "USER"));
      if (
        removesAdmin &&
        (await tx.user.count({
          where: {
            role: "ADMIN",
            suspendedAt: null,
            phoneVerifiedAt: { not: null },
            phone: { not: null },
          },
        })) <= 1
      )
        throw new InputError("Administrator aktif terakhir harus dipertahankan.", 409);
      if (
        (input.action === "SUSPEND" && user.suspendedAt) ||
        (input.action === "RESTORE" && !user.suspendedAt)
      )
        throw new InputError("Status akun sudah berubah. Muat ulang data.", 409);
      const revoke = input.action !== "RESTORE";
      const sessions = revoke
        ? await tx.session.deleteMany({ where: { userId: id } })
        : { count: 0 };
      if (revoke)
        await tx.authChallenge.updateMany({
          where: { userId: id, consumedAt: null },
          data: { consumedAt: new Date() },
        });
      await tx.user.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(input.action === "SUSPEND"
            ? { suspendedAt: new Date(), suspensionReason: reason }
            : {}),
          ...(input.action === "RESTORE" ? { suspendedAt: null, suspensionReason: null } : {}),
          ...(input.action === "SET_ROLE" ? { role: input.role } : {}),
        },
      });
      await appendAudit(tx, {
        actorId,
        action: `USER_${input.action}` as
          "USER_SUSPEND" | "USER_RESTORE" | "USER_REVOKE_SESSIONS" | "USER_SET_ROLE",
        entityType: "USER",
        entityId: id,
        reason,
        details: {
          previousRole: user.role,
          nextRole: input.role ?? user.role,
          revokedSessions: sessions.count,
        },
      });
      return { success: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
