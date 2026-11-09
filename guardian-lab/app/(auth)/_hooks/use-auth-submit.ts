"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { API_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import {
  authSuccessSchema,
  getAuthError,
  getSafeRedirectUrl,
  otpRequiredSchema,
} from "@/lib/validations/auth";

type Options = {
  kind: "login" | "register";
  redirectTarget: string;
  onConflict?: (field: "email" | "phone") => void;
};

export function useAuthSubmit({ kind, redirectTarget, onConflict }: Options) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const locked = useRef(false);
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, []);

  function fail(message: string) {
    setServerError(message);
    toast.error(message);
  }
  async function submit(payload: Record<string, string>) {
    if (locked.current) return;
    locked.current = true;
    setIsPending(true);
    setServerError(null);
    const request = new AbortController();
    controller.current = request;
    let navigating = false;
    try {
      const response = await fetch(
        kind === "login" ? API_ROUTES.authLogin : API_ROUTES.authRegister,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, redirect: redirectTarget }),
          signal: request.signal,
        },
      );
      const body: unknown = await response.json();
      if (!active.current) return;
      if (!response.ok) {
        const message = getAuthError(
          body,
          kind === "login"
            ? "Gagal masuk. Periksa email dan password."
            : "Pendaftaran gagal. Periksa data akunmu.",
        );
        const conflict = z.object({ field: z.enum(["email", "phone"]) }).safeParse(body);
        if (response.status === 409 && kind === "register" && onConflict && conflict.success) {
          onConflict(conflict.data.field);
          toast.error(message);
        } else fail(message);
        return;
      }
      const pending = otpRequiredSchema.safeParse(body);
      if (pending.success) {
        if (!pending.data.deliveryQueued)
          toast.error("Kode belum dapat dikirim. Coba kirim ulang di halaman verifikasi.");
        window.location.assign(pending.data.redirectTo);
        navigating = true;
        return;
      }
      const parsed = authSuccessSchema.safeParse(body);
      if (!parsed.success) {
        fail("Respons autentikasi tidak valid. Silakan coba kembali.");
        return;
      }
      toast.success(
        kind === "login"
          ? "Selamat datang kembali di Guardian Lab."
          : "Akun berhasil dibuat. Selamat datang di Guardian Lab.",
      );
      window.location.assign(getSafeRedirectUrl(parsed.data.redirectTo, PUBLIC_ROUTES.home));
      navigating = true;
    } catch {
      if (active.current && !request.signal.aborted)
        fail("Koneksi bermasalah. Silakan coba kembali.");
    } finally {
      if (!navigating) {
        locked.current = false;
        if (active.current) setIsPending(false);
      }
    }
  }
  return { isPending, serverError, submit, clearError: () => setServerError(null) };
}
