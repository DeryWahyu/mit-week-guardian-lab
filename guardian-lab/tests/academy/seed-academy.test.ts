import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/lib/prisma";
import { seedAcademy } from "@/prisma/seeders/academy";
import { starterLessons } from "@/prisma/seeders/starter-content";

const lessonIds = starterLessons.map((lesson) => lesson.id);

describe("SEED-02: Academy starter content seeding idempotency and safety", () => {
  beforeAll(async () => {
    await prisma.quiz.deleteMany({ where: { id: { in: lessonIds } } });
  });

  afterAll(async () => {
    await prisma.quiz.deleteMany({ where: { id: { in: lessonIds } } });
  });

  it("can be imported directly from @/prisma/seeders/academy", () => {
    expect(typeof seedAcademy).toBe("function");
    expect(starterLessons.length).toBe(3);
  });

  it("populates exactly 3 starter lessons on initial seed without creating demo accounts", async () => {
    const usersBefore = await prisma.user.count();

    await seedAcademy(prisma);

    const quizzes = await prisma.quiz.findMany({
      where: { id: { in: lessonIds } },
      include: { questions: true },
    });

    expect(quizzes.length).toBe(3);
    for (const starter of starterLessons) {
      const found = quizzes.find((q) => q.id === starter.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(starter.title);
      expect(found?.description).toBe(starter.description);
      expect(found?.category).toBe(starter.category);
      expect(found?.difficulty).toBe(starter.difficulty);
      expect(found?.expReward).toBe(starter.expReward);
      expect(found?.published).toBe(starter.published);
      expect(found?.questions.length).toBe(starter.questions.length);
    }

    const usersAfter = await prisma.user.count();
    expect(usersAfter).toBe(usersBefore);
  });

  it("is idempotent when executed multiple times and does not duplicate quizzes or questions", async () => {
    const questionsBefore = await prisma.quizQuestion.count({
      where: { quizId: { in: lessonIds } },
    });
    const totalExpectedQuestions = starterLessons.reduce(
      (acc, lesson) => acc + lesson.questions.length,
      0,
    );
    expect(questionsBefore).toBe(totalExpectedQuestions);

    // Run second time
    await seedAcademy(prisma);

    const quizzes = await prisma.quiz.findMany({
      where: { id: { in: lessonIds } },
      include: { questions: true },
    });

    expect(quizzes.length).toBe(3);
    const questionsAfter = await prisma.quizQuestion.count({
      where: { quizId: { in: lessonIds } },
    });
    expect(questionsAfter).toBe(questionsBefore);
  });

  it("preserves admin modifications and does not overwrite existing quizzes on subsequent runs", async () => {
    const targetQuizId = starterLessons[0].id;
    const modifiedTitle = "Judul Baru Diedit Oleh Admin";
    const modifiedDescription = "Deskripsi baru hasil penyesuaian kurikulum oleh admin.";

    await prisma.quiz.update({
      where: { id: targetQuizId },
      data: {
        title: modifiedTitle,
        description: modifiedDescription,
        expReward: 99,
      },
    });

    // Run seed again
    await seedAcademy(prisma);

    const updatedQuiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: targetQuizId },
    });

    expect(updatedQuiz.title).toBe(modifiedTitle);
    expect(updatedQuiz.description).toBe(modifiedDescription);
    expect(updatedQuiz.expReward).toBe(99);
  });
});
