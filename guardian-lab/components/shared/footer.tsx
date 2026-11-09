import Link from "next/link";
import { LandingLink } from "@/components/landing/landing-link";
import { LandingSectionLink } from "@/components/landing/landing-section-link";
import { ADMIN_ROUTES, LANDING_SECTIONS, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BrandIdentity } from "./brand-identity";
import landingStyles from "./landing-chrome.module.css";

export function Footer({ variant = "default" }: { variant?: "default" | "landing" }) {
  const landing = variant === "landing";
  return (
    <footer
      className={cn(
        landingStyles.footerSurface,
        landing
          ? landingStyles.footer
          : "w-full border-t border-slate-200/80 text-slate-600 transition-colors",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Column 1: Brand & Mission (Spans 2 columns on lg) */}
          <div className="space-y-4 lg:col-span-2">
            {landing ? (
              <LandingSectionLink
                sectionId={LANDING_SECTIONS.home}
                className="group inline-flex cursor-pointer items-center gap-2.5"
              >
                <BrandIdentity markClassName="size-9" />
              </LandingSectionLink>
            ) : (
              <Link
                href={PUBLIC_ROUTES.home}
                className="group inline-flex cursor-pointer items-center gap-2.5"
              >
                <BrandIdentity markClassName="size-9" />
              </Link>
            )}

            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Platform Sandbox Anti-Phishing & Bedah APK yang mengintegrasikan tiga pilar:{" "}
              <strong className="font-semibold text-slate-800">Recognize</strong>,{" "}
              <strong className="font-semibold text-slate-800">Protect</strong>, dan{" "}
              <strong className="font-semibold text-slate-800">Act</strong>. Melindungi pengguna
              dari jebakan cybercrime tanpa kompromi data pribadi.
            </p>
          </div>

          {/* Column 2: Fitur Utama */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              Fitur Utama
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                {landing ? (
                  <LandingLink
                    tab="url"
                    className="hover:text-brand-600 cursor-pointer transition-colors"
                  >
                    Gateway Deteksi URL
                  </LandingLink>
                ) : (
                  <Link
                    href={PUBLIC_ROUTES.home}
                    className="hover:text-brand-600 cursor-pointer transition-colors"
                  >
                    Gateway Deteksi URL
                  </Link>
                )}
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTES.sandboxWeb}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Browser Web Sandbox
                </Link>
              </li>
              <li>
                <Link
                  href={PROTECTED_ROUTES.apk}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  APK X-Ray Engine
                </Link>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTES.act}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Guardian Share Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Edukasi & Komunitas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              Edukasi & Gamifikasi
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={PROTECTED_ROUTES.academy}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Guardian Academy
                </Link>
              </li>
              <li>
                <Link
                  href={PROTECTED_ROUTES.community}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Community Forensic Replay
                </Link>
              </li>
              <li>
                <Link
                  href={PROTECTED_ROUTES.history}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Riwayat Investigasi
                </Link>
              </li>
              <li>
                <Link
                  href={ADMIN_ROUTES.dashboard}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Dashboard Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Informasi publik */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-900 uppercase">Informasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={PUBLIC_ROUTES.about}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Tentang Guardian Lab
                </Link>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTES.privacy}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href={PUBLIC_ROUTES.terms}
                  className="hover:text-brand-600 cursor-pointer transition-colors"
                >
                  Ketentuan Penggunaan
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
