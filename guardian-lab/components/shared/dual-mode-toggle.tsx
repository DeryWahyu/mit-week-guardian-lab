"use client";

import { Terminal, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

export interface DualModeToggleProps {
  mode?: "human" | "geek";
  onChange?: (mode: "human" | "geek") => void;
  className?: string;
}

function DualModeToggleInner({ mode: propMode, onChange, className }: DualModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentMode = propMode ?? (searchParams.get("mode") === "geek" ? "geek" : "human");

  const handleToggle = useCallback(
    (newMode: "human" | "geek") => {
      if (onChange) {
        onChange(newMode);
        return;
      }

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (newMode === "geek") {
          params.set("mode", "geek");
        } else {
          params.delete("mode");
        }
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ""}`, {
          scroll: false,
        });
      });
    },
    [onChange, pathname, router, searchParams],
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleToggle("human")}
        aria-pressed={currentMode === "human"}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 sm:text-xs",
          currentMode === "human"
            ? "border border-slate-200/70 bg-white font-semibold text-slate-900 shadow-xs"
            : "border border-transparent text-slate-500 hover:text-slate-800",
        )}
      >
        <User
          className={cn(
            "size-3.5 shrink-0",
            currentMode === "human" ? "text-cyan-700" : "text-slate-400",
          )}
        />
        <span>Mode Bahasa Manusia</span>
      </button>

      <button
        type="button"
        onClick={() => handleToggle("geek")}
        aria-pressed={currentMode === "geek"}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all duration-150 sm:text-xs",
          currentMode === "geek"
            ? "border border-slate-200/70 bg-white font-semibold text-slate-900 shadow-xs"
            : "border border-transparent text-slate-500 hover:text-slate-800",
        )}
      >
        <Terminal
          className={cn(
            "size-3.5 shrink-0",
            currentMode === "geek" ? "text-cyan-700" : "text-slate-400",
          )}
        />
        <span>Mode Teknis (Geek View)</span>
      </button>
    </div>
  );
}

export function DualModeToggle(props: DualModeToggleProps) {
  return (
    <Suspense
      fallback={<div className="h-14 w-64 max-w-full animate-pulse rounded-xl bg-slate-200/70" />}
    >
      <DualModeToggleInner {...props} />
    </Suspense>
  );
}
