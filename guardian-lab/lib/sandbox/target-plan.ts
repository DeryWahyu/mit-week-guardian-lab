import { scanUrlSchema } from "@/lib/validations/analysis-input";
export function sandboxTargetPlan(input: string) {
  const parsed = scanUrlSchema.safeParse(input);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  const requiresRemoval = Boolean(url.search || url.hash);
  url.search = "";
  url.hash = "";
  return { requiresRemoval, cleanUrl: url.href };
}
