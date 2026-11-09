"use client";

import type { RefObject } from "react";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";
import { useLandingReducedMotion } from "./landing-motion";

export function useLandingReveal(pageRef: RefObject<HTMLDivElement | null>) {
  const reducedMotion = useLandingReducedMotion();
  useScrollReveal(pageRef, {
    selector: "[data-landing-reveal]",
    revealedAttribute: "data-landing-revealed",
    reducedMotion,
  });
}
