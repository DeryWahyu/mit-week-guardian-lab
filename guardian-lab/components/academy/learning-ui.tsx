import Link from "next/link";
import type { WorkspacePose } from "@/components/workspace/workspace-mascot";
import { WorkspaceEmpty, WorkspaceSkeleton } from "@/components/workspace/workspace-state";
import workspace from "@/components/workspace/workspace.module.css";
import { AUTH_ROUTES } from "@/lib/routes";
export const learningControl =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50";
export function LearningSkeleton({
  presentation = "default",
}: {
  presentation?: "default" | "workspace";
}) {
  if (presentation === "workspace") return <WorkspaceSkeleton />;
  return (
    <output aria-label="Memuat data" className="space-y-4">
      <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
    </output>
  );
}
export function LearningProblem({
  retry,
  presentation = "default",
  pose = "evidence",
}: {
  retry: () => void;
  presentation?: "default" | "workspace";
  pose?: WorkspacePose;
}) {
  if (presentation === "workspace")
    return (
      <div role="alert">
        <WorkspaceEmpty
          pose={pose}
          title="Kita coba muat kembali."
          description="Data belum dapat dimuat. Coba lagi, atau masuk kembali jika sesimu telah berakhir."
        >
          <button type="button" className={workspace.primary} onClick={retry}>
            Coba lagi
          </button>
          <Link className={workspace.secondary} href={AUTH_ROUTES.login}>
            Masuk kembali
          </Link>
        </WorkspaceEmpty>
      </div>
    );
  return (
    <div role="alert" className="space-y-3 rounded-2xl border border-rose-200 bg-white p-6">
      <p>Data belum dapat dimuat. Layanan mungkin belum tersedia atau sesi masuk telah berakhir.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={learningControl} onClick={retry}>
          Coba lagi
        </button>
        <Link className={learningControl} href={AUTH_ROUTES.login}>
          Masuk kembali
        </Link>
      </div>
    </div>
  );
}
