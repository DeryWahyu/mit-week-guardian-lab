"use client";

import { Loader2, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getSafeRedirectUrl, registerFormSchema } from "@/lib/validations/auth";
import { AuthField, AuthPasswordField } from "../../_components/auth-field";
import { collectFormErrors, focusFormField } from "../../_components/auth-form-utils";
import { AuthHeader } from "../../_components/auth-header";
import { useAuthSubmit } from "../../_hooks/use-auth-submit";
import styles from "../../auth.module.css";

export function RegisterForm() {
  const params = useSearchParams();
  const redirectTarget = getSafeRedirectUrl(params.get("redirect"), PUBLIC_ROUTES.home);
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);
  const focusConflict = useRef<"email" | "phone" | null>(null);
  const request = useAuthSubmit({
    kind: "register",
    redirectTarget,
    onConflict: (field) => {
      setErrors({
        [field]: field === "email" ? "Email sudah terdaftar." : "Nomor WhatsApp sudah terdaftar.",
      });
      focusConflict.current = field;
    },
  });

  useEffect(() => {
    if (!request.isPending && focusConflict.current && errors[focusConflict.current]) {
      focusFormField(form.current, focusConflict.current);
      focusConflict.current = null;
    }
  }, [request.isPending, errors]);

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
    const result = registerFormSchema.safeParse(values);
    if (!result.success) {
      const next = collectFormErrors(result.error.issues);
      setErrors(next);
      focusFormField(form.current, Object.keys(next)[0]);
      return;
    }
    setErrors({});
    void request.submit({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      password: result.data.password,
    });
  }
  return (
    <>
      <AuthHeader
        title="Buat akun Guardian."
        subtitle="Periksa ancaman digital dan simpan riwayat pemeriksaanmu."
      />
      <form
        ref={form}
        noValidate
        onSubmit={submit}
        aria-label="Daftar akun Guardian Lab"
        aria-busy={request.isPending}
        className={cn(styles.form, styles.credentials, styles.registration)}
      >
        <AuthField
          id="name"
          name="name"
          label="Nama"
          startAdornment={<UserRound />}
          type="text"
          autoComplete="name"
          maxLength={50}
          required
          value={values.name}
          onChange={(event) => change("name", event.target.value)}
          error={errors.name}
          placeholder="Nama kamu"
          disabled={request.isPending}
        />
        <AuthField
          id="email"
          name="email"
          label="Email"
          startAdornment={<Mail />}
          type="email"
          inputMode="email"
          autoComplete="email"
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
          value={values.phone}
          onChange={(event) => change("phone", event.target.value)}
          error={errors.phone}
          placeholder="08… atau +62…"
          disabled={request.isPending}
        />
        <AuthPasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          aria-description="Minimal 8 karakter, dengan huruf dan angka."
          required
          value={values.password}
          onChange={(event) => change("password", event.target.value)}
          error={errors.password}
          placeholder="8+ karakter, huruf & angka"
          disabled={request.isPending}
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
          disabled={request.isPending}
        />
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
              Membuat akun…
            </>
          ) : (
            "Buat akun"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        Sudah punya akun?{" "}
        <Link href={AUTH_ROUTES.loginWithRedirect(redirectTarget)} className={styles.link}>
          Masuk
        </Link>
      </p>
    </>
  );
}
