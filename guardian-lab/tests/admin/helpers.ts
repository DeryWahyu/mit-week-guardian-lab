import { randomInt, randomUUID } from "node:crypto";
import type { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
export async function fixtureUser(role: Role = "USER", verified = true) {
  return prisma.user.create({
    data: {
      name: "Admin operation fixture",
      email: `admin-ops-${randomUUID()}@example.test`,
      passwordHash: await hash("AdminFixture2026!", 4),
      role,
      phone: `+628${randomInt(1000000000, 9999999999)}`,
      phoneVerifiedAt: verified ? new Date() : null,
      exp: 123,
    },
  });
}
export async function tokenFor(id: string) {
  return createSessionToken(await prisma.user.findUniqueOrThrow({ where: { id } }));
}
export function request(path: string, token = "", method = "GET", body?: unknown) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      Origin: "http://localhost:3000",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
export const context = (id: string) => ({ params: Promise.resolve({ id }) });
export async function cleanupUsers(ids: string[]) {
  await prisma.adminInvestigationReview.deleteMany({ where: { reviewerId: { in: ids } } });
  await prisma.adminAuditLog.deleteMany({ where: { actorId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
