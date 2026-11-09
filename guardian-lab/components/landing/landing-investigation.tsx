"use client";

import { Suspense, useState } from "react";
import type { UserSession } from "@/lib/auth/session";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { Investigation } from "@/lib/validations/investigation";
import { AnalysisGateway } from "./analysis-gateway";
import { HeroSection } from "./hero";
import { LandingResults } from "./landing-results";

type Props = { initialUser?: UserSession | null };

export function LandingInvestigation({ initialUser }: Props) {
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  function clearResult() {
    setActiveInvestigationId(null);
    setAnalysisError(null);
    const next = new URLSearchParams(window.location.search);
    if (!next.has("investigation")) return;
    next.delete("investigation");
    window.history.replaceState(
      null,
      "",
      `${PUBLIC_ROUTES.home}${next.size ? `?${next}` : ""}${window.location.hash}`,
    );
  }
  function start() {
    clearResult();
    setIsAnalyzing(true);
  }
  function success(record: Investigation) {
    setIsAnalyzing(false);
    setAnalysisError(null);
    setActiveInvestigationId(record.id);
    const next = new URLSearchParams(window.location.search);
    next.delete("target");
    next.delete("file");
    next.delete("evidence");
    next.set("investigation", record.id);
    next.set("tab", record.type.toLowerCase());
    window.history.pushState(null, "", `${PUBLIC_ROUTES.home}?${next}`);
  }
  function failure(message: string) {
    setIsAnalyzing(false);
    setAnalysisError(message);
  }
  return (
    <>
      <HeroSection>
        <AnalysisGateway
          currentUser={initialUser}
          onAnalysisStart={start}
          onAnalysisSuccess={success}
          onAnalysisError={failure}
          onInputChange={clearResult}
        />
      </HeroSection>
      <Suspense fallback={null}>
        <LandingResults
          initialUser={initialUser}
          isAnalyzing={isAnalyzing}
          error={analysisError}
          activeId={activeInvestigationId}
          onClose={clearResult}
        />
      </Suspense>
    </>
  );
}
