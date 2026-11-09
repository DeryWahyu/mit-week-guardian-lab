"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { API_ROUTES } from "@/lib/routes";
import { investigationSchema } from "@/lib/validations/investigation";
import type { sandboxSessionSchema } from "@/lib/validations/sandbox";
export function useQuarantinedDownloads(session: z.infer<typeof sandboxSessionSchema>) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      const current = active.current;
      active.current = null;
      current?.abort();
    },
    [],
  );
  const records = {
    ...Object.fromEntries(session.downloadAnalyses.map((a) => [a.downloadId, a.recordId])),
    ...saved,
  };
  async function analyze(downloadId: string) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(downloadId);
    setError(null);
    const timer = setTimeout(() => controller.abort(), 70000);
    try {
      const response = await fetch(
        API_ROUTES.sandboxAnalyzeDownload(session.sessionId, downloadId),
        { method: "POST", signal: controller.signal },
      );
      const payload = await response.json();
      const parsed = investigationSchema.safeParse(payload);
      if (!parsed.success || (!response.ok && response.status !== 422))
        throw new Error(
          payload.error ?? "Hasil belum terkonfirmasi. Periksa riwayat sebelum mencoba lagi.",
        );
      if (active.current !== controller) return;
      setSaved((old) => ({ ...old, [downloadId]: parsed.data.id }));
      if (parsed.data.status === "FAILED")
        toast.error(
          "Berkas sudah diperiksa, tetapi ekstraksi gagal. Lihat hasil untuk rinciannya.",
        );
      else toast.success("Hasil bedah statis APK tersimpan di riwayat.");
    } catch (cause) {
      if (active.current !== controller) return;
      const message =
        controller.signal.aborted || cause instanceof TypeError
          ? "Koneksi terputus. Periksa riwayat sebelum mencoba lagi."
          : cause instanceof Error
            ? cause.message
            : "Berkas belum dapat diperiksa.";
      setError(message);
      toast.error(message);
    } finally {
      clearTimeout(timer);
      if (active.current === controller) {
        active.current = null;
        setPending(null);
      }
    }
  }
  return { pending, error, records, analyze };
}
