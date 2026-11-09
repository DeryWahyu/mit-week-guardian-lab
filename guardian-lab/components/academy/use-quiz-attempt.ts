"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { notifyProfileUpdated } from "@/lib/auth/events";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { quizDetailSchema, quizResultSchema } from "@/lib/validations/academy";
export function useQuizAttempt(id: string, scope: string) {
  const resource = useApiResource(API_ROUTES.quizDetail(id), quizDetailSchema, { scope });
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<z.infer<typeof quizResultSchema> | null>(null);
  const submission = useRef<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      const current = active.current;
      active.current = null;
      current?.abort();
    },
    [],
  );
  function choose(questionId: string, optionId: string, multiple: boolean) {
    if (pending || result) return;
    submission.current = null;
    setError(null);
    setAnswers((a) => {
      const selected = a[questionId] ?? [];
      return {
        ...a,
        [questionId]: multiple
          ? selected.includes(optionId)
            ? selected.filter((v) => v !== optionId)
            : [...selected, optionId]
          : [optionId],
      };
    });
  }
  async function submit() {
    const quiz = resource.data;
    if (!quiz || pending || active.current || resource.problem || result) return;
    if (quiz.questions.some((q) => !answers[q.id]?.length)) {
      setError("Jawab seluruh soal sebelum mengirim.");
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    submission.current ??= crypto.randomUUID();
    setPending(true);
    setError(null);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(API_ROUTES.submitQuiz, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          quizId: id,
          revision: quiz.revision,
          submissionId: submission.current,
          answers,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Jawaban belum tersimpan.",
        );
      const checked = quizResultSchema.parse(payload);
      setResult(checked);
      notifyProfileUpdated();
      toast.success("Hasil latihan tersimpan.");
    } catch (cause) {
      if (active.current !== controller) return;
      const message = controller.signal.aborted
        ? "Pengiriman belum terkonfirmasi. Coba kirim kembali dengan jawaban yang sama."
        : cause instanceof TypeError
          ? "Koneksi terputus. Periksa status dan coba kembali."
          : cause instanceof Error
            ? cause.message
            : "Jawaban belum tersimpan.";
      setError(message);
      toast.error(message);
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { resource, answers, choose, submit, pending, error, result };
}
