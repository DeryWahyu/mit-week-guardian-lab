import { type NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import {
  ADMIN_ROUTES,
  API_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
} from "@/lib/routes";

const SESSION_COOKIE_NAME = "guardian_session";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  const isAuthenticated = Boolean(session?.userId);
  const isAdmin = session?.role === "ADMIN";

  // 1. Protect Admin API routes: /api/admin/*
  const adminApiPrefix = API_ROUTES.adminQuizzes.slice(0, API_ROUTES.adminQuizzes.lastIndexOf("/"));
  if (pathname === adminApiPrefix || pathname.startsWith(`${adminApiPrefix}/`)) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Otentikasi diperlukan" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Hak akses administrator diperlukan" },
        { status: 403 },
      );
    }

    return NextResponse.next();
  }

  // 2. Protect Admin Web routes: /admin/*
  if (pathname === ADMIN_ROUTES.dashboard || pathname.startsWith(`${ADMIN_ROUTES.dashboard}/`)) {
    if (!isAuthenticated) {
      const loginUrl = new URL(AUTH_ROUTES.login, request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL(PUBLIC_ROUTES.home, request.url));
    }

    return NextResponse.next();
  }

  // Proxy is an optimistic check; pages and API handlers verify the database session.
  if (
    [
      PROTECTED_ROUTES.history,
      PROTECTED_ROUTES.profile,
      PROTECTED_ROUTES.apk,
      PROTECTED_ROUTES.academy,
      PROTECTED_ROUTES.community,
      PUBLIC_ROUTES.sandboxWeb,
      PUBLIC_ROUTES.sandboxAndroid,
      PUBLIC_ROUTES.act,
    ].some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    if (!isAuthenticated) {
      const loginUrl = new URL(AUTH_ROUTES.login, request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Auth pages check the database themselves so a revoked cookie never prevents a new login.

  // All other routes are public
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/apk/:path*",
    "/academy/:path*",
    "/community/:path*",
    "/sandbox/:path*",
    "/act",
  ],
};
