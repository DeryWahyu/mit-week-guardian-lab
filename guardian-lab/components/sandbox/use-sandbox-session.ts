"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { sandboxSessionSchema, sandboxStateSchema } from "@/lib/validations/sandbox";

function poll(data: z.infer<typeof sandboxStateSchema>) {
  return data.session && ["ACTIVE", "STARTING", "UNKNOWN"].includes(data.session.status)
    ? 3000
    : null;
}
export function useSandboxSession(scope: string) {
  const resource = useApiResource(API_ROUTES.sandboxSession, sandboxStateSchema, { scope, poll });
  const [pending, setPending] = useState<"start" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const active = useRef<AbortController | null>(null);
  const requestId = useRef<string | null>(null);
  useEffect(
    () => () => {
      const current = active.current;
      active.current = null;
      current?.abort();
    },
    [],
  );
  const session = resource.data?.session;
  useEffect(() => {
    if (!session) return;
    const received = Date.now();
    const tick = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil((session.expiresAt - session.serverTime - (Date.now() - received)) / 1000),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session]);
  async function mutate(input?: {
    target: string;
    stripParameters: boolean;
    sourceInvestigationId?: string;
  }) {
    const target = input?.target;
    if (pending || active.current || resource.problem) return false;
    if (target === undefined && !session) return false;
    const abort = new AbortController();
    active.current = abort;
    setPending(target === undefined ? "stop" : "start");
    setError(null);
    if (target !== undefined) requestId.current ??= crypto.randomUUID();
    const timeout = setTimeout(() => abort.abort(), 75000);
    try {
      const response = await fetch(
        target === undefined ? API_ROUTES.sandboxSessionStop : API_ROUTES.sandboxSessionStart,
        {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            target === undefined
              ? { sessionId: session?.sessionId }
              : { type: "web", ...input, sessionId: requestId.current },
          ),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        if (target !== undefined) requestId.current = null;
        throw new Error(payload.error || "Sesi belum dapat diproses.");
      }
      const started = target !== undefined ? sandboxSessionSchema.parse(payload) : null;
      if (active.current !== abort) return;
      requestId.current = null;
      resource.retry();
      toast.success(
        target === undefined
          ? "Container sesi sudah dihapus."
          : started?.status === "ACTIVE"
            ? "Browser terisolasi siap dibuka."
            : "Status sesi diperbarui.",
      );
      return true;
    } catch (cause) {
      if (active.current !== abort) return;
      const message = abort.signal.aborted
        ? "Permintaan belum terkonfirmasi. Periksa status sesi sebelum mencoba lagi."
        : cause instanceof TypeError
          ? "Koneksi terputus. Periksa status dan coba kembali."
          : cause instanceof Error
            ? cause.message
            : "Sesi belum dapat diproses.";
      setError(message);
      toast.error(message);
      resource.retry();
      return false;
    } finally {
      clearTimeout(timeout);
      if (active.current === abort) {
        active.current = null;
        setPending(null);
      }
    }
  }
  return {
    resource,
    pending,
    error,
    remaining,
    mutate,
    resetRequest: () => {
      requestId.current = null;
    },
  };
}
