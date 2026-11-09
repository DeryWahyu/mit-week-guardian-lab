"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Lock, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-identity";
import { AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface AuthGateModalProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  pendingType: "url" | "qr" | "apk";
  pendingTarget?: string;
  returnTo?: string;
  onOpenChangeComplete?: (open: boolean) => void;
  returnFocus?: () => HTMLElement | null | false;
}

export function AuthGateModal({
  className,
  isOpen,
  onClose,
  pendingType,
  pendingTarget,
  returnTo,
  onOpenChangeComplete,
  returnFocus,
}: AuthGateModalProps) {
  const returnUrl =
    returnTo ??
    (pendingType === "apk"
      ? PROTECTED_ROUTES.apk
      : pendingTarget
        ? `${PUBLIC_ROUTES.homeWithTab(pendingType)}&target=${encodeURIComponent(pendingTarget)}`
        : PUBLIC_ROUTES.homeWithTab(pendingType));

  const loginRedirect = AUTH_ROUTES.loginWithRedirect(returnUrl);
  const registerRedirect = AUTH_ROUTES.registerWithRedirect(returnUrl);

  const typeLabel =
    pendingType === "apk"
      ? "Pemeriksaan APK"
      : pendingType === "qr"
        ? "Pemeriksaan Kode QR"
        : "Deteksi Tautan Phishing";

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChangeComplete={onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Popup
          finalFocus={returnFocus}
          className={cn(
            "bg-background fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 overflow-y-auto rounded-3xl border border-slate-200/90 p-6 text-center shadow-2xl shadow-slate-900/20 sm:p-8",
            className,
          )}
        >
          {/* Close Button */}
          <Dialog.Close
            type="button"
            className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
            aria-label="Tutup dialog"
          >
            <X className="size-4" />
          </Dialog.Close>

          <BrandMark className="mt-2 size-14" />

          {/* Category Pill */}
          <div className="border-brand-200/80 bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
            <Lock className="text-brand-600 size-3" />
            <span>Autentikasi Diperlukan • {typeLabel}</span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-extrabold tracking-tight text-slate-900">
              Masuk untuk melanjutkan pemeriksaan
            </Dialog.Title>
            <Dialog.Description className="mx-auto max-w-xs text-xs leading-relaxed text-slate-600 sm:text-sm">
              Gunakan akun dengan nomor WhatsApp terverifikasi untuk mengirim pemeriksaan dan
              menyimpan riwayat.
              {pendingType !== "url" && " Berkas perlu dipilih ulang setelah login."}
            </Dialog.Description>
          </div>

          {/* Pending Target Preview Pill */}
          {pendingTarget && (
            <div className="w-full rounded-2xl border border-slate-200/70 bg-white p-2.5 text-left">
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Target Investigasi Pending
              </span>
              <code className="font-mono text-xs font-semibold break-all text-slate-800 select-all">
                {pendingTarget}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-2">
            <Link
              href={loginRedirect}
              className="bg-brand-600 shadow-brand-200 hover:bg-brand-700 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-md transition-all"
            >
              <Sparkles className="size-4" />
              <span>Masuk Sekarang →</span>
            </Link>

            <Link
              href={registerRedirect}
              className="block w-full cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2.5 text-center text-xs font-semibold text-slate-800 shadow-xs transition-all hover:bg-slate-100 sm:text-sm"
            >
              Daftar Akun Baru
            </Link>

            <Dialog.Close
              type="button"
              className="cursor-pointer pt-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-700"
            >
              Nanti Saja
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
