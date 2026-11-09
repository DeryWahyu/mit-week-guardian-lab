import Link from "next/link";
import { ResultError } from "@/components/landing/results/result-error";
import workspace from "@/components/workspace/workspace.module.css";
import { WorkspaceEmpty } from "@/components/workspace/workspace-state";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

export function InvestigationProblem({
  problem,
  onRetry,
  id,
  returnTo,
  presentation = "default",
}: {
  problem: LoadProblem;
  onRetry: () => void;
  id?: string;
  returnTo?: string;
  presentation?: "default" | "workspace" | "dialog";
}) {
  if (presentation === "workspace")
    return (
      <div role="alert">
        <WorkspaceEmpty
          title={
            problem.kind === "not_found"
              ? "Rekaman tidak ditemukan."
              : problem.kind === "forbidden"
                ? "Rekaman ini tidak dapat diakses."
                : problem.kind === "unauthenticated"
                  ? "Masuk untuk melanjutkan."
                  : "Data belum dapat dimuat."
          }
          description={problem.message}
        >
          {problem.retryable && (
            <button type="button" onClick={onRetry} className={workspace.primary}>
              Coba lagi
            </button>
          )}
          {problem.kind === "unauthenticated" && (
            <Link
              className={workspace.primary}
              href={AUTH_ROUTES.loginWithRedirect(
                returnTo ?? (id ? PUBLIC_ROUTES.investigation(id) : PUBLIC_ROUTES.home),
              )}
            >
              Masuk kembali
            </Link>
          )}
          <Link href={PROTECTED_ROUTES.history} className={workspace.secondary}>
            Buka riwayat
          </Link>
        </WorkspaceEmpty>
      </div>
    );
  return (
    <div className={presentation === "dialog" ? "space-y-3" : "space-y-4"}>
      <ResultError
        message={problem.message}
        title={
          problem.kind === "not_found"
            ? "Rekaman Tidak Ditemukan"
            : problem.kind === "forbidden"
              ? "Akses Tidak Diizinkan"
              : problem.kind === "unauthenticated"
                ? "Masuk untuk Melihat Investigasi"
                : undefined
        }
        onRetry={problem.retryable ? onRetry : undefined}
      />
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        {problem.kind === "unauthenticated" && (
          <Link
            className="bg-brand-600 rounded-full px-5 py-2 font-semibold text-white"
            href={AUTH_ROUTES.loginWithRedirect(
              returnTo ?? (id ? PUBLIC_ROUTES.investigation(id) : PUBLIC_ROUTES.home),
            )}
          >
            Masuk kembali
          </Link>
        )}
        <Link
          href={PROTECTED_ROUTES.history}
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-slate-700"
        >
          Buka riwayat
        </Link>
      </div>
    </div>
  );
}
