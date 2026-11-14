import "server-only";

import { getAppCheck } from "firebase-admin/app-check";
import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";

/**
 * Firebase App Check verification for first-party API routes.
 *
 * Routes that write through the Admin SDK bypass Firestore rules, so the
 * App Check requirement in those rules does not protect them. Browsers send
 * `X-Firebase-AppCheck` (see getAppCheckHeaders in lib/firebaseClient.ts) and
 * the route verifies it here.
 *
 * Rollout is controlled by APPCHECK_FORMS_MODE:
 * - "monitor" (default): verify and log failures, but never block.
 * - "enforce": reject requests whose token is missing or invalid.
 * - "off": skip verification (local development without App Check).
 */

export type AppCheckMode = "off" | "monitor" | "enforce";
export type AppCheckStatus = "valid" | "missing" | "invalid" | "skipped";

export const APP_CHECK_HEADER = "x-firebase-appcheck";

export function resolveAppCheckMode(value: string | undefined): AppCheckMode {
  const normalized = value?.trim().toLowerCase();
  return normalized === "off" || normalized === "enforce" ? normalized : "monitor";
}

export type AppCheckVerifier = (token: string) => Promise<unknown>;

const defaultVerifier: AppCheckVerifier = (token) =>
  getAppCheck(getFirebaseAdminApp()).verifyToken(token);

export async function checkAppCheckToken(
  headers: Headers,
  {
    mode = resolveAppCheckMode(process.env.APPCHECK_FORMS_MODE),
    verify = defaultVerifier,
    context = "api",
  }: { mode?: AppCheckMode; verify?: AppCheckVerifier; context?: string } = {},
): Promise<{ allowed: boolean; status: AppCheckStatus }> {
  if (mode === "off") return { allowed: true, status: "skipped" };

  const token = headers.get(APP_CHECK_HEADER)?.trim();
  let status: AppCheckStatus;

  if (!token) {
    status = "missing";
  } else {
    try {
      await verify(token);
      status = "valid";
    } catch {
      status = "invalid";
    }
  }

  if (status === "valid") return { allowed: true, status };

  if (mode === "monitor") {
    console.warn(`[appCheck] ${context}: ${status} token (monitor mode, request allowed).`);
    return { allowed: true, status };
  }

  console.warn(`[appCheck] ${context}: ${status} token, request rejected.`);
  return { allowed: false, status };
}
