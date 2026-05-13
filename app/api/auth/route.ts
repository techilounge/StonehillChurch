import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import {
  getAdminSessionFromIdToken,
  requireAdminSessionForRequest,
} from "@/lib/api/adminSession";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/adminRoutes";

type AuthErrorCode =
  | "INVALID_JSON"
  | "INVALID_TOKEN"
  | "UNAUTHENTICATED"
  | "EMAIL_UNVERIFIED"
  | "UNAPPROVED"
  | "FORBIDDEN"
  | "SESSION_FAILED";

function jsonError(code: AuthErrorCode, message: string, status: 400 | 401 | 403 | 500) {
  return NextResponse.json({
    ok: false,
    error: { code, message },
  }, { status });
}

function setExpiredAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "admin:access");

  if (!authResult.ok) {
    return jsonError(authResult.reason, authResult.message, authResult.status);
  }

  return NextResponse.json({
    ok: true,
    data: { session: authResult.session },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const idToken =
    body && typeof body === "object" && typeof (body as { idToken?: unknown }).idToken === "string"
      ? (body as { idToken: string }).idToken
      : "";

  if (!idToken) {
    return jsonError("INVALID_TOKEN", "A Firebase ID token is required.", 401);
  }

  const authResult = await getAdminSessionFromIdToken(idToken, "admin:access");

  if (!authResult.ok) {
    return jsonError(authResult.reason, authResult.message, authResult.status);
  }

  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    });
    const response = NextResponse.json({
      ok: true,
      data: { session: authResult.session },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[auth] Failed to create admin session cookie.", error);
    return jsonError("SESSION_FAILED", "Could not create an admin session.", 500);
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    data: { signedOut: true },
  });

  setExpiredAdminCookie(response);
  return response;
}
