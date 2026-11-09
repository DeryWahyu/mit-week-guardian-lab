import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { phoneSchema } from "@/lib/validations/auth";

export const demoAccounts = [
  { email: "admin@gmail.com", name: "Admin", role: "ADMIN" as const, phone: "08132745175" },
  {
    email: "gading@gmail.com",
    name: "Alfian Gading Saputra",
    role: "USER" as const,
    phone: "0895363116378",
  },
  {
    email: "dery@gmail.com",
    name: "Dery Wahyu Perdana",
    role: "USER" as const,
    phone: "082377341268",
  },
  { email: "rafli@gmail.com", name: "Rafli Maulana", role: "USER" as const, phone: "085367271303" },
];

export async function seedDemoAccounts(database: PrismaClient) {
  const ids: string[] = [];
  const accounts = demoAccounts.map((account) => ({
    ...account,
    phone: phoneSchema.parse(account.phone),
  }));
  if (new Set(accounts.map((account) => account.phone)).size !== accounts.length) {
    throw new Error("Nomor WhatsApp akun demo harus unik sebelum seed dijalankan.");
  }
  for (const account of accounts) {
    const existing = await database.user.findUnique({ where: { email: account.email } });
    const passwordMatches = existing
      ? await verifyPassword("password", existing.passwordHash)
      : false;
    const passwordHash =
      passwordMatches && existing ? existing.passwordHash : await hashPassword("password");
    const phone = account.phone;
    const phoneChanged = Boolean(existing && existing.phone !== phone);
    const verifiedAt = phoneChanged ? new Date() : (existing?.phoneVerifiedAt ?? new Date());
    const invalidateSessions = Boolean(
      existing && (!passwordMatches || existing.role !== account.role || phoneChanged),
    );
    const joinDate = new Date(Date.now() - 30 * 86_400_000);
    const user = await database.$transaction(async (tx) => {
      const saved = await tx.user.upsert({
        where: { email: account.email },
        create: {
          ...account,
          phone,
          passwordHash,
          phoneVerifiedAt: verifiedAt,
          createdAt: joinDate,
        },
        update: {
          name: account.name,
          role: account.role,
          phone,
          passwordHash,
          phoneVerifiedAt: verifiedAt,
        },
      });
      if (invalidateSessions) {
        await tx.session.deleteMany({ where: { userId: saved.id } });
        await tx.authChallenge.deleteMany({ where: { userId: saved.id } });
      }
      return saved;
    });
    ids.push(user.id);
  }
  return ids;
}
