"use client";

import { useEffect, useRef, useState } from "react";

type Overlay = "none" | "qr" | "auth";

export function useGatewayOverlays(tab: "url" | "qr", recordId: string | null) {
  const [overlay, setOverlay] = useState<Overlay>("none");
  const currentOverlay = useRef<Overlay>("none");
  const nextOverlay = useRef<Overlay>("none");

  function changeOverlay(next: Overlay) {
    currentOverlay.current = next;
    setOverlay(next);
  }
  useEffect(() => {
    if (currentOverlay.current === "auth") return;
    nextOverlay.current = "none";
    currentOverlay.current = tab === "qr" && !recordId ? "qr" : "none";
    setOverlay(currentOverlay.current);
  }, [tab, recordId]);

  function finishClose(open: boolean) {
    if (open || nextOverlay.current === "none") return;
    const next = nextOverlay.current;
    nextOverlay.current = "none";
    changeOverlay(next);
  }
  function showAuth() {
    if (currentOverlay.current === "qr") {
      nextOverlay.current = "auth";
      changeOverlay("none");
    } else changeOverlay("auth");
  }
  function closeAuth() {
    nextOverlay.current = tab === "qr" && !recordId ? "qr" : "none";
    changeOverlay("none");
  }
  function hideAll() {
    nextOverlay.current = "none";
    changeOverlay("none");
  }
  return {
    qrOpen: overlay === "qr",
    authOpen: overlay === "auth",
    showQr: () => {
      nextOverlay.current = "none";
      changeOverlay("qr");
    },
    showAuth,
    closeAuth,
    hideAll,
    finishClose,
    handingOff: () => nextOverlay.current !== "none" || currentOverlay.current !== "none",
  };
}
