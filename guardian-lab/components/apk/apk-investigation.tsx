"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthGateModal } from "@/components/landing/auth-gate-modal";
import { landingTypography } from "@/components/landing/landing-font";
import { ResultPresenter } from "@/components/landing/results/result-presenter";
import { InvestigationView } from "@/components/shared/investigation-view";
import type { UserSession } from "@/lib/auth/session";
import { useInvestigationFiles } from "@/lib/hooks/use-investigation-files";
import { useInvestigationSubmit } from "@/lib/hooks/use-investigation-submit";
import { API_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import { ApkFeatures } from "./apk-features";
import { ApkIntro } from "./apk-intro";
import { ApkScene } from "./apk-scene";
import { ApkUploadPanel } from "./apk-upload-panel";
import styles from "./apk-workspace.module.css";

export function ApkInvestigation({ user }: { user: UserSession }) {
  const params = useSearchParams();
  const recordId = params.get("investigation");
  const [authOpen, setAuthOpen] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const files = useInvestigationFiles();
  const mutation = useInvestigationSubmit(
    {
      currentUser: user,
      onAnalysisStart: clearResult,
      onAnalysisSuccess: (record) => {
        window.history.pushState(
          null,
          "",
          PROTECTED_ROUTES.apkWithInvestigation(
            record.id,
            new URLSearchParams(window.location.search).get("mode") === "geek" ? "geek" : undefined,
          ),
        );
      },
    },
    () => setAuthOpen(true),
  );

  function clearResult() {
    const next = new URLSearchParams(window.location.search);
    next.delete("investigation");
    window.history.replaceState(null, "", `${PROTECTED_ROUTES.apk}${next.size ? `?${next}` : ""}`);
  }
  function inputChanged() {
    mutation.resetFeedback();
    clearResult();
  }
  function submit() {
    if (mutation.isLoading) return;
    if (!files.apkFile) {
      files.selectFiles("apk", []);
      return;
    }
    const body = new FormData();
    body.set("file", files.apkFile);
    mutation.submit(API_ROUTES.analyzeApk, body, files.apkFile.name);
  }
  useEffect(() => {
    if (!recordId && !mutation.requestError) return;
    const timer = setTimeout(
      () =>
        resultRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        }),
      100,
    );
    return () => clearTimeout(timer);
  }, [recordId, mutation.isLoading, mutation.requestError]);

  const returnTo = recordId
    ? PROTECTED_ROUTES.apkWithInvestigation(
        recordId,
        params.get("mode") === "geek" ? "geek" : undefined,
      )
    : PROTECTED_ROUTES.apkWithMode(params.get("mode") === "geek" ? "geek" : "human");
  return (
    <div className={styles.content}>
      <section className={styles.hero} aria-label="Bedah APK" data-user-reveal>
        <div className={styles.formColumn}>
          <ApkIntro compact={Boolean(recordId)} />
          <ApkUploadPanel
            file={files.apkFile}
            error={files.errors.apk}
            pending={mutation.isLoading}
            requestError={mutation.requestError}
            uncertain={mutation.uncertain}
            onSelect={(selected) => {
              files.selectFiles("apk", selected);
              inputChanged();
            }}
            onClear={() => {
              files.clearFile("apk");
              inputChanged();
            }}
            onSubmit={submit}
          />
        </div>
        <ApkScene pending={mutation.isLoading} selected={Boolean(files.apkFile)} />
      </section>
      <ApkFeatures />
      {(recordId || mutation.isLoading || mutation.requestError) && (
        <section
          ref={resultRef}
          aria-label="Hasil pemeriksaan APK"
          className="scroll-mt-28"
          data-user-reveal
        >
          {mutation.isLoading || mutation.requestError ? (
            <ResultPresenter
              presentation="workspace"
              result={null}
              isLoading={mutation.isLoading}
              error={mutation.requestError}
            />
          ) : recordId ? (
            <InvestigationView
              presentation="workspace"
              id={recordId}
              scope={`${user.id}:${user.role}`}
              expectedType="APK"
              returnTo={returnTo}
            />
          ) : null}
        </section>
      )}
      <AuthGateModal
        className={landingTypography}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        pendingType="apk"
        returnTo={returnTo}
      />
    </div>
  );
}
