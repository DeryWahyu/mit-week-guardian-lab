"use client";

import { Suspense, useRef } from "react";
import { InvestigationRequestFeedback } from "@/components/shared/investigation-request-feedback";
import { cn } from "@/lib/utils";
import type { AnalysisGatewayProps } from "./analysis-gateway-types";
import { AuthGateModal } from "./auth-gate-modal";
import { GatewayAccountNotice } from "./gateway-account-notice";
import styles from "./gateway.module.css";
import { GatewaySkeleton } from "./gateway-skeleton";
import { GatewayUrlField } from "./gateway-url-field";
import { landingTypography } from "./landing-font";
import { QrUploadDialog } from "./qr-upload-dialog";
import { useAnalysisGateway } from "./use-analysis-gateway";

export type { AnalysisGatewayProps } from "./analysis-gateway-types";

function AnalysisGatewayInner(props: AnalysisGatewayProps) {
  const gateway = useAnalysisGateway(props);
  const input = useRef<HTMLInputElement>(null);
  const qrTrigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <form
        noValidate
        aria-label="Pemeriksaan tautan"
        aria-busy={gateway.busy}
        onSubmit={(event) => {
          event.preventDefault();
          if (gateway.submitUrl() === false) input.current?.focus();
        }}
        className={cn(styles.card, props.className)}
      >
        <GatewayUrlField
          inputRef={input}
          value={gateway.urlInput}
          error={gateway.urlError}
          disabled={gateway.isLoading}
          onChange={gateway.changeUrl}
          qrTriggerRef={qrTrigger}
          onOpenQr={gateway.openQr}
          accountHelpId={props.currentUser ? undefined : "gateway-account-help"}
        />
        <div className={styles.fieldDetails}>
          {gateway.urlError && (
            <p id="url-error" role="alert" className={styles.urlError}>
              {gateway.urlError}
            </p>
          )}
          <InvestigationRequestFeedback error={gateway.requestError} uncertain={gateway.uncertain} />
          <p className={styles.fieldHelp}>Tautannya belum dibuka di perangkatmu.</p>
          {!props.currentUser && <GatewayAccountNotice id="gateway-account-help" />}
          {gateway.isLoading && (
            <output className={styles.fieldHelp}>
              Input sedang dibaca dan dicatat. Tunggu sampai status investigasi tampil.
            </output>
          )}
        </div>
      </form>
      <QrUploadDialog
        open={gateway.overlays.qrOpen}
        file={gateway.qrFile}
        preview={gateway.qrPreview}
        error={gateway.qrError}
        requestError={gateway.requestError}
        uncertain={gateway.uncertain}
        busy={gateway.busy}
        requiresAccount={!props.currentUser}
        onClose={gateway.closeQr}
        onOpenChangeComplete={gateway.overlays.finishClose}
        onSelect={gateway.selectQr}
        onClear={gateway.clearQr}
        onSubmit={gateway.submitQr}
        returnFocus={() => (gateway.overlays.handingOff() ? false : qrTrigger.current)}
      />
      <AuthGateModal
        className={landingTypography}
        isOpen={gateway.overlays.authOpen}
        onClose={gateway.overlays.closeAuth}
        onOpenChangeComplete={gateway.overlays.finishClose}
        pendingType={gateway.pendingType}
        pendingTarget={gateway.pendingTarget}
        returnFocus={() => (gateway.overlays.handingOff() ? false : input.current)}
      />
    </>
  );
}

export function AnalysisGateway(props: AnalysisGatewayProps) {
  return (
    <Suspense fallback={<GatewaySkeleton requiresAccount={!props.currentUser} />}>
      <AnalysisGatewayInner {...props} />
    </Suspense>
  );
}
