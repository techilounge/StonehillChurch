import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  isAdminPath,
  ADMIN_SESSION_COOKIE_NAME,
  isAdminPublicPath,
} from "@/lib/adminRoutes";

const SHARED_CSP_DIRECTIVES = [
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https://*.googleusercontent.com https://i.ytimg.com https://images.unsplash.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://www.gstatic.com`,
  `frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.recaptcha.net https://maps.google.com https://www.google.com`,
  `connect-src 'self' https://*.googleapis.com https://www.recaptcha.net https://recaptchaenterprise.googleapis.com https://api.resend.com wss://*.firebaseio.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
];

// The public marketing site is ISR-cached (see revalidate settings in
// app/(public)/layout.tsx and app/(public)/page.tsx); those pages never read
// headers() or cookies(), so this CSP stays a static string shared across
// cached responses. All public-site rich-text/HTML CMS fields are sanitized
// server-side (see lib/pageBuilderSafety.ts) before they ever reach the DOM,
// so 'unsafe-inline' here is a secondary layer, not the primary XSS defense.
const PUBLIC_CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://www.google.com https://www.recaptcha.net https://www.gstatic.com https://apis.google.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  ...SHARED_CSP_DIRECTIVES,
].join("; ");

// The admin console is already force-dynamic end-to-end (app/admin/layout.tsx
// reads headers() on every request), so a per-request nonce costs nothing
// extra here and lets us drop 'unsafe-inline' where privileged sessions live.
// Next.js reads the `x-nonce` request header and the `nonce-` token in this
// response header to auto-apply matching nonces to the inline
// bootstrap/hydration scripts it injects — see Next's CSP guide.
function buildAdminCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.google.com https://www.recaptcha.net https://www.gstatic.com https://apis.google.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    ...SHARED_CSP_DIRECTIVES,
  ].join("; ");
}

function nextWithAdminPath(request: NextRequest, nonce: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-stonehill-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-stonehill-search", request.nextUrl.search);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", buildAdminCsp(nonce));
  return response;
}

// This middleware is a fast-path filter only — it cannot run the Firebase
// Admin SDK on the Edge, so it does NOT cryptographically verify the session
// cookie. It only checks for the cookie's presence and redirects to the login
// page when missing. Real verification (verifySessionCookie + revocation
// check) happens inside `app/admin/layout.tsx` via `getCurrentAdminSession`.
// Forged or expired cookies are caught there.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", PUBLIC_CSP);
    return response;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  if (isAdminPublicPath(pathname)) {
    return nextWithAdminPath(request, nonce);
  }

  const hasSessionCookie = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Content-Security-Policy", buildAdminCsp(nonce));
    return response;
  }

  return nextWithAdminPath(request, nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
