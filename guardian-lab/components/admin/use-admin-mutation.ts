"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const successSchema = z.object({ success: z.literal(true) });
const errorSchema = z.object({ error: z.string().max(1000) });
export function useAdminMutation() {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  async function run(url: string, body: unknown, method = "PUT") {
    if (active.current) return false;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError(null);
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const value: unknown = await response.json();
      if (!response.ok) {
        const parsed = errorSchema.safeParse(value);
        throw new Error(parsed.success ? parsed.data.error : "Perubahan belum tersimpan.");
      }
      successSchema.parse(value);
      if (controller.signal.aborted) return false;
      toast.success("Perubahan tersimpan dan dicatat di log aktivitas.");
      return true;
    } catch (cause) {
      if (active.current !== controller) return false;
      setError(
        controller.signal.aborted
          ? "Permintaan melewati batas waktu. Muat ulang data sebelum mencoba kembali."
          : cause instanceof Error
            ? cause.message
            : "Perubahan belum dapat diproses.",
      );
      return false;
    } finally {
      clearTimeout(timer);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { pending, error, setError, run };
}
