import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SandboxLaunchLink({
  target,
  type,
  investigationId,
  className,
}: {
  target: string;
  type: string;
  investigationId?: string;
  className?: string;
}) {
  if (type === "APK" || !/^https?:\/\//i.test(target)) return null;
  return (
    <Link
      href={PUBLIC_ROUTES.sandboxWebWithTarget(target, investigationId)}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800",
        className,
      )}
    >
      Buka di sandbox web
    </Link>
  );
}
