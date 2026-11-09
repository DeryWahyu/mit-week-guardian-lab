"use client";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { createContext, type ReactNode, useContext } from "react";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion-preference";

const ReducedMotionContext = createContext(true);
export function useLandingReducedMotion() {
  return useContext(ReducedMotionContext);
}

export function LandingMotion({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotionPreference();
  return (
    <ReducedMotionContext value={reducedMotion}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </MotionConfig>
      </LazyMotion>
    </ReducedMotionContext>
  );
}

export function SceneReveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} data-landing-reveal>
      {children}
    </div>
  );
}
