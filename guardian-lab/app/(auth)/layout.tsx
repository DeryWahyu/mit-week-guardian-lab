import type { Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { BrandIdentity } from "@/components/shared/brand-identity";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AuthArtwork } from "./_components/auth-artwork";
import styles from "./auth.module.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn(landingTypography, styles.shell)}>
      <div className={styles.formColumn}>
        <div className={styles.formStack}>
          <header className={styles.brand}>
            <Link href={PUBLIC_ROUTES.home} aria-label="Guardian Lab, beranda">
              <BrandIdentity subtitle={null} markClassName="size-12" wordmarkClassName="text-2xl" />
            </Link>
          </header>
          <main>{children}</main>
        </div>
      </div>
      <AuthArtwork />
    </div>
  );
}
