import { cn } from "@/lib/utils";
export function ResultSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={cn(
        "mx-auto max-w-4xl animate-pulse space-y-6 rounded-3xl border border-slate-200 bg-white p-6 motion-reduce:animate-none sm:p-8",
        className,
      )}
    >
      <div className="flex flex-wrap justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-7 w-56 max-w-full rounded bg-slate-200" />
        </div>
        <div className="h-9 w-56 max-w-full rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-4 w-40 max-w-full rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-2xl bg-slate-100" />
    </div>
  );
}
