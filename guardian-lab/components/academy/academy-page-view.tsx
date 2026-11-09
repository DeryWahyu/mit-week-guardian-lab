"use client";

import { z } from "zod";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { academyProgressSchema, quizSummarySchema } from "@/lib/validations/academy";
import { AcademyActivity } from "./academy-activity";
import { AcademyCatalog } from "./academy-catalog";
import { AcademyHero } from "./academy-hero";
import { AcademyProblem, AcademySkeleton } from "./academy-page-state";
import { AcademyProgressPanel } from "./academy-progress-panel";
import { AcademyStats } from "./academy-stats";
import styles from "./academy.module.css";

const listSchema = z.array(quizSummarySchema);
export function AcademyPageView({ scope }: { scope: string }) {
  const list = useApiResource(API_ROUTES.quizzes, listSchema, { scope });
  const progress = useApiResource(API_ROUTES.academyProgress, academyProgressSchema, { scope });
  if (list.loading || progress.loading) return <AcademySkeleton />;
  if (list.problem || progress.problem || !list.data || !progress.data)
    return (
      <AcademyProblem
        problem={list.problem ?? progress.problem}
        retry={() => {
          list.retry();
          progress.retry();
        }}
      />
    );
  const next = list.data.find((quiz) => !quiz.isCompleted) ?? list.data[0];
  return (
    <div className={styles.pageContent}>
      <AcademyHero next={next} />
      <AcademyStats progress={progress.data} />
      <AcademyCatalog quizzes={list.data} />
      <AcademyProgressPanel progress={progress.data} quizzes={list.data} />
      <AcademyActivity attempts={progress.data.recentAttempts} />
    </div>
  );
}
