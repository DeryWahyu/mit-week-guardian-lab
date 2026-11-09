"use client";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { getLoadProblem, type LoadProblem, readResource } from "@/lib/investigations/client";

export function useApiResource<T>(
  url: string | null,
  schema: z.ZodType<T>,
  options: {
    scope?: string;
    delay?: number;
    poll?: (data: T) => number | null;
  } = {},
) {
  const { scope = "session", delay = 0, poll } = options;
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([url, scope, attempt]);
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    problem: LoadProblem | null;
    pending: boolean;
  }>({ key: "", data: null, problem: null, pending: false });
  useEffect(() => {
    if (!url) return;
    let controller: AbortController | null = null;
    let disposed = false;
    let running = false;
    let snapshot: T | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      if (disposed || running) return;
      if (timer) clearTimeout(timer);
      running = true;
      const request = new AbortController();
      controller = request;
      setState({ key, data: snapshot, problem: null, pending: true });
      const timeout = setTimeout(() => request.abort(), 15000);
      try {
        const response = await fetch(url as string, {
          cache: "no-store",
          signal: request.signal,
        });
        const data = await readResource(response, schema);
        if (disposed) return;
        snapshot = data;
        setState({ key, data, problem: null, pending: false });
        const interval = poll?.(data);
        if (interval)
          timer = setTimeout(() => {
            if (!document.hidden) void load();
          }, interval);
      } catch (error) {
        if (disposed) return;
        const problem = getLoadProblem(error);
        if (problem.kind !== "server" && problem.kind !== "network") snapshot = null;
        setState({ key, data: snapshot, problem, pending: false });
      } finally {
        clearTimeout(timeout);
        if (controller === request) controller = null;
        running = false;
      }
    }
    const refresh = () => {
      if (!document.hidden) void load();
    };
    timer = setTimeout(() => void load(), delay);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [url, key, schema, delay, poll]);
  const current = state.key === key;
  return {
    data: url && current ? state.data : null,
    problem: url && current ? state.problem : null,
    loading: Boolean(url) && (!current || (state.pending && !state.data)),
    refreshing: Boolean(url) && current && state.pending,
    retry: () => setAttempt((value) => value + 1),
  };
}
