"use client";

import { Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { API_ROUTES, AUTH_ROUTES } from "@/lib/routes";
import { phoneSchema } from "@/lib/validations/auth";
import { AuthField } from "../../_components/auth-field";
import { AuthHeader } from "../../_components/auth-header";
import { useAuthAction } from "../../_hooks/use-auth-action";
import styles from "../../auth.module.css";

export function ForgotForm({ redirectTarget }: { redirectTarget: string }) {
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const request = useAuthAction();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message || "Nomor tidak valid.");
      event.currentTarget.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    setFieldError(null);
    const result = await request.run(API_ROUTES.authForgotPassword, {
      phone: parsed.data,
      redirect: redirectTarget,
    });
    if (result?.redirectTo === AUTH_ROUTES.otp) window.location.assign(AUTH_ROUTES.otp);
  }
  return (
    <>
      <AuthHeader
        title="Lupa password?"
        subtitle="Masukkan nomor WhatsApp yang terdaftar untuk menerima kode pemulihan."
      />
      <form
        noValidate
        onSubmit={submit}
        className={styles.form}
        aria-label="Pemulihan password"
        aria-busy={request.pending}
      >
        <AuthField
          id="phone"
          name="phone"
          label="No. WhatsApp"
          startAdornment={<Phone />}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={32}
          required
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setFieldError(null);
            request.setError(null);
          }}
          error={fieldError || undefined}
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
            "Kirim kode WhatsApp"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        <Link href={AUTH_ROUTES.loginWithRedirect(redirectTarget)} className={styles.link}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </>
  );
}
