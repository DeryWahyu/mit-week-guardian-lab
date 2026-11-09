"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, Loader2, QrCode, X } from "lucide-react";
import type { FormEvent } from "react";
import { InvestigationRequestFeedback } from "@/components/shared/investigation-request-feedback";
import { InvestigationUploadField } from "@/components/shared/investigation-upload-field";
import { cn } from "@/lib/utils";
import { GatewayAccountNotice } from "./gateway-account-notice";
import styles from "./gateway.module.css";
import { landingTypography } from "./landing-font";

type Props = {
  open: boolean;
  file: File | null;
  preview: string | null;
  error: string | null;
  requestError: string | null;
  uncertain: boolean;
  busy: boolean;
  requiresAccount?: boolean;
  onClose: () => void;
  onOpenChangeComplete: (open: boolean) => void;
  onSelect: (files: File[]) => void;
  onClear: () => void;
  onSubmit: () => void;
  returnFocus: () => HTMLElement | null | false;
};

export function QrUploadDialog(props: Props) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit();
  }
  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      onOpenChangeComplete={props.onOpenChangeComplete}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup
          finalFocus={props.returnFocus}
          className={cn(landingTypography, styles.dialog)}
        >
          <div className={styles.dialogHeading}>
            <QrCode aria-hidden="true" />
            <Dialog.Title className={styles.dialogTitle}>Baca tautan dari kode QR</Dialog.Title>
            <Dialog.Close aria-label="Tutup unggahan QR" className={styles.close}>
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className={styles.dialogDescription}>
            Pilih satu gambar QR. Tautannya dibaca tanpa membuka situs di perangkatmu.
          </Dialog.Description>
          <form
            noValidate
            onSubmit={submit}
            aria-label="Pemeriksaan gambar QR"
            aria-busy={props.busy}
          >
            <InvestigationUploadField
              type="qr"
              file={props.file}
              preview={props.preview}
              error={props.error}
              disabled={props.busy}
              onSelect={props.onSelect}
              onClear={props.onClear}
            />
            <InvestigationRequestFeedback error={props.requestError} uncertain={props.uncertain} />
            {props.requiresAccount && (
              <GatewayAccountNotice id="qr-account-help" className={styles.dialogAccountHelp} />
            )}
            <button
              type="submit"
              disabled={props.busy || !props.file}
              aria-describedby={props.requiresAccount ? "qr-account-help" : undefined}
              className={styles.dialogSubmit}
            >
              {props.busy ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <ArrowRight aria-hidden="true" />
              )}
              {props.busy ? "Memproses gambar…" : "Baca kode QR"}
            </button>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
