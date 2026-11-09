"use client";
import { usePathname, useSearchParams } from "next/navigation";
export function useAdminQuery() {
  const params = useSearchParams(),
    pathname = usePathname();
  function changeMany(values: Record<string, string>, replace = false) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (Object.keys(values).some((key) => key !== "page")) next.delete("page");
    const target = pathname + (next.size ? `?${next.toString()}` : "") + window.location.hash;
    if (replace) window.history.replaceState(null, "", target);
    else window.history.pushState(null, "", target);
  }
  return {
    params,
    query: params.toString(),
    change: (key: string, value: string) => changeMany({ [key]: value }, key === "q"),
    changeMany,
  };
}
