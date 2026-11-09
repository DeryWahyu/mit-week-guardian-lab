import type { Prisma } from "@prisma/client";
import { appendAudit } from "@/lib/admin/audit";
import { lockAdmin } from "@/lib/admin/security";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import { sanitizeShareText } from "@/lib/share-card/content";
import { type QuizInput, quizInputSchema } from "@/lib/validations/academy";
import type { ThumbnailChange } from "./thumbnail";

const quizInclude = {
  questions: { orderBy: { order: "asc" } },
  thumbnail: { select: { version: true } },
} satisfies Prisma.QuizInclude;
function serializeAdminQuiz(record: Prisma.QuizGetPayload<{ include: typeof quizInclude }>) {
  const { thumbnail, ...quiz } = record;
  return {
    ...quiz,
    thumbnailUrl: thumbnail ? API_ROUTES.quizThumbnail(quiz.id, thumbnail.version) : null,
  };
}
export async function adminQuizzes(page = 1) {
  const records = await prisma.quiz.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 10,
    skip: (page - 1) * 10,
    include: quizInclude,
  });
  return records.map(serializeAdminQuiz);
}
function clean(input: QuizInput) {
  return {
    ...input,
    title: sanitizeShareText(input.title),
    description: sanitizeShareText(input.description),
    questions: input.questions.map((q, i) => ({
      ...q,
      order: i + 1,
      questionText: sanitizeShareText(q.questionText),
      explanation: sanitizeShareText(q.explanation),
      options: q.options.map((o) => ({ id: o.id, text: sanitizeShareText(o.text) })),
    })),
  };
}
export async function saveQuiz(
  input: QuizInput,
  id?: string,
  revision?: string,
  actorId?: string,
  thumbnail?: ThumbnailChange,
) {
  const sanitized = clean(input);
  quizInputSchema.parse(sanitized);
  const { questions, ...fields } = sanitized;
  return prisma.$transaction(
    async (tx) => {
      if (actorId) await lockAdmin(tx, actorId);
      let quizId: string;
      if (id) {
        const matched = await tx.quiz.updateMany({
          where: { id, updatedAt: revision ? new Date(revision) : undefined },
          data: { ...fields, updatedAt: new Date() },
        });
        if (!matched.count)
          throw new InputError("Kuis telah berubah. Muat ulang sebelum menyimpan.", 409);
        await tx.quizQuestion.deleteMany({ where: { quizId: id } });
        await tx.quizQuestion.createMany({
          data: questions.map((q) => ({
            ...q,
            quizId: id,
            options: q.options as Prisma.InputJsonValue,
          })),
        });
        quizId = id;
      } else {
        const created = await tx.quiz.create({
          data: { ...fields, questions: { create: questions } },
          select: { id: true },
        });
        quizId = created.id;
      }
      if (thumbnail === null) await tx.quizThumbnail.deleteMany({ where: { quizId } });
      else if (thumbnail)
        await tx.quizThumbnail.upsert({
          where: { quizId },
          create: { quizId, ...thumbnail },
          update: thumbnail,
        });
      if (actorId)
        await appendAudit(tx, {
          actorId,
          action: id ? "QUIZ_UPDATED" : "QUIZ_CREATED",
          entityType: "QUIZ",
          entityId: quizId,
          details: {
            title: fields.title,
            published: fields.published,
            questions: questions.length,
            expReward: fields.expReward,
            thumbnail: thumbnail === undefined ? "unchanged" : thumbnail ? "replaced" : "removed",
          },
        });
      return serializeAdminQuiz(
        await tx.quiz.findUniqueOrThrow({ where: { id: quizId }, include: quizInclude }),
      );
    },
    { isolationLevel: "ReadCommitted" },
  );
}
export async function archiveQuiz(id: string, actorId?: string) {
  return prisma.$transaction(
    async (tx) => {
      if (actorId) await lockAdmin(tx, actorId);
      await tx.$queryRaw`SELECT id FROM Quiz WHERE id = ${id} FOR UPDATE`;
      const quiz = await tx.quiz.findUnique({ where: { id } });
      if (!quiz) throw new InputError("Kuis tidak ditemukan.", 404);
      if (quiz.published) {
        await tx.quiz.update({ where: { id }, data: { published: false } });
        if (actorId)
          await appendAudit(tx, {
            actorId,
            action: "QUIZ_ARCHIVED",
            entityType: "QUIZ",
            entityId: id,
            details: { title: sanitizeShareText(quiz.title), previousPublished: true },
          });
      }
      return {
        success: true,
        message: "Kuis diarsipkan. Riwayat dan EXP pengguna tetap tersimpan.",
      };
    },
    { isolationLevel: "ReadCommitted" },
  );
}
