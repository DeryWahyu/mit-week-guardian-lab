"use client";
import { useRef, ViewTransition } from "react";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import type { UserSession } from "@/lib/auth/session";
import { CtaBanner } from "./cta-banner";
import { JourneySection } from "./journey-section";
import styles from "./landing.module.css";
import { landingTypography } from "./landing-font";
import { LandingInvestigation } from "./landing-investigation";
import { LandingMotion } from "./landing-motion";
import { LandingScrollControls } from "./landing-scroll-controls";
import { PillarsSection } from "./pillars-section";
import { SocialProofSection } from "./social-proof-section";
import { useLandingReveal } from "./use-landing-reveal";
export interface LandingPageViewProps {
  initialUser?: UserSession | null;
}
export function LandingPageView({ initialUser }: LandingPageViewProps) {
  return (
    <LandingMotion>
      <LandingPageContent initialUser={initialUser} />
    </LandingMotion>
  );
}
function LandingPageContent({ initialUser }: LandingPageViewProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useLandingReveal(pageRef);
  return (
    <div ref={pageRef} className={styles.page}>
      <Header initialUser={initialUser} variant="landing" dialogClassName={landingTypography} />
      <ViewTransition default="none" enter="guardian-user-page" exit="guardian-user-page">
        <main data-user-transition>
          <LandingInvestigation initialUser={initialUser} />
          <PillarsSection />
          <JourneySection />
          <SocialProofSection />
          <CtaBanner />
        </main>
      </ViewTransition>
      <Footer variant="landing" />
      <LandingScrollControls pageRef={pageRef} />
    </div>
  );
}
