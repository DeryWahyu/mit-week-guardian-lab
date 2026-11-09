"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { sandboxTargetPlan } from "@/lib/sandbox/target-plan";
import { QuarantinedDownloads } from "./quarantined-downloads";
import { SandboxFeatures } from "./sandbox-features";
import { SandboxIntro } from "./sandbox-intro";
import { SandboxLaunchPanel, SandboxServiceNotice } from "./sandbox-launch-panel";
import { SandboxProblem, SandboxSkeleton } from "./sandbox-page-state";
import { SandboxScene } from "./sandbox-scene";
import { SandboxSessionPanel } from "./sandbox-session-panel";
import { useSandboxSession } from "./use-sandbox-session";
import styles from "./web-sandbox.module.css";
export function WebSandboxView({ scope }: { scope: string }) {
  const params = useSearchParams();
  const target = params.get("target") ?? "";
  const source = params.get("investigation") ?? undefined;
  return (
    <WebSandboxForm
      key={JSON.stringify([scope, target, source])}
      scope={scope}
      initialTarget={target}
      initialSource={source}
    />
  );
}
function WebSandboxForm({
  scope,
  initialTarget,
  initialSource,
}: {
  scope: string;
  initialTarget: string;
  initialSource?: string;
}) {
  const [target, setTarget] = useState(initialTarget);
  const [source, setSource] = useState(initialSource);
  const [consent, setConsent] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const state = useSandboxSession(scope);
  const data = state.resource.data;
  const session = data?.session;
  const live = Boolean(session && ["STARTING", "ACTIVE", "UNKNOWN"].includes(session.status));
  const plan = sandboxTargetPlan(target);
  const different = Boolean(live && session && target && plan?.cleanUrl !== session.targetUrl);
  if (state.resource.loading) return <SandboxSkeleton />;
  if (!data || state.resource.problem) return <SandboxProblem retry={state.resource.retry} />;
  return (
    <div className={styles.content}>
      {live && <SandboxIntro compact />}
      {different && (
        <output className={styles.consentNotice}>
          Sesi sebelumnya masih berjalan. Tautan baru belum dibuka:{" "}
          <strong className={styles.breakTarget}>{plan?.cleanUrl}</strong>. Hentikan sesi aktif
          terlebih dahulu.
        </output>
      )}
      {live ? (
        <>
          <SandboxServiceNotice available={data.available} message={data.message} />
          {state.error && (
            <p role="alert" className={styles.errorNotice}>
              {state.error}
            </p>
          )}
        </>
      ) : (
        <>
          <section className={styles.launchHero} aria-label="Mulai sesi Ruang Uji" data-user-reveal>
            <div className={styles.heroForm}>
              <SandboxIntro />
              <SandboxLaunchPanel
                target={target}
                consent={consent}
                available={data.available}
                message={data.message}
                pending={Boolean(state.pending)}
                error={state.error}
                onTargetChange={(value) => {
                  state.resetRequest();
                  setTarget(value);
                  setSource(undefined);
                  setConsent(false);
                }}
                onConsentChange={setConsent}
                onSubmit={() => {
                  void state.mutate({
                    target,
                    stripParameters: consent,
                    sourceInvestigationId: source,
                  });
                }}
                onRefresh={state.resource.retry}
              />
            </div>
            <SandboxScene phase={state.pending ? "pending" : "idle"} />
          </section>
          <SandboxFeatures />
        </>
      )}
      {session && (
        <>
          <SandboxSessionPanel
            session={session}
            remaining={state.remaining}
            pending={Boolean(state.pending)}
            error={state.error}
            onStop={() => {
              if (live) {
                setConfirm(true);
              } else {
                void state.mutate();
              }
            }}
            onRefresh={state.resource.retry}
          />
          {!live && <QuarantinedDownloads key={session.sessionId} session={session} />}
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Hentikan sesi sandbox?"
        description="Browser dan data sementara pada container sesi ini akan dihapus."
        pending={state.pending === "stop"}
        error={state.error}
        confirmLabel="Hentikan dan hapus"
        pendingLabel="Menghentikan sesi..."
        className={landingTypography}
        onConfirm={() => {
          void state.mutate().then((success) => {
            if (success) setConfirm(false);
          });
        }}
      />
    </div>
  );
}
