"use client";

import type { MouseEvent, ReactNode } from "react";
import { LANDING_LOCATION_CHANGE_EVENT } from "@/lib/navigation";

type Props = {
  sectionId: string;
  children: ReactNode;
  className?: string;
  onSelect?: () => void;
  "aria-current"?: "location";
};

export function LandingSectionLink({
  sectionId,
  children,
  className,
  onSelect,
  ...accessibility
}: Props) {
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const section = document.getElementById(sectionId);
    if (!section) return;
    event.preventDefault();
    onSelect?.();
    const target = `#${sectionId}`;
    if (window.location.hash !== target) {
      window.history.pushState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${target}`,
      );
    }
    window.dispatchEvent(new Event(LANDING_LOCATION_CHANGE_EVENT));
    requestAnimationFrame(() => {
      if (!section.isConnected) return;
      section.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      section.focus({ preventScroll: true });
    });
  }
  return (
    <a href={`#${sectionId}`} className={className} onClick={navigate} {...accessibility}>
      {children}
    </a>
  );
}
