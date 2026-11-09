"use client";
import Link from "next/link";
import { useState } from "react";
import type { z } from "zod";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvestigationView } from "@/components/shared/investigation-view";
import { REVIEW_LABELS } from "@/lib/admin/labels";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import {
  adminInvestigationDetailSchema,
  type adminReviewSchema,
  investigationReviewSchema,
} from "@/lib/validations/admin";
import styles from "./admin.module.css";
import { AdminHeader, AdminLoading, AdminProblem, adminDate } from "./admin-ui";
import { useAdminMutation } from "./use-admin-mutation";

function ReviewEditor({
  id,
  review,
  retry,
}: {
  id: string;
  review: z.infer<typeof adminReviewSchema>;
  retry: () => void;
}) {
  const [status, setStatus] = useState<keyof typeof REVIEW_LABELS>(
      review?.status ?? "NEEDS_REVIEW",
    ),
    [note, setNote] = useState(review?.note ?? ""),
    [open, setOpen] = useState(false);
  const mutation = useAdminMutation();
  const input = { status, note, revision: review?.updatedAt ?? null };
  return (
    <section className={styles.panel}>
      <h2>Catatan tinjauan admin</h2>
      <p className={styles.muted}>
        Status ini mencatat tindak lanjut manusia dan terpisah dari hasil AI yang tersimpan.
      </p>
      {review && (
        <p className={styles.muted}>
          Terakhir oleh {review.reviewer}, {adminDate(review.updatedAt)}.
        </p>
      )}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!investigationReviewSchema.safeParse(input).success) {
            mutation.setError("Catatan tinjauan minimal 10 karakter.");
            return;
          }
          mutation.setError(null);
          setOpen(true);
        }}
      >
        <label>
          Status tinjauan *
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as keyof typeof REVIEW_LABELS)}
          >
            {Object.entries(REVIEW_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Catatan *
          <textarea
            rows={4}
            minLength={10}
            maxLength={1000}
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jelaskan bukti dan tindak lanjut tanpa data sensitif."
          />
        </label>
        {mutation.error && !open && (
          <p className={styles.error} role="alert">
            {mutation.error}
          </p>
        )}
        <button type="submit" className={styles.primary} disabled={mutation.pending}>
          Simpan tinjauan
        </button>
      </form>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Simpan tinjauan investigasi?"
        description="Catatan dan status tinjauan akan disimpan beserta identitas administrator di log aktivitas."
        pending={mutation.pending}
        error={mutation.error}
        tone="brand"
        confirmLabel="Simpan tinjauan"
        className={landingTypography}
        onConfirm={() => {
          void (async () => {
            if (await mutation.run(API_ROUTES.adminInvestigation(id), input)) {
              setOpen(false);
              retry();
            }
          })();
        }}
      />
    </section>
  );
}
export function AdminInvestigationDetailView({ id, scope }: { id: string; scope: string }) {
  const resource = useApiResource(
    API_ROUTES.adminInvestigation(id),
    adminInvestigationDetailSchema,
    { scope },
  );
  if (resource.loading) return <AdminLoading />;
  if (resource.problem) return <AdminProblem problem={resource.problem} retry={resource.retry} />;
  if (!resource.data) return null;
  return (
    <div className={styles.content}>
      <Link className={styles.textLink} href={ADMIN_ROUTES.investigations}>
        ← Kembali ke investigasi
      </Link>
      <AdminHeader
        title="Baca bukti, tentukan tindak lanjut."
        description={`Investigasi milik ${resource.data.owner}. Hasil di bawah membaca rekaman asli.`}
      />
      <ReviewEditor
        key={resource.data.review?.updatedAt ?? id}
        id={id}
        review={resource.data.review}
        retry={resource.retry}
      />
      <InvestigationView
        id={id}
        scope={scope}
        presentation="workspace"
        returnTo={ADMIN_ROUTES.investigations}
      />
    </div>
  );
}
