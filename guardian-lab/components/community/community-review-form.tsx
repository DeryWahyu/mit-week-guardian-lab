"use client";
import { useState } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { API_ROUTES } from "@/lib/routes";
import type { CommunityCase } from "@/lib/validations/community";
import { useCommunityMutation } from "./use-community-mutation";

export function CommunityReviewForm({
  record,
  onDone,
}: {
  record: CommunityCase;
  onDone: () => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">(
    record.report ? "APPROVED" : "REJECTED",
  );
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [open, setOpen] = useState(false);
  const action = useCommunityMutation();
  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(true);
      }}
    >
      <h2 className="text-lg font-bold">Keputusan moderasi</h2>
      <label className="block space-y-2 text-sm">
        Keputusan <span className="text-rose-600">*</span>
        <select
          value={decision}
          onChange={(e) => setDecision(e.target.value as "APPROVED" | "REJECTED")}
          className="block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        >
          <option value="APPROVED" disabled={!record.report}>
            Setujui dan terbitkan
          </option>
          <option value="REJECTED">Tolak pengajuan</option>
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        Catatan admin <span className="text-rose-600">*</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          placeholder={
            decision === "REJECTED"
              ? "Jelaskan alasan penolakan, minimal 10 karakter"
              : "Jelaskan alasan persetujuan, minimal 10 karakter"
          }
          className="block min-h-28 w-full rounded-xl border border-slate-300 p-3"
        />
      </label>
      {decision === "APPROVED" && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="accent-brand-600 mt-1 size-4 shrink-0"
          />
          <span>
            Saya telah memeriksa bukti dan memastikan snapshot layak diterbitkan tanpa data pribadi
            atau kredensial. <span className="text-rose-600">*</span>
          </span>
        </label>
      )}
      <button
        type="submit"
        disabled={action.pending || (decision === "APPROVED" && !confirmed)}
        className="bg-brand-600 min-h-11 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        Tinjau keputusan
      </button>
      <ConfirmDialog
        className={landingTypography}
        tone={decision === "APPROVED" ? "brand" : "danger"}
        open={open}
        onOpenChange={setOpen}
        title={decision === "APPROVED" ? "Terbitkan kasus ini?" : "Tolak pengajuan ini?"}
        description={
          decision === "APPROVED"
            ? `Kasus “${record.title}” akan dapat dibaca anggota komunitas. Keputusan ini disimpan sebagai hasil tinjauan.`
            : "Pemilik akan melihat alasan penolakan. Kasus tidak ditampilkan di daftar komunitas."
        }
        pending={action.pending}
        error={action.error}
        confirmLabel={decision === "APPROVED" ? "Setujui dan terbitkan" : "Tolak pengajuan"}
        onConfirm={() =>
          action.mutate(
            API_ROUTES.adminCommunityReview(record.id),
            "PUT",
            decision === "APPROVED"
              ? { status: decision, privacyConfirmed: true, adminNotes: notes }
              : { status: decision, adminNotes: notes },
            () => {
              setOpen(false);
              onDone();
            },
          )
        }
      />
    </form>
  );
}
