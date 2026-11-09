"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PROFILE_UPDATED_EVENT } from "@/lib/auth/events";
import type { UserSession } from "@/lib/auth/session";
import { API_ROUTES, AUTH_ROUTES } from "@/lib/routes";
import { sessionResponseSchema } from "@/lib/validations/auth";

export function useSessionUser(initialUser?: UserSession | null) {
  const [user, setUser] = useState<UserSession | null>(initialUser ?? null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const logoutLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let version = 0;
    const refresh = () => {
      if (logoutLock.current) return;
      const current = ++version;
      void fetch(API_ROUTES.authMe, { signal: controller.signal, cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: unknown) => {
          const parsed = sessionResponseSchema.safeParse(data);
          if (!controller.signal.aborted && current === version && !logoutLock.current)
            setUser(parsed.success ? parsed.data.user : null);
        })
        .catch(() => {
          if (!controller.signal.aborted && current === version && !logoutLock.current)
            setUser(null);
        });
    };
    if (initialUser !== undefined) setUser(initialUser);
    else refresh();
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => {
      controller.abort();
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
    };
  }, [initialUser]);

  function requestLogout() {
    if (logoutLock.current) return;
    setLogoutError(null);
    setLogoutOpen(true);
  }

  function changeLogoutOpen(open: boolean) {
    if (logoutLock.current) return;
    setLogoutOpen(open);
    if (!open) setLogoutError(null);
  }

  async function confirmLogout() {
    if (!logoutOpen || logoutLock.current) return;
    logoutLock.current = true;
    setIsLoggingOut(true);
    setLogoutError(null);
    let signedOut = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API_ROUTES.authLogout, {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Gagal keluar. Silakan coba kembali.");
      signedOut = true;
      setUser(null);
      toast.success("Berhasil keluar dari akun.");
      window.location.replace(AUTH_ROUTES.login);
    } catch (error) {
      const message = controller.signal.aborted
        ? "Keluar belum terkonfirmasi. Periksa koneksimu, lalu coba kembali."
        : error instanceof TypeError
          ? "Terjadi gangguan koneksi saat keluar. Silakan coba kembali."
          : "Gagal keluar. Silakan coba kembali.";
      setLogoutError(message);
      toast.error(message);
    } finally {
      clearTimeout(timeout);
      if (!signedOut) {
        logoutLock.current = false;
        setIsLoggingOut(false);
      }
    }
  }

  return {
    user,
    isLoggingOut,
    requestLogout,
    confirmLogout,
    logoutOpen,
    changeLogoutOpen,
    logoutError,
  };
}
