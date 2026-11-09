import type { Quiz, QuizQuestion } from "@prisma/client";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import { optionSchema } from "@/lib/validations/academy";

export function readQuestion(q: QuizQuestion) {
  const options = optionSchema.array().min(2).max(6).parse(q.options);
  const correctAnswers = Array.isArray(q.correctAnswers)
    ? q.correctAnswers.filter((v): v is string => typeof v === "string")
    : [];
  if (!correctAnswers.length || correctAnswers.some((id) => !options.some((o) => o.id === id)))
    throw new InputError("Kuis belum siap. Hubungi admin.", 409);
  return { ...q, options, correctAnswers };
}
export async function quizList(userId: string) {
  const quizzes = await prisma.quiz.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { questions: true } },
      thumbnail: { select: { version: true } },
      attempts: { where: { userId, passed: true }, select: { id: true }, take: 1 },
    },
  });
  return quizzes
    .filter((q) => q._count.questions > 0)
    .map((q) => summary(q, q.attempts.length > 0, q._count.questions));
}
export function summary(
  q: Quiz & { thumbnail?: { version: string } | null },
  completed: boolean,
  questionCount: number,
) {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    difficulty: q.difficulty,
    expReward: q.expReward,
    isCompleted: completed,
    questionCount,
    thumbnailUrl: q.thumbnail ? API_ROUTES.quizThumbnail(q.id, q.thumbnail.version) : null,
  };
}
export async function quizDetail(id: string, userId: string, admin: boolean) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      thumbnail: { select: { version: true } },
      attempts: { where: { userId, passed: true }, select: { id: true }, take: 1 },
    },
  });
  if (!quiz || (!quiz.published && !admin)) throw new InputError("Kuis tidak ditemukan.", 404);
  if (!quiz.questions.length) throw new InputError("Kuis belum memiliki soal.", 409);
  return {
    ...summary(quiz, quiz.attempts.length > 0, quiz.questions.length),
    revision: quiz.updatedAt.toISOString(),
    questions: quiz.questions.map((raw) => {
      const q = readQuestion(raw);
      return {
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        multiple: q.correctAnswers.length > 1,
      };
    }),
  };
}
