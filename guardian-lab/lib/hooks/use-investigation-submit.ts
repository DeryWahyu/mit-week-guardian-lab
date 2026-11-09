"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { UserSession } from "@/lib/auth/session";
import { getAuthError } from "@/lib/validations/auth";
import { type Investigation, investigationSchema } from "@/lib/validations/investigation";

export interface InvestigationSubmitOptions {
  currentUser?: UserSession | null;
  onAnalysisStart?: () => void;
  onAnalysisSuccess?: (record: Investigation) => void;
  onAnalysisError?: (message: string) => void;
}

export function useInvestigationSubmit(
  props: InvestigationSubmitOptions,
  interceptGuest: (target: string) => void,
) {
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const scope = useRef({ active: true });
  useEffect(() => {
    const current = { active: Boolean(props.currentUser?.id) };
    scope.current = current;
    return () => {
      current.active = false;
      controller.current?.abort();
    };
  }, [props.currentUser?.id]);
  const [isNavigating, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isSubmitting || isNavigating;
  const [requestError, setRequestError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  function submit(endpoint: string, body: BodyInit, target: string, json = false) {
    if (lock.current) return;
    if (!props.currentUser) {
      interceptGuest(target);
      return;
    }
    lock.current = true;
    setIsSubmitting(true);
    setRequestError(null);
    setUncertain(false);
    props.onAnalysisStart?.();
    const currentScope = scope.current;
    const requestController = new AbortController();
    controller.current = requestController;
    // Keep long network work outside navigation transitions so links can leave this page.
    void (async () => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body,
          signal: requestController.signal,
          ...(json ? { headers: { "Content-Type": "application/json" } } : {}),
        });
        if (!currentScope.active) return;
        if (response.status === 401) {
          interceptGuest(target);
          const message = "Sesi berakhir. Masuk kembali untuk melanjutkan.";
          setRequestError(message);
          props.onAnalysisError?.(message);
          return;
        }
        const payload: unknown = await response.json();
        if (!currentScope.active) return;
        const parsed = investigationSchema.safeParse(payload);
        if (parsed.success && (response.ok || response.status === 422)) {
          startTransition(() => props.onAnalysisSuccess?.(parsed.data));
          if (parsed.data.status === "FAILED")
            toast.error(parsed.data.errorMessage ?? "Pemeriksaan gagal.");
          else
            toast.success(
              parsed.data.status === "UNAVAILABLE"
                ? "Investigasi tersimpan. Model belum tersedia."
                : "Investigasi tersimpan.",
            );
          return;
        }
        if (response.ok) throw new Error("Unconfirmed response");
        const message = getAuthError(payload, "Investigasi gagal disimpan. Silakan coba kembali.");
        setRequestError(message);
        toast.error(message);
        props.onAnalysisError?.(message);
      } catch {
        if (!currentScope.active) return;
        const message =
          "Hasil penyimpanan belum dapat dikonfirmasi. Periksa riwayat sebelum mengirim ulang.";
        setRequestError(message);
        setUncertain(true);
        toast.error(message);
        props.onAnalysisError?.(message);
      } finally {
        lock.current = false;
        setIsSubmitting(false);
      }
    })();
  }
  function resetFeedback() {
    if (lock.current) return;
    setRequestError(null);
    setUncertain(false);
  }
  return { isLoading, requestError, uncertain, submit, resetFeedback };
}
