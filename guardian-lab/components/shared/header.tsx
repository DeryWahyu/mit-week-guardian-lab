"use client";

import { Loader2, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import type { UserSession } from "@/lib/auth/session";
import { useSessionUser } from "@/lib/hooks/use-session-user";
import { ADMIN_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { BrandIdentity } from "./brand-identity";
import { HeaderNavigation, type HeaderVariant } from "./header-navigation";
import landingStyles from "./landing-chrome.module.css";
import { LogoutDialog } from "./logout-dialog";

export interface HeaderProps {
  initialUser?: UserSession | null;
  variant?: HeaderVariant;
  dialogClassName?: string;
}

export function Header({ initialUser, variant = "default", dialogClassName }: HeaderProps) {
  return (
    <Suspense>
      <HeaderContent
        initialUser={initialUser}
        variant={variant}
        dialogClassName={dialogClassName}
      />
    </Suspense>
  );
}
function HeaderContent({ initialUser, variant, dialogClassName }: HeaderProps) {
  const pathname = usePathname();
  const {
    user,
    isLoggingOut,
    requestLogout,
    confirmLogout,
    logoutOpen,
    changeLogoutOpen,
    logoutError,
  } = useSessionUser(initialUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const landing = variant === "landing";

  return (
    <header className={landingStyles.header} data-landing-header={landing ? "" : undefined}>
      <div className={landingStyles.headerInner}>
        {/* Brand Logo */}
        <Link
          href={PUBLIC_ROUTES.home}
          data-landing-home={landing ? "" : undefined}
          className="group focus-visible:ring-brand-600 inline-flex cursor-pointer items-center gap-2.5 rounded-xl p-1 focus-visible:ring-2 focus-visible:outline-none"
        >
          <BrandIdentity subtitle={null} markClassName="size-9" wordmarkClassName="text-[17px]" />
        </Link>

        <HeaderNavigation signedIn={Boolean(user)} variant={variant} />

        {/* Auth / Action Area */}
        <div className="hidden items-center gap-3 xl:flex">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Admin Badge */}
              {user.role === "ADMIN" && (
                <Link
                  href={ADMIN_ROUTES.dashboard}
                  className="bg-brand-100 text-brand-700 hover:bg-brand-200 cursor-pointer rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider uppercase transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* User Avatar Pill */}
              <Link
                href={PROTECTED_ROUTES.profile}
                className={landingStyles.accountLink}
                aria-label={`Buka profil ${user.name}`}
                aria-current={pathname === PROTECTED_ROUTES.profile ? "page" : undefined}
              >
                <div className="bg-brand-100 text-brand-700 flex size-6 items-center justify-center rounded-full text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate text-xs font-semibold text-slate-800">
                  {user.name}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={requestLogout}
                disabled={isLoggingOut}
                className="hover:bg-brand-50 hover:text-brand-600 cursor-pointer rounded-full p-2 text-slate-400 transition-colors"
                title="Keluar"
                aria-label="Keluar"
                aria-haspopup="dialog"
                aria-expanded={logoutOpen}
                aria-busy={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={AUTH_ROUTES.login} className={landingStyles.login}>
                Masuk
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="cursor-pointer rounded-xl p-2 text-slate-600 hover:bg-slate-100 xl:hidden"
          aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="space-y-3 border-t border-slate-200 bg-white/95 px-4 py-6 shadow-lg backdrop-blur-md xl:hidden"
        >
          <HeaderNavigation
            signedIn={Boolean(user)}
            variant={variant}
            mobile
            onSelect={() => setMobileMenuOpen(false)}
          />

          <div className="border-t border-slate-100 pt-4">
            {user ? (
              <div className="space-y-3">
                <div className={landingStyles.mobileAccount}>
                  <div className={landingStyles.mobileIdentity}>
                    <div className="bg-brand-100 text-brand-700 flex size-8 items-center justify-center rounded-full text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={landingStyles.mobileIdentityText}>
                      <span className="text-sm font-bold text-slate-800">{user.name}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <div className={landingStyles.mobileMetrics}>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                      🔥 {user.streakDays}d
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                      ⭐ {user.exp || 0}
                    </span>
                  </div>
                </div>
                <Link
                  href={PROTECTED_ROUTES.profile}
                  className={landingStyles.mobileProfile}
                  aria-current={pathname === PROTECTED_ROUTES.profile ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserRound size={18} aria-hidden="true" /> Profil saya
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href={ADMIN_ROUTES.dashboard}
                    className="bg-brand-50 text-brand-700 block rounded-xl px-4 py-2.5 text-sm font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dasbor admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={requestLogout}
                  disabled={isLoggingOut}
                  aria-haspopup="dialog"
                  aria-expanded={logoutOpen}
                  aria-busy={isLoggingOut}
                  className="hover:bg-brand-50 hover:text-brand-600 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <LogOut className="size-4" /> Keluar dari akun
                </button>
              </div>
            ) : (
              <Link
                href={AUTH_ROUTES.login}
                onClick={() => setMobileMenuOpen(false)}
                className={landingStyles.mobileLogin}
              >
                Masuk ke Akun
              </Link>
            )}
          </div>
        </div>
      )}
      {landing && (
        <div
          data-landing-progress
          className={landingStyles.scrollProgress}
          role="progressbar"
          aria-label="Progres membaca halaman"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span />
        </div>
      )}
      <LogoutDialog
        className={dialogClassName}
        open={logoutOpen}
        onOpenChange={changeLogoutOpen}
        pending={isLoggingOut}
        error={logoutError}
        onConfirm={() => void confirmLogout()}
      />
    </header>
  );
}
