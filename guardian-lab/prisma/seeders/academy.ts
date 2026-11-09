import type { PrismaClient } from "@prisma/client";
import { starterLessons } from "./starter-content";

export async function seedAcademy(database: PrismaClient) {
  for (const { questions, ...lesson } of starterLessons) {
    await database.quiz.upsert({
      where: { id: lesson.id },
      update: {},
      create: {
        ...lesson,
        questions: {
          create: questions.map((question, index) => ({ ...question, order: index + 1 })),
        },
      },
    });
  }
}
