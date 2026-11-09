"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { getLoadProblem, readResource } from "@/lib/investigations/client";
import { communityCaseSchema, communityErrorSchema } from "@/lib/validations/community";

export function useCommunityMutation() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  function mutate(url: string, method: "POST" | "PUT", payload: unknown, success: () => void) {
    if (lock.current) return;
    lock.current = true;
    setError(null);
    startTransition(async () => {
      const current = new AbortController();
      controller.current = current;
      const timeout = setTimeout(() => current.abort(), 15000);
      let serverMessage: string | null = null;
      try {
        const response = await fetch(url, {
          method,
          signal: current.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const parsed = communityErrorSchema.safeParse(await response.json().catch(() => null));
          serverMessage = parsed.success ? parsed.data.error : null;
          throw new Error("Community mutation rejected");
        }
        await readResource(response, communityCaseSchema);
        if (!mounted.current) return;
        toast.success(
          method === "POST" ? "Pengajuan masuk antrean moderasi." : "Keputusan moderasi tersimpan.",
        );
        success();
      } catch (error) {
        if (!mounted.current) return;
        const problem = getLoadProblem(error);
        const message = `${serverMessage ?? problem.message} Perbarui status sebelum mencoba kembali.`;
        setError(message);
        toast.error(message);
      } finally {
        clearTimeout(timeout);
        lock.current = false;
      }
    });
  }
  return { pending, error, mutate };
}
