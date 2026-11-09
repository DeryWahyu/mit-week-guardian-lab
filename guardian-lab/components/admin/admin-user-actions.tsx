"use client";
import { useState } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { API_ROUTES } from "@/lib/routes";
import { type AdminUserDetail, userActionSchema } from "@/lib/validations/admin";
import styles from "./admin.module.css";
import { useAdminMutation } from "./use-admin-mutation";

const labels = {
  SUSPEND: "Tangguhkan akun",
  RESTORE: "Aktifkan kembali",
  REVOKE_SESSIONS: "Cabut semua sesi",
  SET_ROLE: "Ubah peran",
};
export function AdminUserActions({
  user,
  currentUserId,
  retry,
}: {
  user: AdminUserDetail;
  currentUserId: string;
  retry: () => void;
}) {
  const [action, setAction] = useState<keyof typeof labels>(
      user.suspendedAt ? "RESTORE" : "REVOKE_SESSIONS",
    ),
    [role, setRole] = useState<"USER" | "ADMIN">(user.role === "USER" ? "ADMIN" : "USER"),
    [reason, setReason] = useState(""),
    [open, setOpen] = useState(false);
  const mutation = useAdminMutation();
  if (user.id === currentUserId)
    return (
      <section className={styles.panel}>
        <h2>Akun administrator sendiri</h2>
        <p className={styles.muted}>
          Perubahan akses akun sendiri dibatasi. Gunakan tombol Keluar untuk mengakhiri sesi saat
          ini.
        </p>
      </section>
    );
  const input = {
    action,
    role: action === "SET_ROLE" ? role : undefined,
    reason,
    revision: user.updatedAt,
  };
  return (
    <section className={styles.panel}>
      <h2>Kelola akses</h2>
      <p className={styles.muted}>
        Tindakan memerlukan alasan. Penangguhan, perubahan peran dan pencabutan sesi mengakhiri sesi
        login akun ini.
      </p>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!userActionSchema.safeParse(input).success) {
            mutation.setError("Lengkapi alasan minimal 10 karakter dan peran tujuan.");
            return;
          }
          mutation.setError(null);
          setOpen(true);
        }}
      >
        <label>
          Tindakan *
          <select
            value={action}
            disabled={mutation.pending}
            onChange={(e) => setAction(e.target.value as keyof typeof labels)}
          >
            {!user.suspendedAt ? (
              <option value="SUSPEND">Tangguhkan akun</option>
            ) : (
              <option value="RESTORE">Aktifkan kembali</option>
            )}
            <option value="REVOKE_SESSIONS">Cabut semua sesi</option>
            {!user.suspendedAt && user.verified && <option value="SET_ROLE">Ubah peran</option>}
          </select>
        </label>
        {action === "SET_ROLE" && (
          <label>
            Peran tujuan *
            <select value={role} onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        )}
        <label>
          Alasan *
          <textarea
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan alasan tindakan tanpa data sensitif."
          />
        </label>
        {mutation.error && !open && (
          <p role="alert" className={styles.error}>
            {mutation.error}
          </p>
        )}
        <button type="submit" className={styles.primary} disabled={mutation.pending}>
          Tinjau tindakan
        </button>
      </form>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${labels[action]}?`}
        description={
          labels[action] +
          " untuk " +
          user.name +
          ". Tindakan ini dicatat di log aktivitas. Riwayat pemeriksaan dan EXP tetap tersimpan."
        }
        pending={mutation.pending}
        error={mutation.error}
        confirmLabel="Terapkan perubahan"
        className={landingTypography}
        tone={action === "RESTORE" ? "brand" : "danger"}
        onConfirm={() => {
          void (async () => {
            if (await mutation.run(API_ROUTES.adminUser(user.id), input)) {
              setOpen(false);
              setReason("");
              retry();
            }
          })();
        }}
      />
    </section>
  );
}
