import { ADMIN_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl } from "@/lib/validations/auth";

/** Explicit APK/profile requests retain their destination; other paths use the role default. */
export function getPostLoginRedirect(role: "USER" | "ADMIN", requested?: string | null): string {
  const safeTarget = getSafeRedirectUrl(requested, PUBLIC_ROUTES.home);
  const destination = new URL(safeTarget, "https://guardian.invalid");
  if (
    destination.pathname === PROTECTED_ROUTES.apk ||
    destination.pathname === PROTECTED_ROUTES.profile
  )
    return safeTarget;
  if (role === "ADMIN") return ADMIN_ROUTES.dashboard;
  return destination.pathname === PUBLIC_ROUTES.home ? safeTarget : PUBLIC_ROUTES.home;
}
