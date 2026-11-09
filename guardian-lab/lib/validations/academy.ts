import { z } from "zod";

export const categorySchema = z.enum([
  "SPOT_THE_PHISH",
  "SOCIAL_ENGINEERING",
  "DANGEROUS_PERMISSIONS",
]);
const identifier = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/);
export const optionSchema = z.object({ id: identifier, text: z.string().trim().min(1).max(500) });
export const questionInputSchema = z
  .object({
    questionText: z.string().trim().min(5).max(3000),
    questionType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]).default("MULTIPLE_CHOICE"),
    options: z.array(optionSchema).min(2).max(6),
    correctAnswers: z.array(identifier).min(1).max(6),
    explanation: z.string().trim().min(5).max(3000),
  })
  .superRefine((q, ctx) => {
    const ids = q.options.map((o) => o.id);
    if (
      new Set(ids).size !== ids.length ||
      new Set(q.correctAnswers).size !== q.correctAnswers.length ||
      q.correctAnswers.some((id) => !ids.includes(id))
    )
      ctx.addIssue({
        code: "custom",
        message: "Pilihan dan kunci jawaban harus unik serta saling sesuai.",
      });
    if (q.questionType === "TRUE_FALSE" && (ids.length !== 2 || q.correctAnswers.length !== 1))
      ctx.addIssue({
        code: "custom",
        message: "Benar/salah memerlukan dua pilihan dan satu kunci jawaban.",
      });
  });
export const quizInputSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(10).max(2000),
  category: categorySchema,
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  expReward: z.number().int().min(0).max(500),
  published: z.boolean().default(false),
  questions: z.array(questionInputSchema).min(1).max(30),
});
export type QuizInput = z.infer<typeof quizInputSchema>;
export const quizSubmissionSchema = z
  .object({
    quizId: identifier,
    submissionId: z.uuid(),
    revision: z.iso.datetime(),
    answers: z.record(identifier, z.array(identifier).min(1).max(6)),
  })
  .strict();
export const publicQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  options: z.array(optionSchema),
  multiple: z.boolean(),
});
const thumbnailUrlSchema = z
  .string()
  .regex(/^\/api\/academy\/quizzes\/[\w-]+\/thumbnail\?v=[a-f0-9]{64}$/)
  .nullable()
  .optional();
export const quizSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: categorySchema,
  difficulty: z.string(),
  expReward: z.number(),
  isCompleted: z.boolean(),
  questionCount: z.number(),
  thumbnailUrl: thumbnailUrlSchema,
});
export const quizDetailSchema = quizSummarySchema.extend({
  revision: z.iso.datetime(),
  questions: z.array(publicQuestionSchema),
});
export const quizResultSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  expEarned: z.number(),
  totalQuestions: z.number(),
  correctCount: z.number(),
  newExp: z.number(),
  newStreak: z.number(),
  rank: z.string(),
  feedback: z.array(
    z.object({
      questionId: z.string(),
      questionText: z.string(),
      correct: z.boolean(),
      selected: z.array(z.string()),
      correctAnswers: z.array(z.string()),
      explanation: z.string(),
    }),
  ),
});
export const academyProgressSchema = z.object({
  exp: z.number(),
  streakDays: z.number(),
  rank: z.string(),
  completed: z.number(),
  casesSolved: z.number(),
  attempts: z.number(),
  badges: z.array(
    z.object({ id: z.string(), title: z.string(), description: z.string(), awardedAt: z.string() }),
  ),
  recentAttempts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      score: z.number(),
      expEarned: z.number(),
      completedAt: z.string(),
    }),
  ),
});
export const adminQuizSchema = quizInputSchema.extend({
  id: z.string(),
  updatedAt: z.string(),
  thumbnailUrl: thumbnailUrlSchema,
});
export const adminQuizPageSchema = z.coerce.number().int().min(1).max(10000).default(1);
