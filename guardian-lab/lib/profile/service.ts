import type { z } from "zod";
import { academyProgress } from "@/lib/academy/progress";
import { maskPhone } from "@/lib/auth/otp/core";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { profileSchema, type profileUpdateSchema } from "@/lib/validations/profile";

export async function getProfile(userId: string) {
  const [user, investigations, progress] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, suspendedAt: null, phoneVerifiedAt: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerifiedAt: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.forensicRecord.count({ where: { userId } }),
    academyProgress(userId),
  ]);
  if (!user?.phone) throw new InputError("Sesi sudah berubah. Silakan masuk kembali.", 401);
  return profileSchema.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: maskPhone(user.phone),
    verified: Boolean(user.phoneVerifiedAt),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    investigations,
    progress,
  });
}

export async function updateProfile(userId: string, input: z.infer<typeof profileUpdateSchema>) {
  return prisma.$transaction(async (tx) => {
    const matched = await tx.user.updateMany({
      where: {
        id: userId,
        updatedAt: new Date(input.revision),
        suspendedAt: null,
        phoneVerifiedAt: { not: null },
        phone: { not: null },
      },
      data: { name: input.name },
    });
    if (!matched.count)
      throw new InputError("Data akun telah berubah. Muat ulang profil sebelum menyimpan.", 409);
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, updatedAt: true },
    });
    return { name: user.name, updatedAt: user.updatedAt.toISOString() };
  });
}
