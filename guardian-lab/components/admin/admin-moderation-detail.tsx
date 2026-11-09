"use client";
import Link from "next/link";
import { useState } from "react";
import { CommunityReportView } from "@/components/community/community-report-view";
import { CommunityReviewForm } from "@/components/community/community-review-form";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ADMIN_ROUTES, API_ROUTES } from "@/lib/routes";
import { adminReasonSchema } from "@/lib/validations/admin";
import { communityCaseSchema } from "@/lib/validations/community";
import styles from "./admin.module.css";
import { AdminBadge, AdminHeader, AdminLoading, AdminProblem, adminDate } from "./admin-ui";
import { useAdminMutation } from "./use-admin-mutation";
export function AdminModerationDetailView({ id, scope }: { id: string; scope: string }) {
  const resource = useApiResource(API_ROUTES.communityReplay(id), communityCaseSchema, { scope });
  const [reason, setReason] = useState(""),
    [open, setOpen] = useState(false);
  const mutation = useAdminMutation();
  if (resource.loading) return <AdminLoading />;
  if (resource.problem) return <AdminProblem problem={resource.problem} retry={resource.retry} />;
  const record = resource.data;
  if (!record) return null;
  return (
    <div className={styles.content}>
      <Link href={ADMIN_ROUTES.communityReviews} className={styles.textLink}>
        ← Kembali ke moderasi
      </Link>
      <AdminHeader title={record.title} description={record.description} />
      <section className={styles.panel}>
        <div className={styles.inline}>
          <AdminBadge
            tone={
              record.withdrawnAt ? "warning" : record.status === "APPROVED" ? "good" : "neutral"
            }
          >
            {record.withdrawnAt
              ? "Publikasi ditarik"
              : record.status === "PENDING_REVIEW"
                ? "Menunggu tinjauan"
                : record.status === "APPROVED"
                  ? "Disetujui"
                  : "Ditolak"}
          </AdminBadge>
          <span className={styles.muted}>Pengaju anonim · {adminDate(record.createdAt)}</span>
        </div>
        {record.adminNotes && (
          <p className={styles.notice}>Catatan keputusan: {record.adminNotes}</p>
        )}
        {record.withdrawalReason && (
          <p className={styles.notice}>Alasan penarikan: {record.withdrawalReason}</p>
        )}
        {record.sourceRecordId && (
          <Link
            className={styles.textLink}
            href={ADMIN_ROUTES.investigation(record.sourceRecordId)}
          >
            Buka investigasi sumber →
          </Link>
        )}
      </section>
      {record.report ? (
        <CommunityReportView report={record.report} />
      ) : (
        <p className={styles.notice}>Snapshot lama tidak lengkap dan belum dapat diterbitkan.</p>
      )}
      {record.canReview ? (
        <CommunityReviewForm
          key={record.id + record.status}
          record={record}
          onDone={resource.retry}
        />
      ) : (
        record.status === "PENDING_REVIEW" && (
          <p className={styles.notice}>Pengajuan sendiri harus ditinjau oleh administrator lain.</p>
        )
      )}
      {record.status === "APPROVED" && !record.withdrawnAt && (
        <section className={styles.panel}>
          <h2>Tarik publikasi</h2>
          <p className={styles.muted}>
            Kasus akan disembunyikan dari komunitas dan latihan baru. Snapshot serta keputusan
            sebelumnya tetap tersimpan.
          </p>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (!adminReasonSchema.safeParse(reason).success) {
                mutation.setError("Alasan minimal 10 karakter.");
                return;
              }
              mutation.setError(null);
              setOpen(true);
            }}
          >
            <label>
              Alasan penarikan *
              <textarea
                required
                minLength={10}
                maxLength={1000}
                value={reason}
                rows={3}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {mutation.error && !open && (
              <p role="alert" className={styles.error}>
                {mutation.error}
              </p>
            )}
            <button type="submit" className={styles.danger} disabled={mutation.pending}>
              Tinjau penarikan
            </button>
          </form>
        </section>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Tarik publikasi kasus?"
        description="Kasus akan disembunyikan dari anggota dan tidak dapat dipakai untuk latihan baru. Alasan penarikan akan dicatat."
        pending={mutation.pending}
        error={mutation.error}
        confirmLabel="Tarik publikasi"
        className={landingTypography}
        onConfirm={() => {
          void (async () => {
            if (await mutation.run(API_ROUTES.adminCaseWithdraw(id), { reason }, "POST")) {
              setOpen(false);
              setReason("");
              resource.retry();
            }
          })();
        }}
      />
    </div>
  );
}
