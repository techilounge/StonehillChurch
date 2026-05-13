import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_ROUTE_PREFIX,
  ADMIN_SESSION_COOKIE_NAME,
  isAdminPublicPath,
} from "@/lib/adminRoutes";

function nextWithAdminPath(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-stonehill-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-stonehill-search", request.nextUrl.search);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// This middleware is a fast-path filter only — it cannot run the Firebase
// Admin SDK on the Edge, so it does NOT cryptographically verify the session
// cookie. It only checks for the cookie's presence and redirects to the login
// page when missing. Real verification (verifySessionCookie + revocation
// check) happens inside `app/admin/layout.tsx` via `getCurrentAdminSession`.
// Forged or expired cookies are caught there.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  if (isAdminPublicPath(pathname)) {
    return nextWithAdminPath(request);
  }

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithAdminPath(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
