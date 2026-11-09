import { z } from "zod";
import { publicQuestionSchema } from "./academy";
export const communityChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  expReward: z.number(),
  isSolved: z.boolean(),
  questions: z.array(publicQuestionSchema),
});
export const communityChallengeSubmissionSchema = z
  .object({
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    submissionId: z.uuid(),
    answers: z.record(z.string().min(1).max(50), z.string().min(1).max(100)),
  })
  .strict();
