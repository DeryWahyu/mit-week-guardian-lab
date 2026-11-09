"use client";
import {
  Activity,
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { BrandIdentity } from "@/components/shared/brand-identity";
import { LogoutDialog } from "@/components/shared/logout-dialog";
import type { UserSession } from "@/lib/auth/session";
import { useSessionUser } from "@/lib/hooks/use-session-user";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import styles from "./admin.module.css";

const navigation = [
  { label: "Dashboard", href: ADMIN_ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Pengguna", href: ADMIN_ROUTES.users, icon: Users },
  { label: "Investigasi", href: ADMIN_ROUTES.investigations, icon: FileSearch },
  { label: "Moderasi kasus", href: ADMIN_ROUTES.communityReviews, icon: ClipboardCheck },
  { label: "Academy", href: ADMIN_ROUTES.quizzes, icon: BookOpen },
  { label: "Monitor layanan", href: ADMIN_ROUTES.monitor, icon: Activity },
  { label: "Log aktivitas", href: ADMIN_ROUTES.audit, icon: ScrollText },
  { label: "Laporan", href: ADMIN_ROUTES.reports, icon: ChartColumn },
];
export function AdminShell({ user, children }: { user: UserSession; children: ReactNode }) {
  const pathname = usePathname();
  const { isLoggingOut, requestLogout, confirmLogout, logoutOpen, changeLogoutOpen, logoutError } =
    useSessionUser(user);
  return (
    <div className={cn(landingTypography, styles.shell)}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href={ADMIN_ROUTES.dashboard}>
          <BrandIdentity subtitle="Ruang administrator" markClassName="size-9" />
        </Link>
        <p className={styles.navCaption}>Kelola Guardian Lab</p>
        <nav aria-label="Navigasi admin" className={styles.nav}>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== ADMIN_ROUTES.dashboard && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarNote}>
          <span>Guardian Lab</span>
          <p>Kelola akses, jaga kualitas bukti, dan dukung perjalanan belajar.</p>
        </div>
      </aside>
      <div className={styles.body}>
        <header className={styles.topbar}>
          <Link href={PUBLIC_ROUTES.home} className={styles.publicLink}>
            <ExternalLink size={16} aria-hidden="true" />
            Halaman pengguna
          </Link>
          <div className={styles.profile}>
            <span className={styles.profileAvatar} aria-hidden="true">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <span>Administrator</span>
            </div>
            <button
              type="button"
              className={styles.secondary}
              onClick={requestLogout}
              disabled={isLoggingOut}
              aria-haspopup="dialog"
              aria-expanded={logoutOpen}
            >
              <LogOut size={16} aria-hidden="true" />
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={changeLogoutOpen}
        pending={isLoggingOut}
        error={logoutError}
        onConfirm={() => void confirmLogout()}
        className={landingTypography}
      />
    </div>
  );
}
