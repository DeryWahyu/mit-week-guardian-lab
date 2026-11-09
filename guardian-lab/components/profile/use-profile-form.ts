"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { notifyProfileUpdated } from "@/lib/auth/events";
import { API_ROUTES } from "@/lib/routes";
import { type Profile, profileSavedSchema, profileUpdateSchema } from "@/lib/validations/profile";

const errorSchema = z.object({ error: z.string().max(1000) });
export function useProfileForm(profile: Profile, onSaved: () => void) {
  const [name, setName] = useState(profile.name);
  const [saved, setSaved] = useState({ name: profile.name, revision: profile.updatedAt });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  const dirty = name.trim() !== saved.name;
  function change(value: string) {
    setName(value);
    setFieldError(null);
    setError(null);
  }
  function reset() {
    setName(saved.name);
    setFieldError(null);
    setError(null);
  }
  async function submit() {
    if (active.current || !dirty) return;
    const parsed = profileUpdateSchema.safeParse({ name, revision: saved.revision });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Periksa nama profilmu.");
      fieldRef.current?.focus();
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError(null);
    setFieldError(null);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API_ROUTES.profile, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      const value: unknown = await response.json();
      if (!response.ok) {
        const message = errorSchema.safeParse(value);
        throw new Error(message.success ? message.data.error : "Profil belum dapat disimpan.");
      }
      const result = profileSavedSchema.safeParse(value);
      if (!result.success)
        throw new Error(
          "Penyimpanan belum terkonfirmasi. Muat ulang profil untuk memastikan perubahan.",
        );
      if (controller.signal.aborted) return;
      setSaved({ name: result.data.name, revision: result.data.updatedAt });
      setName(result.data.name);
      toast.success("Nama profil berhasil diperbarui.");
      notifyProfileUpdated();
      onSaved();
    } catch (cause) {
      if (active.current !== controller) return;
      setError(
        controller.signal.aborted
          ? "Penyimpanan belum terkonfirmasi. Muat ulang profil sebelum mencoba lagi."
          : cause instanceof TypeError || cause instanceof SyntaxError
            ? "Koneksi atau respons belum dapat dibaca. Muat ulang profil untuk memastikan perubahan."
            : cause instanceof Error
              ? cause.message
              : "Profil belum dapat disimpan.",
      );
    } finally {
      clearTimeout(timer);
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { name, change, reset, submit, fieldRef, dirty, pending, error, fieldError };
}
