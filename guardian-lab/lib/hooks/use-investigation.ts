"use client";
import { useMemo } from "react";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import type { LoadProblem } from "@/lib/investigations/client";
import { API_ROUTES } from "@/lib/routes";
import {
  type Investigation,
  investigationIdSchema,
  investigationSchema,
} from "@/lib/validations/investigation";

const pollInvestigation = (record: Investigation) =>
  ["RECEIVED", "PROCESSING"].includes(record.status) ? 3000 : null;

export function useInvestigation(id: string | null, scope = "session") {
  const valid = id === null || investigationIdSchema.safeParse(id).success;
  const schema = useMemo(() => investigationSchema.refine((record) => record.id === id), [id]);
  const resource = useApiResource(id && valid ? API_ROUTES.historyDetail(id) : null, schema, {
    scope,
    poll: pollInvestigation,
  });
  const problem: LoadProblem | null = valid
    ? resource.problem
    : { kind: "invalid", message: "ID investigasi tidak valid.", retryable: false };
  return {
    record: resource.data,
    loading: resource.loading,
    refreshing: resource.refreshing,
    problem,
    error: problem?.message ?? null,
    retry: resource.retry,
  };
}
