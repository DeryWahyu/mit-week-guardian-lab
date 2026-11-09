"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LandingLink } from "@/components/landing/landing-link";
import { LandingSectionLink } from "@/components/landing/landing-section-link";
import {
  isNavigationActive,
  LANDING_LOCATION_CHANGE_EVENT,
  LANDING_SECTION_CHANGE_EVENT,
} from "@/lib/navigation";
import { AUTH_ROUTES, LANDING_SECTIONS, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import landingStyles from "./landing-chrome.module.css";
import { NavigationLabel } from "./navigation-label";

export type HeaderVariant = "default" | "landing" | "information";

type Props = {
  signedIn: boolean;
  variant?: HeaderVariant;
  mobile?: boolean;
  onSelect?: () => void;
};

type NavigationLink = {
  label: string;
  href: string;
  landingHref?: string;
  requiresAuth?: boolean;
  sectionId?: string;
};

const sectionLinks: NavigationLink[] = [
  { label: "Beranda", href: `#${LANDING_SECTIONS.home}`, sectionId: LANDING_SECTIONS.home },
  { label: "Fitur", href: `#${LANDING_SECTIONS.features}`, sectionId: LANDING_SECTIONS.features },
  {
    label: "Cara Kerja",
    href: `#${LANDING_SECTIONS.journey}`,
    sectionId: LANDING_SECTIONS.journey,
  },
  {
    label: "Komunitas",
    href: `#${LANDING_SECTIONS.community}`,
    sectionId: LANDING_SECTIONS.community,
  },
  { label: "Mulai", href: `#${LANDING_SECTIONS.start}`, sectionId: LANDING_SECTIONS.start },
];

const informationLinks: NavigationLink[] = [
  { label: "Beranda", href: PUBLIC_ROUTES.home },
  { label: "Tentang Guardian Lab", href: PUBLIC_ROUTES.about },
  { label: "Kebijakan Privasi", href: PUBLIC_ROUTES.privacy },
  { label: "Ketentuan Penggunaan", href: PUBLIC_ROUTES.terms },
];

function subscribeSection(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(LANDING_LOCATION_CHANGE_EVENT, onChange);
  window.addEventListener(LANDING_SECTION_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(LANDING_LOCATION_CHANGE_EVENT, onChange);
    window.removeEventListener(LANDING_SECTION_CHANGE_EVENT, onChange);
  };
}
function getActiveSection() {
  const section = document.querySelector("[data-landing-active-section]");
  const active = section?.getAttribute("data-landing-active-section");
  if (active) return active;
  const hash = window.location.hash.slice(1);
  return sectionLinks.some((link) => link.sectionId === hash) ? hash : LANDING_SECTIONS.home;
}
function getServerSection() {
  return LANDING_SECTIONS.home;
}

export function HeaderNavigation({ signedIn, variant, mobile = false, onSelect }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();
  const activeSection = useSyncExternalStore(subscribeSection, getActiveSection, getServerSection);
  const landing = variant === "landing";
  const tab = search.get("tab");
  const activeTab = tab === "url" || tab === "qr" ? tab : undefined;
  const featureLinks: NavigationLink[] = [
    {
      label: "Beranda",
      href: PUBLIC_ROUTES.home,
      landingHref: PUBLIC_ROUTES.homeWithGateway(activeTab),
    },
    { label: "Ruang Uji", href: PUBLIC_ROUTES.sandboxWeb, requiresAuth: true },
    { label: "Bedah APK", href: PROTECTED_ROUTES.apk, requiresAuth: true },
    { label: "Bagikan Hasil", href: PUBLIC_ROUTES.act, requiresAuth: true },
    { label: "Belajar", href: PROTECTED_ROUTES.academy, requiresAuth: true },
    { label: "Komunitas", href: PROTECTED_ROUTES.community, requiresAuth: true },
    { label: "Riwayat", href: PROTECTED_ROUTES.history, requiresAuth: true },
  ];
  const links =
    variant === "information"
      ? informationLinks
      : landing && !signedIn
        ? sectionLinks
        : featureLinks;
  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        mobile ? "flex flex-col gap-1" : "hidden items-center gap-1 xl:flex",
        mobile ? landingStyles.mobileNavigation : landingStyles.navigation,
      )}
    >
      {links.map((link) => {
        const active = link.sectionId
          ? activeSection === link.sectionId
          : isNavigationActive(link.href, pathname, search);
        const href = landing && link.landingHref ? link.landingHref : link.href;
        const locked = !signedIn && link.requiresAuth;
        const className = cn(
          mobile
            ? "hover:bg-brand-50 hover:text-brand-600 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
            : "cursor-pointer rounded-full py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
          mobile
            ? active
              ? "text-brand-600"
              : "text-slate-700"
            : active
              ? "text-brand-600"
              : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
        );
        const content = (
          <>
            {link.label}
            {locked && <LockKeyhole aria-hidden="true" className="ml-1 inline size-3" />}
          </>
        );
        return link.sectionId ? (
          <LandingSectionLink
            key={link.label}
            sectionId={link.sectionId}
            onSelect={onSelect}
            aria-current={active ? "location" : undefined}
            className={className}
          >
            {content}
          </LandingSectionLink>
        ) : landing && link.landingHref ? (
          <LandingLink
            key={link.label}
            onSelect={onSelect}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            <NavigationLabel>{content}</NavigationLabel>
          </LandingLink>
        ) : (
          <Link
            key={link.label}
            href={locked ? AUTH_ROUTES.loginWithRedirect(href) : href}
            onClick={onSelect}
            aria-current={active ? "page" : undefined}
            title={locked ? "Masuk untuk membuka fitur ini" : undefined}
            className={className}
          >
            <NavigationLabel>{content}</NavigationLabel>
          </Link>
        );
      })}
    </nav>
  );
}
