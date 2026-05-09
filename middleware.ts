import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const adminRoutePrefix = "/admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(adminRoutePrefix)) {
    // Placeholder boundary for Phase 3 Firebase Auth session protection.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
