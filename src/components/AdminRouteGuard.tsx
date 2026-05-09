import type { ReactNode } from "react";

import { type PermissionSubject, canAccessAdmin } from "../../lib/permissions";

type AdminRouteGuardProps = {
  subject: PermissionSubject | null | undefined;
  children: ReactNode;
  loading?: boolean;
  loadingFallback?: ReactNode;
  deniedFallback?: ReactNode;
};

export function AdminRouteGuard({
  subject,
  children,
  loading = false,
  loadingFallback = null,
  deniedFallback = null,
}: AdminRouteGuardProps) {
  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!canAccessAdmin(subject)) {
    return <>{deniedFallback}</>;
  }

  return <>{children}</>;
}

export default AdminRouteGuard;
