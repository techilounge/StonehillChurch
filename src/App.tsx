import { useEffect, useMemo, useState } from "react";

import { AdminAuthProvider, useAdminAuth } from "./auth/AdminAuthContext";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLayout } from "./components/AdminLayout";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { CmsContentManager } from "./components/CmsContentManager";
import { MediaLibrary } from "./components/MediaLibrary";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function navigate(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new Event("popstate"));
}

function usePathname() {
  const [pathname, setPathname] = useState(currentPath);

  useEffect(() => {
    const handlePathChange = () => setPathname(currentPath());

    window.addEventListener("popstate", handlePathChange);
    return () => window.removeEventListener("popstate", handlePathChange);
  }, []);

  return pathname;
}

function AdminRouter() {
  const pathname = usePathname();
  const { canAccessAdmin, loading } = useAdminAuth();

  useEffect(() => {
    if (pathname === "/") {
      navigate("/admin");
    }

    if (!loading && canAccessAdmin && pathname === "/admin/login") {
      navigate("/admin");
    }
  }, [canAccessAdmin, loading, pathname]);

  const isLoginRoute = pathname === "/admin/login";
  const isAdminRoute = useMemo(
    () => pathname === "/admin" || pathname.startsWith("/admin/"),
    [pathname],
  );

  if (isLoginRoute) {
    return <AdminLoginPage />;
  }

  if (!isAdminRoute) {
    navigate("/admin");
    return null;
  }

  const contentModuleKey = pathname.split("/")[3];
  const adminContent = (() => {
    if (pathname.startsWith("/admin/media")) {
      return <MediaLibrary openUploadByDefault={pathname === "/admin/media/upload"} />;
    }

    if (pathname.startsWith("/admin/content")) {
      return <CmsContentManager moduleKey={contentModuleKey} />;
    }

    if (pathname === "/admin/site-settings") {
      return <CmsContentManager moduleKey="site-settings" />;
    }

    if (pathname === "/admin/youtube-settings") {
      return <CmsContentManager moduleKey="youtube-settings" />;
    }

    return <AdminDashboard />;
  })();

  return (
    <ProtectedAdminRoute>
      <AdminLayout activePath={pathname}>{adminContent}</AdminLayout>
    </ProtectedAdminRoute>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <div className="app-shell">
        <AdminRouter />
      </div>
    </AdminAuthProvider>
  );
}
