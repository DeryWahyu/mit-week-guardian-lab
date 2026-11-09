import type { z } from "zod";
import type { communityQuerySchema } from "@/lib/validations/community";
import type { useCommunityList } from "./use-community-list";

export type CommunityQuery = z.infer<typeof communityQuerySchema>;
export type CommunityListState = ReturnType<typeof useCommunityList>;
