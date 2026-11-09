"use client";
import { useSearchParams } from "next/navigation";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import type { LoadProblem } from "@/lib/investigations/client";
import { API_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import {
  type HistoryResponse,
  historyFiltersSchema,
  historyRequestParams,
  historyResponseSchema,
} from "@/lib/validations/history";

const pollHistory = (data: HistoryResponse) => (data.summary.processing > 0 ? 3000 : null);

export function useHistory(scope = "session") {
  const params = useSearchParams();
  const parsed = historyFiltersSchema.safeParse(Object.fromEntries(params));
  const filters = parsed.success ? parsed.data : null;
  const resource = useApiResource(
    filters ? `${API_ROUTES.history}?${historyRequestParams(filters)}` : null,
    historyResponseSchema,
    { scope, delay: 250, poll: pollHistory },
  );
  const filterProblem: LoadProblem | null = parsed.success
    ? null
    : {
        kind: "invalid",
        message:
          parsed.error.issues.find((issue) => issue.code === "custom")?.message ??
          "Filter riwayat tidak valid. Periksa tanggal atau nomor halaman.",
        retryable: false,
      };
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "ALL") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    const path = `${PROTECTED_ROUTES.history}?${next}`;
    if (key === "search") window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
  }
  return {
    ...resource,
    problem: filterProblem ?? resource.problem,
    filters,
    values: {
      type: params.get("type") ?? "ALL",
      risk: params.get("risk") ?? "ALL",
      status: params.get("status") ?? "ALL",
      search: params.get("search") ?? "",
      from: params.get("from") ?? "",
      to: params.get("to") ?? "",
    },
    setFilter,
    hasFilters: ["type", "risk", "status", "search", "from", "to"].some((key) =>
      Boolean(params.get(key)),
    ),
  };
}
