import type { QuizQuestion } from "@prisma/client";
import { readQuestion } from "@/lib/academy/quiz";
import type { buildChallenge } from "@/lib/community/challenge-questions";

export function demoQuizFeedback(questions: QuizQuestion[], pass: boolean) {
  return questions.map((raw, index) => {
    const question = readQuestion(raw);
    const correct = pass || index >= Math.ceil(questions.length / 2);
    const wrong = question.options.find((option) => !question.correctAnswers.includes(option.id));
    const selected = correct
      ? question.correctAnswers
      : wrong
        ? [wrong.id]
        : question.correctAnswers.slice(0, -1);
    return {
      questionId: question.id,
      questionText: question.questionText,
      correct,
      selected,
      correctAnswers: question.correctAnswers.map(
        (id) => question.options.find((option) => option.id === id)?.text ?? id,
      ),
      explanation: question.explanation,
    };
  });
}

export function demoCaseFeedback(
  questions: ReturnType<typeof buildChallenge>["questions"],
  pass: boolean,
) {
  return questions.map((question, index) => {
    const correct = pass || index >= Math.ceil(questions.length / 2);
    const selected = correct
      ? question.correctId
      : question.options.find((option) => option.id !== question.correctId)?.id;
    if (!selected) throw new Error("Pilihan latihan kasus demo tidak lengkap.");
    return {
      questionId: question.id,
      questionText: question.questionText,
      correct,
      selected: [selected],
      correctAnswers: question.options
        .filter((option) => option.id === question.correctId)
        .map((option) => option.text),
      explanation: question.explanation,
    };
  });
}
