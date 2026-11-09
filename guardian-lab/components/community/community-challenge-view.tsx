"use client";

import { ArrowRight, Loader2, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { QuizOutcome } from "@/components/academy/quiz-outcome";
import { QuizQuestion } from "@/components/academy/quiz-question";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./community-case.module.css";
import { CommunityChallengeSidebar } from "./community-challenge-sidebar";
import {
  CommunityChallengeProblem,
  CommunityChallengeSkeleton,
} from "./community-challenge-states";
import { useCommunityChallenge } from "./use-community-challenge";

export function CommunityChallengeView({ id, scope }: { id: string; scope: string }) {
  const attempt = useCommunityChallenge(id, scope);
  const data = attempt.resource.data;
  if (attempt.resource.loading) return <CommunityChallengeSkeleton />;
  if (!data || attempt.resource.problem)
    return (
      <CommunityChallengeProblem
        problem={attempt.resource.problem}
        retry={attempt.resource.retry}
      />
    );
  const answered = data.questions.filter((question) => attempt.answers[question.id]).length;
  return (
    <section id="case-challenge" className={styles.challenge} aria-labelledby="challenge-title">
      <header className={styles.challengeHeading} data-user-reveal>
        <FeatureIcon name="casebook" />
        <div>
          <h2 id="challenge-title">Dari bukti, jadi bekal.</h2>
          <p>Uji pemahamanmu berdasarkan snapshot kasus di atas.</p>
        </div>
        <span className={styles.reward}>
          <FeatureIcon name="exp" size="inline" />
          {data.isSolved || attempt.result?.passed
            ? "Latihan ulang"
            : `${data.expReward} EXP saat lulus pertama`}
        </span>
      </header>
      {attempt.result && <QuizOutcome result={attempt.result} />}
      <div className={styles.challengeLayout}>
        <CommunityChallengeSidebar
          challenge={data}
          answers={attempt.answers}
          result={attempt.result}
          pending={attempt.pending}
        />
        <form
          className={styles.challengeForm}
          aria-label="Jawaban latihan kasus"
          aria-busy={attempt.pending}
          onSubmit={(event) => {
            event.preventDefault();
            void attempt.submit();
          }}
        >
          <div className={styles.formHeading} data-user-reveal>
            <div>
              <h3>
                {attempt.result
                  ? "Pahami alasan di balik jawabannya."
                  : "Saatnya membaca petunjuk."}
              </h3>
              <p>
                {attempt.result
                  ? "Cocokkan pembahasan dengan bukti pada kasus."
                  : "Pilih satu jawaban yang paling sesuai di setiap soal."}
              </p>
            </div>
            <span>{data.questions.length} soal</span>
          </div>
          {data.questions.map((question, index) => (
            <QuizQuestion
              key={question.id}
              question={question}
              index={index}
              selected={attempt.answers[question.id] ? [attempt.answers[question.id]] : []}
              feedback={attempt.result?.feedback.find((item) => item.questionId === question.id)}
              disabled={attempt.pending || Boolean(attempt.result)}
              onChoose={(optionId) => attempt.choose(question.id, optionId)}
            />
          ))}
          {attempt.error && (
            <p role="alert" className={styles.error}>
              {attempt.error}
            </p>
          )}
          {!attempt.result && (
            <div id="case-challenge-submit" className={styles.submitPanel}>
              <div>
                <FeatureIcon name="quiz" />
                <div>
                  <strong>
                    {answered === data.questions.length
                      ? "Semua pilihan sudah terisi."
                      : "Tinjau pilihanmu sekali lagi."}
                  </strong>
                  <p>
                    {answered} dari {data.questions.length} soal terjawab.
                  </p>
                </div>
              </div>
              <button type="submit" disabled={attempt.pending} className={styles.primary}>
                {attempt.pending ? (
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Send size={17} aria-hidden="true" />
                )}
                {attempt.pending ? "Menyimpan jawaban..." : "Kirim jawaban kasus"}
              </button>
            </div>
          )}
        </form>
      </div>
      {attempt.result && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={17} aria-hidden="true" />
            Latihan kasus ulang
          </button>
          <Link href={PROTECTED_ROUTES.academy} className={styles.primary}>
            Lanjutkan belajar <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
