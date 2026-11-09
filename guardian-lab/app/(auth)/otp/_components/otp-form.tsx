"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { API_ROUTES, AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { AuthField } from "../../_components/auth-field";
import { AuthHeader } from "../../_components/auth-header";
import { useAuthAction } from "../../_hooks/use-auth-action";
import styles from "../../auth.module.css";

const statusSchema = z.object({
  purpose: z.enum(["VERIFY", "RESET", "RESET_READY"]),
  maskedPhone: z.string().nullable(),
  deliveryStatus: z.string().nullable(),
  resendAt: z.string().nullable(),
});
type Status = z.infer<typeof statusSchema>;
export function OtpForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadError, setLoadError] = useState<"expired" | "network" | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const verify = useAuthAction();
  const resend = useAuthAction();
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch(API_ROUTES.authOtpStatus, {
          cache: "no-store",
          signal: abort.signal,
        });
        const body: unknown = await response.json();
        const parsed = statusSchema.safeParse(body);
        if (!response.ok || !parsed.success) {
          setLoadError(response.status === 401 ? "expired" : "network");
          return;
        }
        if (parsed.data.purpose === "RESET_READY") {
          window.location.replace(AUTH_ROUTES.resetPassword);
          return;
        }
        setStatus(parsed.data);
      } catch {
        if (!abort.signal.aborted) setLoadError("network");
      }
    }
    void load();
    return () => abort.abort();
  }, []);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds =
    status?.resendAt && now
      ? Math.max(0, Math.ceil((Date.parse(status.resendAt) - now) / 1000))
      : 0;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setFieldError("Masukkan enam digit kode OTP.");
      event.currentTarget.querySelector<HTMLInputElement>('[name="code"]')?.focus();
      return;
    }
    setFieldError(null);
    const result = await verify.run(API_ROUTES.authOtpVerify, { code });
    if (result?.redirectTo)
      window.location.assign(getSafeRedirectUrl(result.redirectTo, PUBLIC_ROUTES.home));
  }
  async function resendCode() {
    setNotice(null);
    const result = await resend.run(API_ROUTES.authOtpSend);
    setStatus((previous) =>
      previous
        ? {
            ...previous,
            resendAt: new Date(Date.now() + 60000).toISOString(),
            deliveryStatus: result ? "QUEUED" : previous.deliveryStatus,
          }
        : previous,
    );
    if (result) setNotice(result.message || "Kode sedang diproses. Periksa WhatsApp kamu.");
  }
  if (loadError)
    return (
      <>
        <AuthHeader
          title={
            loadError === "expired" ? "Sesi verifikasi berakhir." : "Verifikasi belum tersedia."
          }
          subtitle={
            loadError === "expired"
              ? "Mulai kembali untuk meminta kode WhatsApp."
              : "Periksa koneksi dan coba memuat halaman lagi."
          }
        />
        {loadError === "network" && (
          <button type="button" className={styles.submit} onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        )}
        <Link className={styles.submit} href={AUTH_ROUTES.login}>
          Kembali ke masuk
        </Link>
        <p className={styles.prompt}>
          <Link className={styles.link} href={AUTH_ROUTES.forgotPassword}>
            Lupa password?
          </Link>
        </p>
      </>
    );
  if (!status) return <output className={styles.heading}>Menyiapkan verifikasi…</output>;
  const description =
    status.purpose === "VERIFY" && status.maskedPhone
      ? `Masukkan kode enam digit untuk ${status.maskedPhone}.`
      : "Jika nomor terdaftar dan dapat dihubungi, kode sedang diproses melalui WhatsApp.";
  return (
    <>
      <AuthHeader title="Verifikasi WhatsApp." subtitle={description} />
      <form
        noValidate
        onSubmit={submit}
        className={styles.form}
        aria-label="Verifikasi kode WhatsApp"
        aria-busy={verify.pending}
      >
        <AuthField
          id="code"
          name="code"
          label="Kode OTP"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setFieldError(null);
            verify.setError(null);
          }}
          error={fieldError || undefined}
          placeholder="Enam digit kode"
          disabled={verify.pending || resend.pending}
        />
        {(verify.error ||
          resend.error ||
          (status.purpose === "VERIFY" && status.deliveryStatus !== "QUEUED" && !notice)) && (
          <p className={styles.serverError} role="alert">
            {verify.error ||
              resend.error ||
              "Kode belum dapat dikirim. Coba kirim ulang setelah jeda."}
          </p>
        )}
        {notice && !verify.error && !resend.error && (
          <output className={styles.otpNotice}>{notice}</output>
        )}
        <button type="submit" className={styles.submit} disabled={verify.pending || resend.pending}>
          {verify.pending ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{" "}
              Memverifikasi…
            </>
          ) : (
            "Verifikasi kode"
          )}
        </button>
      </form>
      <p className={styles.prompt}>
        Belum menerima kode?{" "}
        <button
          type="button"
          className={styles.link}
          onClick={resendCode}
          disabled={seconds > 0 || resend.pending || verify.pending}
        >
          {seconds > 0 ? `Kirim ulang (${seconds} dtk)` : "Kirim ulang"}
        </button>
        {status.purpose === "VERIFY" && (
          <Link href={AUTH_ROUTES.changePhone} className={styles.link}>
            Ganti nomor
          </Link>
        )}
      </p>
      <p className={styles.otpHint}>Kode berlaku 10 menit. Jangan bagikan kode kepada siapa pun.</p>
    </>
  );
}
