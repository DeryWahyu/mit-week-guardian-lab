"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { z } from "zod";
import { API_ROUTES, AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl, newPasswordSchema } from "@/lib/validations/auth";
import { AuthPasswordField } from "../../_components/auth-field";
import { collectFormErrors, focusFormField } from "../../_components/auth-form-utils";
import { AuthHeader } from "../../_components/auth-header";
import { useAuthAction } from "../../_hooks/use-auth-action";
import styles from "../../auth.module.css";

const schema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
export function ResetForm() {
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);
  const request = useAuthAction();
  function change(field: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    request.setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = schema.safeParse(values);
    if (!input.success) {
      const next = collectFormErrors(input.error.issues);
      setErrors(next);
      focusFormField(form.current, Object.keys(next)[0]);
      return;
    }
    setErrors({});
    const result = await request.run(API_ROUTES.authResetPassword, input.data);
    if (result?.redirectTo)
      window.location.assign(getSafeRedirectUrl(result.redirectTo, PUBLIC_ROUTES.home));
  }
  return (
    <>
      <AuthHeader
        title="Buat password baru."
        subtitle="Gunakan password baru untuk masuk kembali ke Guardian Lab."
      />
      <form
        ref={form}
        noValidate
        onSubmit={submit}
        className={styles.form}
        aria-label="Buat password baru"
        aria-busy={request.pending}
      >
        <AuthPasswordField
          id="password"
          name="password"
          label="Password baru"
          autoComplete="new-password"
          aria-description="Minimal 8 karakter, dengan huruf dan angka."
          required
          value={values.password}
          onChange={(event) => change("password", event.target.value)}
          error={errors.password}
          placeholder="8+ karakter, huruf & angka"
          disabled={request.pending}
        />
        <AuthPasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Ulangi password"
          autoComplete="new-password"
          required
          value={values.confirmPassword}
          onChange={(event) => change("confirmPassword", event.target.value)}
          error={errors.confirmPassword}
          placeholder="Ketik ulang password"
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
              Menyimpan…
            </>
          ) : (
            "Simpan password"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        <Link href={AUTH_ROUTES.forgotPassword} className={styles.link}>
          Minta kode baru
        </Link>
      </p>
    </>
  );
}
