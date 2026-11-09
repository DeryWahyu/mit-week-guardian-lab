"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useInvestigationFiles } from "@/lib/hooks/use-investigation-files";
import { useInvestigationSubmit } from "@/lib/hooks/use-investigation-submit";
import { sanitizeInvestigationText } from "@/lib/investigations/privacy";
import { API_ROUTES } from "@/lib/routes";
import { scanUrlSchema } from "@/lib/validations/analysis-input";
import type { AnalysisGatewayProps } from "./analysis-gateway-types";
import { useGatewayOverlays } from "./use-gateway-overlays";

export function useAnalysisGateway(props: AnalysisGatewayProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab");
  const activeTab = tab === "qr" || tab === "url" ? tab : (props.defaultTab ?? "url");
  const target = params.get("target");
  const overlays = useGatewayOverlays(activeTab, params.get("investigation"));
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState("");
  const [pendingType, setPendingType] = useState<"url" | "qr">("url");
  const submissionType = useRef<"url" | "qr">("url");
  const files = useInvestigationFiles();
  const mutation = useInvestigationSubmit(
    {
      ...props,
      onAnalysisSuccess: (record) => {
        overlays.hideAll();
        props.onAnalysisSuccess?.(record);
      },
    },
    (value) => {
      const type = submissionType.current;
      setPendingType(type);
      setPendingTarget(type === "url" ? sanitizeInvestigationText(value) : "");
      overlays.showAuth();
    },
  );
  const busy = mutation.isLoading;

  useEffect(() => {
    if (target) setUrlInput(target);
  }, [target]);

  function changeTab(value: "url" | "qr", replace = false) {
    const next = new URLSearchParams(window.location.search);
    if (next.get("tab") === value) return;
    next.set("tab", value);
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      `${pathname}?${next}${window.location.hash}`,
    );
  }
  function inputChanged() {
    mutation.resetFeedback();
    props.onInputChange?.();
  }
  function changeUrl(value: string) {
    changeTab("url", true);
    setUrlInput(value);
    setUrlError(null);
    inputChanged();
  }
  function submitUrl() {
    if (busy) return;
    const parsed = scanUrlSchema.safeParse(urlInput);
    setUrlError(parsed.success ? null : (parsed.error.issues[0]?.message ?? "Tautan tidak valid."));
    if (!parsed.success) return false;
    changeTab("url", true);
    submissionType.current = "url";
    setUrlInput(parsed.data);
    mutation.submit(API_ROUTES.analyzeUrl, JSON.stringify({ url: parsed.data }), parsed.data, true);
    return true;
  }
  function submitQr() {
    if (busy) return;
    if (!files.qrFile) {
      files.selectFiles("qr", []);
      return;
    }
    submissionType.current = "qr";
    const form = new FormData();
    form.set("file", files.qrFile);
    mutation.submit(API_ROUTES.analyzeQr, form, files.qrFile.name);
  }
  function openQr() {
    if (busy) return;
    inputChanged();
    changeTab("qr");
    overlays.showQr();
  }
  function closeQr() {
    overlays.hideAll();
    changeTab("url", true);
    inputChanged();
  }
  return {
    urlInput,
    urlError,
    pendingType,
    pendingTarget,
    busy,
    isLoading: mutation.isLoading,
    requestError: mutation.requestError,
    uncertain: mutation.uncertain,
    qrFile: files.qrFile,
    qrPreview: files.qrPreview,
    qrError: files.errors.qr,
    selectQr: (selected: File[]) => {
      files.selectFiles("qr", selected);
      inputChanged();
    },
    clearQr: () => {
      files.clearFile("qr");
      inputChanged();
    },
    changeUrl,
    submitUrl,
    submitQr,
    openQr,
    closeQr,
    overlays,
  };
}
