"use client";

import { CheckCheck, Loader2, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import shared from "./academy.module.css";
import { AcademyProblem } from "./academy-page-state";
import styles from "./quiz-lesson.module.css";
import { QuizLessonHeader } from "./quiz-lesson-header";
import { QuizLessonSkeleton } from "./quiz-lesson-skeleton";
import { QuizOutcome } from "./quiz-outcome";
import { QuizQuestion } from "./quiz-question";
import { QuizStudySidebar } from "./quiz-study-sidebar";
import { useQuizAttempt } from "./use-quiz-attempt";

export function QuizLessonView({ id, scope }: { id: string; scope: string }) {
  const attempt = useQuizAttempt(id, scope);
  const quiz = attempt.resource.data;
  if (attempt.resource.loading) return <QuizLessonSkeleton />;
  if (!quiz || attempt.resource.problem)
    return (
      <AcademyProblem lesson problem={attempt.resource.problem} retry={attempt.resource.retry} />
    );
  const answeredCount = quiz.questions.filter(
    (question) => attempt.answers[question.id]?.length,
  ).length;
  return (
    <div className={styles.lesson}>
      <QuizLessonHeader quiz={quiz} passed={attempt.result?.passed} />
      {attempt.result && <QuizOutcome result={attempt.result} />}
      <div className={styles.studyLayout}>
        <QuizStudySidebar
          quiz={quiz}
          answers={attempt.answers}
          answeredCount={answeredCount}
          result={attempt.result}
          pending={attempt.pending}
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void attempt.submit();
          }}
          className={styles.quizForm}
          aria-label="Jawaban latihan"
          aria-busy={attempt.pending}
        >
          <div className={styles.formHeading} data-user-reveal>
            <div>
              <h2>{attempt.result ? "Pembahasan latihan" : "Waktunya mengasah kepekaan."}</h2>
              <p>
                {attempt.result
                  ? "Baca alasan di balik setiap jawaban untuk memperkuat pemahamanmu."
                  : "Baca pertanyaannya, lalu pilih jawaban yang paling sesuai."}
              </p>
            </div>
            <span>{quiz.questions.length} soal</span>
          </div>
          {quiz.questions.map((question, index) => (
            <QuizQuestion
              key={question.id}
              question={question}
              index={index}
              selected={attempt.answers[question.id] ?? []}
              feedback={attempt.result?.feedback.find((item) => item.questionId === question.id)}
              disabled={attempt.pending || Boolean(attempt.result)}
              onChoose={(optionId) => attempt.choose(question.id, optionId, question.multiple)}
            />
          ))}
          {attempt.error && (
            <p role="alert" className={styles.error}>
              {attempt.error}
            </p>
          )}
          {!attempt.result && (
            <div className={styles.submitPanel} id="quiz-submit">
              <div className={styles.submitCopy}>
                <FeatureIcon name="quiz" />
                <div>
                  <strong>
                    {answeredCount === quiz.questions.length
                      ? "Semua pilihan sudah terisi."
                      : "Periksa jawabanmu sekali lagi."}
                  </strong>
                  <p>
                    {answeredCount} dari {quiz.questions.length} soal terjawab.
                  </p>
                </div>
              </div>
              <button type="submit" disabled={attempt.pending} className={shared.primaryButton}>
                {attempt.pending ? (
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                    size={17}
                  />
                ) : (
                  <Send aria-hidden="true" size={17} />
                )}
                {attempt.pending ? "Menyimpan jawaban..." : "Kirim jawaban"}
              </button>
            </div>
          )}
        </form>
      </div>
      {attempt.result && (
        <div className={styles.reviewActions}>
          <button
            type="button"
            className={shared.secondaryButton}
            onClick={() => window.location.reload()}
          >
            <RotateCcw aria-hidden="true" size={17} />
            Latihan ulang
          </button>
          <Link href={PROTECTED_ROUTES.academy} className={shared.primaryButton}>
            <CheckCheck aria-hidden="true" size={17} />
            Kembali ke perjalananmu
          </Link>
        </div>
      )}
    </div>
  );
}
