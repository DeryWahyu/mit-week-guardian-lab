"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { LANDING_LOCATION_CHANGE_EVENT } from "@/lib/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";

type Props = {
  children: ReactNode;
  className?: string;
  tab?: "url" | "qr";
  onSelect?: () => void;
  "aria-current"?: "page";
};

function GatewayLink({ children, className, tab, onSelect, ...accessibility }: Props) {
  const params = useSearchParams();
  const current = params.get("tab");
  const active = current === "url" || current === "qr" ? current : undefined;
  const href = PUBLIC_ROUTES.homeWithGateway(tab ?? active);
  return (
    <Link
      href={href}
      className={className}
      {...accessibility}
      onNavigate={(event) => {
        onSelect?.();
        const section = document.getElementById("periksa");
        if (!section) return;
        event.preventDefault();
        if (
          `${window.location.pathname}${window.location.search}${window.location.hash}` !== href
        ) {
          window.history.pushState(null, "", href);
          window.dispatchEvent(new Event(LANDING_LOCATION_CHANGE_EVENT));
        }
        requestAnimationFrame(() => {
          if (!section.isConnected) return;
          section.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "start",
          });
          section.focus({ preventScroll: true });
        });
      }}
    >
      {children}
    </Link>
  );
}

export function LandingLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link
          href={PUBLIC_ROUTES.homeWithGateway(props.tab)}
          className={props.className}
          aria-current={props["aria-current"]}
          onClick={props.onSelect}
        >
          {props.children}
        </Link>
      }
    >
      <GatewayLink {...props} />
    </Suspense>
  );
}
