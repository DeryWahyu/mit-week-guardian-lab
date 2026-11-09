"use client";

import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getSafeRedirectUrl, loginSchema } from "@/lib/validations/auth";
import { AuthField, AuthPasswordField } from "../../_components/auth-field";
import { collectFormErrors, focusFormField } from "../../_components/auth-form-utils";
import { AuthHeader } from "../../_components/auth-header";
import { useAuthSubmit } from "../../_hooks/use-auth-submit";
import styles from "../../auth.module.css";

export function LoginForm() {
  const params = useSearchParams();
  const redirectTarget = getSafeRedirectUrl(params.get("redirect"), PUBLIC_ROUTES.home);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);
  const request = useAuthSubmit({ kind: "login", redirectTarget });

  function change(field: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    request.clearError();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const next = collectFormErrors(result.error.issues);
      setErrors(next);
      focusFormField(form.current, Object.keys(next)[0]);
      return;
    }
    setErrors({});
    void request.submit({ email: result.data.email, password: result.data.password });
  }
  return (
    <>
      <AuthHeader
        title="Selamat datang kembali."
        subtitle="Lanjutkan aktivitasmu bersama Guardian Lab."
      />
      <form
        ref={form}
        noValidate
        onSubmit={submit}
        aria-label="Masuk ke Guardian Lab"
        aria-busy={request.isPending}
        className={cn(styles.form, styles.credentials)}
      >
        <AuthField
          id="email"
          name="email"
          label="Email"
          startAdornment={<Mail />}
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={191}
          required
          value={values.email}
          onChange={(event) => change("email", event.target.value)}
          error={errors.email}
          placeholder="nama@email.com"
          disabled={request.isPending}
        />
        <AuthPasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(event) => change("password", event.target.value)}
          error={errors.password}
          placeholder="Masukkan password"
          disabled={request.isPending}
        />
        <div className={styles.formActions}>
          <Link
            href={AUTH_ROUTES.forgotPasswordWithRedirect(redirectTarget)}
            className={styles.link}
          >
            Lupa password?
          </Link>
        </div>
        {request.serverError && (
          <p role="alert" className={styles.serverError}>
            {request.serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={request.isPending}
          aria-busy={request.isPending}
          className={styles.submit}
        >
          {request.isPending ? (
            <>
              <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />{" "}
              Memproses…
            </>
          ) : (
            "Masuk"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        Belum punya akun?{" "}
        <Link href={AUTH_ROUTES.registerWithRedirect(redirectTarget)} className={styles.link}>
          Daftar
        </Link>
      </p>
    </>
  );
}
