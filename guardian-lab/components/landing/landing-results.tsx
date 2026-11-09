"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ShieldAlert, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InvestigationView } from "@/components/shared/investigation-view";
import type { UserSession } from "@/lib/auth/session";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { landingTypography } from "./landing-font";

type Props = {
  initialUser?: UserSession | null;
  isAnalyzing: boolean;
  error: string | null;
  activeId?: string | null;
  onClose?: () => void;
};

function scrollTo(element: HTMLElement | null) {
  element?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}

export function LandingResults({ initialUser, activeId, onClose }: Props) {
  const params = useSearchParams();
  const searchParamId = params.get("investigation");
  const targetId = activeId || searchParamId;

  const [isOpen, setIsOpen] = useState(Boolean(targetId));
  const [displayedId, setDisplayedId] = useState<string | null>(targetId);
  const initialNavigation = useRef({ searchParamId, tab: params.get("tab") });

  useEffect(() => {
    const { searchParamId: initialRecord, tab } = initialNavigation.current;
    if (initialRecord || (tab !== "url" && tab !== "qr" && window.location.hash !== "#periksa"))
      return;
    const timer = setTimeout(() => scrollTo(document.getElementById("periksa")), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (targetId) {
      setDisplayedId(targetId);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [targetId]);

  function handleClose() {
    setIsOpen(false);
    const next = new URLSearchParams(window.location.search);
    if (next.has("investigation")) {
      next.delete("investigation");
      window.history.replaceState(
        null,
        "",
        `${PUBLIC_ROUTES.home}${next.size ? `?${next}` : ""}${window.location.hash}`,
      );
    }
    onClose?.();
  }

  if (!displayedId && !isOpen) return null;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity" />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[88dvh] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-950/30 sm:rounded-3xl",
            landingTypography,
          )}
        >
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
                <ShieldAlert className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-sm font-bold text-slate-900 sm:text-base">
                  Hasil Deteksi Phishing
                </Dialog.Title>
                <Dialog.Description className="text-[11px] text-slate-500">
                  Laporan forensik keamanan tautan dan kode QR
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              type="button"
              onClick={handleClose}
              className="inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Tutup hasil pemeriksaan"
            >
              <X className="size-4.5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {displayedId ? (
              <InvestigationView
                id={displayedId}
                presentation="dialog"
                scope={initialUser ? `${initialUser.id}:${initialUser.role}` : "guest"}
              />
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
