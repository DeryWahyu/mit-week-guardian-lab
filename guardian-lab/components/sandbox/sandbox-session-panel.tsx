"use client";

import {
  ArrowUpRight,
  CircleAlert,
  Clock3,
  FileArchive,
  Lock,
  Maximize2,
  Minimize2,
  Monitor,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { sandboxSessionSchema } from "@/lib/validations/sandbox";
import { QuarantinedDownloads } from "./quarantined-downloads";

const messages = {
  STARTING: {
    title: "Menyiapkan ruang jelajah...",
    description: "Browser terisolasi sedang disiapkan. Status diperbarui otomatis.",
  },
  UNKNOWN: {
    title: "Status sesi perlu diperiksa.",
    description:
      "Koneksi runtime terputus. Pembersihan belum terkonfirmasi; periksa status kembali.",
  },
  FAILED: {
    title: "Browser belum berhasil dibuka.",
    description: "Mulai sesi baru melalui form tautan. Jika masih gagal, periksa status layanan.",
  },
  DESTROYED: {
    title: "Sesi dan data sementara telah dihapus.",
    description: "Mulai sesi baru melalui form tautan untuk melanjutkan penjelajahan.",
  },
  EXPIRED: {
    title: "Sesi jelajah telah berakhir.",
    description: "Mulai sesi baru melalui form tautan untuk melanjutkan penjelajahan.",
  },
};

export function SandboxSessionPanel({
  session,
  remaining,
  pending,
  error,
  onStop,
  onRefresh: _onRefresh,
}: {
  session: z.infer<typeof sandboxSessionSchema>;
  remaining: number;
  pending: boolean;
  error?: string | null;
  onStop: () => void;
  onRefresh?: () => void;
}) {
  const live = ["STARTING", "ACTIVE", "UNKNOWN"].includes(session.status);
  const seconds = Math.max(0, Math.min(180, remaining));
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const isUrgent = seconds <= 30 && seconds > 0;

  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [showQuarantine, setShowQuarantine] = useState(false);

  // Lock body scroll while in live fullscreen mode
  useEffect(() => {
    if (!live) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [live]);

  // Track native OS fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored if user cancels or permission denied
    }
  };

  const unknown = session.status === "UNKNOWN";
  const failed = session.status === "FAILED";
  const deleted = session.status === "DESTROYED";
  const StateIcon = unknown || failed ? CircleAlert : deleted ? ShieldCheck : Monitor;
  const message =
    session.status === "ACTIVE"
      ? seconds > 0
        ? {
            title: "Menunggu tampilan browser.",
            description: "Stream belum tersedia. Tunggu beberapa saat untuk melihat pembaruan.",
          }
        : {
            title: "Sesi jelajah telah berakhir.",
            description: "Waktu sesi selesai. Menutup container...",
          }
      : messages[session.status];

  // If session is NOT live (e.g. EXPIRED, DESTROYED, FAILED), render standard terminal card
  if (!live) {
    return (
      <section
        aria-label="Sesi sandbox berakhir"
        className="w-full rounded-[22px] border border-slate-200/90 bg-white p-8 text-slate-900 shadow-2xs sm:p-12"
      >
        <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-2xs">
            <StateIcon className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900">{message.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{message.description}</p>
          </div>
          <button
            type="button"
            onClick={onStop}
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-cyan-800 disabled:opacity-50"
          >
            Mulai sesi baru
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Sesi sandbox"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 select-none"
    >
      {/* Top Header / Control Bar (Guardian Lab Theme) */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-3.5 text-slate-800 shadow-2xs backdrop-blur-md sm:px-5">
        {/* Left: Identity & Target URL */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-2xs">
              <Monitor aria-hidden="true" className="size-4" />
            </span>
            <div className="hidden sm:block">
              <h2 className="text-xs leading-none font-bold tracking-tight text-slate-900 sm:text-sm">
                Browser Terisolasi
              </h2>
            </div>
          </div>

          {/* Target URL Pill */}
          <div className="flex max-w-[180px] min-w-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs shadow-2xs sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
            <Lock className="size-3 shrink-0 text-cyan-700" aria-hidden="true" />
            <span
              data-testid="sandbox-active-target"
              className="truncate font-mono text-[11px] font-medium text-slate-700"
              title={session.targetUrl}
            >
              {session.targetUrl}
            </span>
            {session.sourceInvestigationId && (
              <Link
                href={PROTECTED_ROUTES.historyDetail(session.sourceInvestigationId)}
                target="_blank"
                className="ml-0.5 shrink-0 text-cyan-700 transition-colors hover:text-cyan-800"
                title="Buka investigasi sumber di tab baru"
              >
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* Center: Timer Countdown */}
        <div
          role="timer"
          aria-label={`Sisa waktu ${seconds} detik`}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1 shadow-2xs transition-colors",
            isUrgent
              ? "animate-pulse border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200/90 bg-slate-50/90 text-cyan-800",
          )}
        >
          <Clock3 className="size-3.5 shrink-0 text-cyan-700" aria-hidden="true" />
          <span className="hidden text-[11px] font-semibold text-slate-500 md:inline">
            Sisa waktu:
          </span>
          <strong className="font-mono text-xs font-bold tracking-wider text-slate-900 tabular-nums sm:text-sm">
            {time}
          </strong>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {session.downloads.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQuarantine(true)}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800 shadow-2xs transition-colors hover:bg-cyan-100/80"
              title="Lihat berkas APK yang diunduh ke karantina"
            >
              <FileArchive className="size-3.5 text-cyan-700" aria-hidden="true" />
              <span className="hidden sm:inline">Karantina</span>
              <span className="py-0.2 rounded-full bg-cyan-600 px-1.5 text-[10px] font-bold text-white">
                {session.downloads.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="hidden size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 sm:flex"
            title={isNativeFullscreen ? "Keluar layar penuh" : "Layar penuh (F11)"}
            aria-label={isNativeFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          >
            {isNativeFullscreen ? (
              <Minimize2 className="size-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-2xs transition-colors hover:bg-rose-100/90 disabled:opacity-50"
          >
            <Square className="size-3 fill-rose-600 text-rose-600" aria-hidden="true" />
            <span>Hentikan sesi</span>
          </button>
        </div>
      </header>

      {/* Thin Progress Bar below Header */}
      <div className="relative z-10 h-[2px] w-full overflow-hidden bg-slate-100">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isUrgent
              ? "bg-gradient-to-r from-amber-500 to-rose-500"
              : "bg-gradient-to-r from-cyan-600 to-teal-500",
          )}
          style={{ width: `${(seconds / 180) * 100}%` }}
        />
      </div>

      {/* Error Notice in Fullscreen (if any) */}
      {error && (
        <div className="absolute top-16 left-1/2 z-30 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-xl border border-rose-600/70 bg-rose-950/90 p-3 text-xs text-rose-200 shadow-xl">
          <CircleAlert className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Viewport (Browser Iframe or Loading State) */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-slate-950">
        {session.status === "ACTIVE" && session.streamUrl && remaining > 0 ? (
          <iframe
            title="Browser Chromium terisolasi"
            src={session.streamUrl}
            className="block h-full w-full border-0 bg-slate-950"
            sandbox="allow-scripts allow-same-origin"
            allow="clipboard-read 'none'; clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-cyan-800/60 bg-cyan-950/80 text-cyan-400 shadow-xl">
              <Monitor className="size-8 animate-pulse" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">{message.title}</h3>
              <p className="text-xs leading-relaxed text-slate-400">{message.description}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-cyan-800/40 bg-cyan-950/40 px-3.5 py-1 text-xs text-cyan-400">
              <span className="size-1.5 animate-ping rounded-full bg-cyan-400" />
              <span>Menghubungkan ke Chromium terisolasi...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quarantined Downloads Modal in Fullscreen */}
      {showQuarantine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileArchive className="size-5 text-cyan-700" />
                <h3 className="text-base font-bold text-slate-900">Karantina Unduhan APK</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuarantine(false)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                title="Tutup"
              >
                <X className="size-4" />
              </button>
            </div>
            <QuarantinedDownloads session={session} />
          </div>
        </div>
      )}
    </section>
  );
}
