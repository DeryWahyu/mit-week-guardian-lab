"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { notifyProfileUpdated } from "@/lib/auth/events";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { quizResultSchema } from "@/lib/validations/academy";
import { communityChallengeSchema } from "@/lib/validations/community-challenge";
export function useCommunityChallenge(id: string, scope: string) {
  const resource = useApiResource(API_ROUTES.replayChallenge(id), communityChallengeSchema, {
    scope,
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<z.infer<typeof quizResultSchema> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const active = useRef<AbortController | null>(null);
  const submission = useRef<string | null>(null);
  useEffect(
    () => () => {
      const current = active.current;
      active.current = null;
      current?.abort();
    },
    [],
  );
  function choose(questionId: string, optionId: string) {
    if (active.current || result) return;
    submission.current = null;
    setError(null);
    setAnswers((old) => ({ ...old, [questionId]: optionId }));
  }
  async function submit() {
    const challenge = resource.data;
    if (active.current || !challenge || result || resource.problem) return;
    if (challenge.questions.some((q) => !answers[q.id])) {
      setError("Jawab seluruh pertanyaan sebelum mengirim.");
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    submission.current ??= crypto.randomUUID();
    setPending(true);
    setError(null);
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(API_ROUTES.replayAttempt(id), {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          revision: challenge.revision,
          submissionId: submission.current,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Hasil latihan belum tersimpan.");
      if (active.current !== controller) return;
      setResult(quizResultSchema.parse(payload));
      notifyProfileUpdated();
      toast.success("Hasil latihan kasus tersimpan.");
    } catch (cause) {
      if (active.current !== controller) return;
      const message =
        controller.signal.aborted || cause instanceof TypeError
          ? "Pengiriman belum terkonfirmasi. Coba kirim kembali; hasil tidak akan digandakan."
          : cause instanceof Error
            ? cause.message
            : "Hasil belum tersimpan.";
      setError(message);
      toast.error(message);
    } finally {
      clearTimeout(timer);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { resource, answers, result, error, pending, choose, submit };
}
