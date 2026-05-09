import { type ReactNode, useEffect } from "react";

import { useAdminAuth } from "../auth/AdminAuthContext";
import { UnauthorizedScreen } from "./UnauthorizedScreen";

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { canAccessAdmin, error, firebaseUser, loading, logout } = useAdminAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      window.history.replaceState(null, "", "/admin/login");
      window.dispatchEvent(new Event("popstate"));
    }
  }, [firebaseUser, loading]);

  if (loading) {
    return <main className="center-screen">Loading admin session...</main>;
  }

  if (!firebaseUser) {
    return null;
  }

  if (!canAccessAdmin) {
    return <UnauthorizedScreen message={error} onLogout={logout} />;
  }

  return <>{children}</>;
}
