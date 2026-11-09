"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ResultSkeleton } from "@/components/landing/results/result-skeleton";
import { InvestigationProblem } from "@/components/shared/investigation-problem";
import { WorkspaceStage } from "@/components/workspace/workspace-stage";
import { WorkspaceEmpty } from "@/components/workspace/workspace-state";
import workspace from "@/components/workspace/workspace.module.css";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { communityPreviewSchema } from "@/lib/validations/community";
import { investigationIdSchema } from "@/lib/validations/investigation";
import { CommunityReportView } from "./community-report-view";
import { COMMUNITY_STATUS_LABELS } from "./community-status";
import { useCommunityMutation } from "./use-community-mutation";

export function CommunitySubmissionView({ scope }: { scope: string }) {
  const id = useSearchParams().get("id");
  return (
    <div className="space-y-6">
      <WorkspaceStage
        title="Bagikan bukti yang bisa dipelajari."
        description="Tinjau snapshot investigasimu sebelum mengajukannya. Kasus ditampilkan secara anonim setelah disetujui admin."
        pose="community"
        tone="lavender"
        compact={Boolean(id)}
      />
      <SubmissionForm key={`${scope}:${id}`} id={id} scope={scope} />
    </div>
  );
}
function SubmissionForm({ scope, id }: { scope: string; id: string | null }) {
  const valid = investigationIdSchema.safeParse(id).success;
  const resource = useApiResource(
    valid && id ? API_ROUTES.communityPreview(id) : null,
    communityPreviewSchema,
    { scope },
  );
  const [consent, setConsent] = useState(false);
  const action = useCommunityMutation();
  if (!valid)
    return (
      <WorkspaceEmpty
        title="Mulai dari hasil investigasimu."
        description="Pengajuan memerlukan hasil analisis lengkap. Pilih rekaman dari riwayat untuk melihat snapshot yang akan diajukan."
        pose="evidence"
      >
        <Link href={PROTECTED_ROUTES.history} className={workspace.primary}>
          Pilih investigasi
        </Link>
      </WorkspaceEmpty>
    );
  if (resource.loading) return <ResultSkeleton />;
  if (resource.problem)
    return (
      <InvestigationProblem
        presentation="workspace"
        problem={resource.problem}
        onRetry={resource.retry}
      />
    );
  const data = resource.data;
  if (!data) return null;
  return (
    <div className="space-y-5">
      {data.existing ? (
        <div
          aria-live="polite"
          className="space-y-2 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="font-bold">
            Status pengajuan: {COMMUNITY_STATUS_LABELS[data.existing.status]}
          </h2>
          {data.existing.adminNotes && (
            <p className="text-sm [overflow-wrap:anywhere]">
              Catatan admin: {data.existing.adminNotes}
            </p>
          )}
          {data.existing.status === "REJECTED" && (
            <p className="text-sm text-slate-600">
              Pengajuan ini sudah ditinjau. Untuk temuan baru,{" "}
              <Link href={PUBLIC_ROUTES.home} className="underline">
                buat investigasi baru
              </Link>
              .
            </p>
          )}
          <Link
            className="text-sm underline"
            href={PROTECTED_ROUTES.communityReplay(data.existing.id)}
          >
            Lihat pengajuan
          </Link>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Tinjau snapshot di bawah. Admin akan memeriksanya sebelum kasus tampil di komunitas.
        </p>
      )}
      {data.report ? (
        <CommunityReportView report={data.report} />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
          {data.message} Pengajuan memerlukan hasil lengkap.
        </p>
      )}
      {!data.existing && data.report && (
        <form
          data-user-reveal
          className={`${workspace.panel} space-y-4`}
          onSubmit={(event) => {
            event.preventDefault();
            if (id && consent)
              action.mutate(
                API_ROUTES.communitySubmit,
                "POST",
                { investigationId: id, consent: true },
                resource.retry,
              );
          }}
        >
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              required
              checked={consent}
              disabled={action.pending}
              onChange={(event) => setConsent(event.target.checked)}
              className="accent-brand-600 mt-1 size-4 shrink-0"
            />
            <span>
              Saya telah meninjau snapshot dan menyetujui pengajuan untuk moderasi serta penerbitan
              anonim jika disetujui admin. <span className="text-rose-600">*</span>
            </span>
          </label>
          <button type="submit" disabled={!consent || action.pending} className={workspace.primary}>
            {action.pending ? "Mengirim pengajuan…" : "Ajukan untuk ditinjau"}
          </button>
        </form>
      )}
      {action.error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          {action.error}
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <button
          type="button"
          onClick={resource.retry}
          disabled={action.pending || resource.refreshing}
          className="rounded-full border border-slate-300 bg-white px-4 py-2"
        >
          Perbarui status pengajuan
        </button>
        <Link
          href={PROTECTED_ROUTES.communityMine}
          className="rounded-full border border-slate-300 bg-white px-4 py-2"
        >
          Pengajuan saya
        </Link>
      </div>
    </div>
  );
}
