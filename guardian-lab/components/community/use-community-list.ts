"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { communityListSchema, communityQuerySchema } from "@/lib/validations/community";

export function useCommunityList(scope: string, admin = false) {
  const params = useSearchParams();
  const path = usePathname();
  const query = communityQuerySchema.safeParse(Object.fromEntries(params));
  const resource = useApiResource(
    query.success
      ? `${admin ? API_ROUTES.adminCommunityReviews : API_ROUTES.communityReplays}?${params}`
      : null,
    communityListSchema,
    { scope, delay: 200 },
  );
  function change(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    if (key === "view") next.delete("status");
    window.history.replaceState(null, "", `${path}?${next}`);
  }
  return { ...resource, query: query.success ? query.data : null, change };
}
