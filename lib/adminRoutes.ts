export const ADMIN_ROUTE_PREFIX = "/admin";
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_INVITE_PATH = "/admin/invite";
export const ADMIN_DEFAULT_PATH = "/admin/dashboard";
export const ADMIN_SESSION_COOKIE_NAME = "__stonehill_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH || pathname.startsWith(`${ADMIN_LOGIN_PATH}/`);
}

export function isAdminInvitePath(pathname: string): boolean {
  return pathname === ADMIN_INVITE_PATH || pathname.startsWith(`${ADMIN_INVITE_PATH}/`);
}

// Admin paths reachable without an authenticated session (login + invite acceptance).
export function isAdminPublicPath(pathname: string): boolean {
  return isAdminLoginPath(pathname) || isAdminInvitePath(pathname);
}

export function safeAdminReturnTo(value: unknown): string {
  if (typeof value !== "string") {
    return ADMIN_DEFAULT_PATH;
  }

  const returnTo = value.trim();

  if (!returnTo || returnTo.startsWith("//") || returnTo.includes("://")) {
    return ADMIN_DEFAULT_PATH;
  }

  if (returnTo !== ADMIN_ROUTE_PREFIX && !returnTo.startsWith(`${ADMIN_ROUTE_PREFIX}/`)) {
    return ADMIN_DEFAULT_PATH;
  }

  const pathname = returnTo.split("?")[0] ?? returnTo;

  if (isAdminLoginPath(pathname)) {
    return ADMIN_DEFAULT_PATH;
  }

  return returnTo;
}

export function adminLoginRedirectPath(returnTo: string, reason?: string): string {
  const params = new URLSearchParams({ returnTo: safeAdminReturnTo(returnTo) });

  if (reason) {
    params.set("reason", reason.toLowerCase());
  }

  return `${ADMIN_LOGIN_PATH}?${params.toString()}`;
}
