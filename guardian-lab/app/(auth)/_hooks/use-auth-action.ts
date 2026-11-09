"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getAuthError } from "@/lib/validations/auth";

const resultSchema = z.object({
  success: z.literal(true),
  redirectTo: z.string().optional(),
  message: z.string().optional(),
});
export function useAuthAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, []);
  async function run(url: string, data: Record<string, string> = {}) {
    if (lock.current) return null;
    lock.current = true;
    setPending(true);
    setError(null);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: abort.signal,
      });
      const body: unknown = await response.json();
      if (!active.current) return null;
      if (!response.ok) {
        setError(getAuthError(body, "Permintaan belum dapat diproses. Coba lagi."));
        return null;
      }
      const result = resultSchema.safeParse(body);
      if (!result.success) {
        setError("Respons tidak valid. Coba lagi.");
        return null;
      }
      return result.data;
    } catch {
      if (active.current && !abort.signal.aborted)
        setError("Koneksi bermasalah. Silakan coba kembali.");
      return null;
    } finally {
      lock.current = false;
      if (active.current) setPending(false);
    }
  }
  return { pending, error, setError, run };
}
