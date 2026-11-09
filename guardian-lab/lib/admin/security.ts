import type { Prisma } from "@prisma/client";
import { InputError } from "@/lib/investigations/request-input";
import { sanitizeShareText } from "@/lib/share-card/content";
export async function lockAdmin(tx: Prisma.TransactionClient, actorId: string) {
  await tx.$queryRaw`SELECT id FROM User WHERE id = ${actorId} FOR UPDATE`;
  const actor = await tx.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, suspendedAt: true, phoneVerifiedAt: true, phone: true },
  });
  if (
    !actor ||
    actor.role !== "ADMIN" ||
    actor.suspendedAt ||
    !actor.phoneVerifiedAt ||
    !actor.phone
  )
    throw new InputError("Akses administrator sudah berubah. Masuk kembali.", 403);
  return actor;
}
export function redactAdminText(value: string) {
  const masked = value.replace(
    /\b(password(?:hash)?|passwd|pwd|token|secret|otp|pin|api[_-]?key|authorization|session(?:_?id)?)\s*(?:[:=]\s*|\s+(?=\d{4,8}\b))(?:"[^"]*"|'[^']*'|(?:Bearer\s+)?[^\s,;]+)/gi,
    "$1=[REDACTED]",
  );
  return sanitizeShareText(masked).trim();
}
export function cleanAdminReason(value: string) {
  const clean = redactAdminText(value);
  if (clean.length < 10 || clean.length > 1000)
    throw new InputError("Alasan setelah penyaringan harus 10–1000 karakter.");
  return clean;
}
