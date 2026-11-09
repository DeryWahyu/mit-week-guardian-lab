import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { clientKey, codeDigest, digest, getPending, rateLimit, reservePhoneCooldown } from "./core";
import { sendWhatsApp } from "./fonnte";

export async function sendOtp(token: string, request: Request) {
  const pending = await getPending(token);
  if (!pending || (pending.purpose !== "VERIFY" && pending.purpose !== "RESET"))
    return { ok: false, reason: "expired" as const };
  const now = new Date();
  if (pending.lastSentAt && now.getTime() - pending.lastSentAt.getTime() < 60000)
    return { ok: false, reason: "cooldown" as const };
  if (!(await reservePhoneCooldown(pending.phoneHash)))
    return { ok: false, reason: "cooldown" as const };
  const [phoneAllowed, ipAllowed] = await Promise.all([
    rateLimit("otp-phone", pending.phoneHash, 5),
    rateLimit("otp-ip", clientKey(request), 100),
  ]);
  if (!phoneAllowed || !ipAllowed) return { ok: false, reason: "limited" as const };
  const code = randomInt(0, 1000000).toString().padStart(6, "0");
  const reserved = await prisma.authChallenge.updateMany({
    where: {
      id: pending.id,
      purpose: pending.purpose,
      consumedAt: null,
      expiresAt: { gt: now },
      lastSentAt: pending.lastSentAt,
    },
    data: {
      codeHash: codeDigest(pending.tokenHash, pending.purpose, code),
      codeExpiresAt: new Date(now.getTime() + 600000),
      deliveryStatus: null,
      attempts: 0,
      lastSentAt: now,
    },
  });
  if (!reserved.count) return { ok: false, reason: "cooldown" as const };
  const phone = pending.user?.phone;
  if (!phone || digest(`phone:${phone}`) !== pending.phoneHash) return { ok: true, queued: false };
  const queued = await sendWhatsApp(phone, code);
  await prisma.authChallenge.updateMany({
    where: {
      id: pending.id,
      codeHash: codeDigest(pending.tokenHash, pending.purpose, code),
      consumedAt: null,
    },
    data: { deliveryStatus: queued ? "QUEUED" : "FAILED" },
  });
  return { ok: true, queued };
}
