import { type ReactNode, Suspense } from "react";
import { requirePageUser } from "@/lib/auth/page-access";

async function AuthorizedContent({ children }: { children: ReactNode }) {
  await requirePageUser();
  return children;
}

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <output
          className="mx-auto block w-full max-w-6xl space-y-6 p-8"
          aria-label="Memeriksa sesi"
        >
          <div className="h-12 w-56 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
          <div className="h-80 animate-pulse rounded-3xl bg-slate-100 motion-reduce:animate-none" />
        </output>
      }
    >
      <AuthorizedContent>{children}</AuthorizedContent>
    </Suspense>
  );
}
