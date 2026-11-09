"use client";

import { type ReactNode, useRef } from "react";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion-preference";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

export function WorkspaceMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotionPreference();
  useScrollReveal(rootRef, {
    selector: "[data-user-reveal]",
    revealedAttribute: "data-user-revealed",
    reducedMotion,
    observeChanges: true,
  });
  return (
    <main ref={rootRef} className={className} data-user-transition>
      {children}
    </main>
  );
}
