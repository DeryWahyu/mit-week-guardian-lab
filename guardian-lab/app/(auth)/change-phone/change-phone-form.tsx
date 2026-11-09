"use client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { API_ROUTES, AUTH_ROUTES } from "@/lib/routes";
import { phoneSchema } from "@/lib/validations/auth";
import { AuthField } from "../_components/auth-field";
import { AuthHeader } from "../_components/auth-header";
import { useAuthAction } from "../_hooks/use-auth-action";
import styles from "../auth.module.css";

export function ChangePhoneForm() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const request = useAuthAction();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Nomor tidak valid.");
      event.currentTarget.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    setError(null);
    const result = await request.run(API_ROUTES.authOtpChangePhone, { phone: parsed.data });
    if (result?.redirectTo === AUTH_ROUTES.otp) window.location.assign(AUTH_ROUTES.otp);
  }
  return (
    <>
      <AuthHeader
        title="Ganti nomor WhatsApp."
        subtitle="Gunakan nomor yang dapat menerima kode verifikasi."
      />
      <form
        noValidate
        onSubmit={submit}
        className={styles.form}
        aria-label="Ganti nomor WhatsApp"
        aria-busy={request.pending}
      >
        <AuthField
          id="phone"
          name="phone"
          label="No. WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={32}
          required
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setError(null);
            request.setError(null);
          }}
          error={error || undefined}
          placeholder="08… atau +62…"
          disabled={request.pending}
        />
        {request.error && (
          <p role="alert" className={styles.serverError}>
            {request.error}
          </p>
        )}
        <button type="submit" className={styles.submit} disabled={request.pending}>
          {request.pending ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{" "}
              Memproses…
            </>
          ) : (
            "Simpan dan kirim kode"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        <Link href={AUTH_ROUTES.otp} className={styles.link}>
          Kembali ke verifikasi
        </Link>
      </p>
    </>
  );
}
