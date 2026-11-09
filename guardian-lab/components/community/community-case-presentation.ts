import type { z } from "zod";
import type { quizResultSchema } from "@/lib/validations/academy";
import type { communityChallengeSchema } from "@/lib/validations/community-challenge";

export type CaseChallenge = z.infer<typeof communityChallengeSchema>;
export type CaseChallengeResult = z.infer<typeof quizResultSchema>;

export function caseDate(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value)) + " WIB"
    : "Belum tersedia";
}

export function caseTypeIcon(type: string | undefined) {
  return type === "APK" ? "apk" : type === "QR" ? "qr" : type === "URL" ? "url" : "record";
}
