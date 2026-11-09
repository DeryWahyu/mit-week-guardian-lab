import type { z } from "zod";
import type { FeatureIconName } from "@/components/shared/feature-icon";
import type {
  academyProgressSchema,
  quizDetailSchema,
  quizResultSchema,
  quizSummarySchema,
} from "@/lib/validations/academy";

export type AcademyProgress = z.infer<typeof academyProgressSchema>;
export type AcademyQuiz = z.infer<typeof quizSummarySchema>;
export type AcademyLesson = z.infer<typeof quizDetailSchema>;
export type AcademyResult = z.infer<typeof quizResultSchema>;

export const academyTopics = {
  SPOT_THE_PHISH: { label: "Kenali phishing", icon: "link" },
  SOCIAL_ENGINEERING: { label: "Rekayasa sosial", icon: "messages" },
  DANGEROUS_PERMISSIONS: { label: "Izin aplikasi", icon: "permissions" },
} satisfies Record<AcademyQuiz["category"], { label: string; icon: FeatureIconName }>;

export function formatStudyDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tanggal belum tersedia"
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(date);
}
