"use client";

import { BadgeCheck, CalendarDays, Loader2, LockKeyhole, Mail, Save } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import type { Profile } from "@/lib/validations/profile";
import styles from "./profile.module.css";
import { profileDate } from "./profile-presentation";
import { useProfileForm } from "./use-profile-form";

export function ProfileDetails({ profile, reload }: { profile: Profile; reload: () => void }) {
  const form = useProfileForm(profile, reload);
  return (
    <section className={styles.panel} aria-labelledby="profile-details-title" data-user-reveal>
      <div className={styles.panelHeading}>
        <FeatureIcon name="user" className={styles.icon} />
        <div>
          <h2 id="profile-details-title">Informasi akun</h2>
          <p>Detail akun Guardian-mu.</p>
        </div>
      </div>
      <form
        className={styles.form}
        aria-label="Perbarui nama profil"
        aria-busy={form.pending}
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit();
        }}
        noValidate
      >
        <label htmlFor="profile-name-input">
          Nama tampilan <span className={styles.required}>*</span>
        </label>
        <input
          ref={form.fieldRef}
          id="profile-name-input"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          required
          value={form.name}
          onChange={(event) => form.change(event.target.value)}
          disabled={form.pending}
          aria-invalid={Boolean(form.fieldError)}
          aria-describedby={`profile-name-hint${form.fieldError ? " profile-name-error" : ""}`}
        />
        <p id="profile-name-hint" className={styles.help}>
          Komunitas tetap menggunakan alias anonim.
        </p>
        {form.fieldError && (
          <p id="profile-name-error" className={styles.error} role="alert">
            {form.fieldError}
          </p>
        )}
        <label htmlFor="profile-email">Email akun</label>
        <div className={styles.readOnlyField}>
          <Mail size={23} aria-hidden="true" />
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            readOnly
            autoComplete="off"
            aria-describedby="profile-email-hint"
          />
          <LockKeyhole size={18} aria-hidden="true" />
        </div>
        <p id="profile-email-hint" className={styles.help}>
          Digunakan untuk masuk ke Guardian Lab.
        </p>
        <div className={styles.contactRow}>
          <FeatureIcon name="phone" className={styles.icon} />
          <div>
            <span className={styles.caption}>Nomor WhatsApp</span>
            <strong>{profile.phone ?? "Belum tersedia"}</strong>
          </div>
          <span className={styles.verified}>
            <BadgeCheck size={15} aria-hidden="true" />
            {profile.verified ? "Terverifikasi" : "Belum terverifikasi"}
          </span>
        </div>
        <div className={styles.memberRow}>
          <CalendarDays size={20} aria-hidden="true" />
          Bergabung sejak {profileDate(profile.createdAt)}
        </div>
        {form.error && (
          <div className={styles.errorNotice} role="alert">
            <p>{form.error}</p>
            <button className={styles.textLink} type="button" onClick={reload}>
              Muat ulang profil
            </button>
          </div>
        )}
        <div className={styles.formActions}>
          <button className={styles.primary} type="submit" disabled={!form.dirty || form.pending}>
            {form.pending ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                size={17}
                aria-hidden="true"
              />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            {form.pending ? "Menyimpan..." : "Simpan perubahan"}
          </button>
          <button
            className={styles.secondary}
            type="button"
            disabled={!form.dirty || form.pending}
            onClick={form.reset}
          >
            Batalkan
          </button>
        </div>
      </form>
    </section>
  );
}
