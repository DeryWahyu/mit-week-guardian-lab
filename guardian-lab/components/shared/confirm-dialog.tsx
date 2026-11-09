"use client";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  error,
  onConfirm,
  confirmLabel,
  pendingLabel = "Menyimpan keputusan…",
  tone = "danger",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  confirmLabel: string;
  pendingLabel?: string;
  tone?: "brand" | "danger";
  className?: string;
}) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs" />
        <AlertDialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-[100] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-1/2 space-y-4 overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl",
            className,
          )}
        >
          <AlertDialog.Title className="text-lg font-bold text-slate-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm [overflow-wrap:anywhere] text-slate-600">
            {description}
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="text-sm text-rose-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialog.Close
              disabled={pending}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm"
            >
              Batal
            </AlertDialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={cn(
                "min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
                tone === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600"
                  : "bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600",
              )}
            >
              {pending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
