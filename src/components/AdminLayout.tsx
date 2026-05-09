import { type ReactNode } from "react";

import {
  canCreateContent,
  canManageSettings,
  canManageUsers,
  canPublishContent,
  hasPermission,
} from "../../lib/permissions";
import { useAdminAuth } from "../auth/AdminAuthContext";

function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("popstate"));
}

type AdminLayoutProps = {
  activePath: string;
  children: ReactNode;
};

export function AdminLayout({ activePath, children }: AdminLayoutProps) {
  const { logout, profile } = useAdminAuth();

  if (!profile) {
    return null;
  }

  const linkClass = (path: string) => {
    const active =
      path === "/admin"
        ? activePath === "/admin"
        : activePath === path || activePath.startsWith(`${path}/`);

    return `nav-link ${active ? "active" : ""}`;
  };

  return (
    <div className="admin-frame">
      <aside className="sidebar">
        <strong>Stonehill CMS</strong>
        <nav aria-label="Admin navigation">
          <a className={linkClass("/admin")} href="/admin" onClick={(event) => {
            event.preventDefault();
            navigate("/admin");
          }}>
            Dashboard
          </a>

          {(canCreateContent(profile) || canPublishContent(profile)) && (
            <a className={linkClass("/admin/content")} href="/admin/content" onClick={(event) => {
              event.preventDefault();
              navigate("/admin/content");
            }}>
              Content
            </a>
          )}

          <a className={linkClass("/admin/media")} href="/admin/media" onClick={(event) => {
            event.preventDefault();
            navigate("/admin/media");
          }}>
            Media
          </a>

          {canManageUsers(profile) && (
            <a className={linkClass("/admin/users")} href="/admin/users" onClick={(event) => {
              event.preventDefault();
              navigate("/admin/users");
            }}>
              Users
            </a>
          )}

          {canManageSettings(profile) && (
            <a className={linkClass("/admin/site-settings")} href="/admin/site-settings" onClick={(event) => {
              event.preventDefault();
              navigate("/admin/site-settings");
            }}>
              Site Settings
            </a>
          )}

          {hasPermission(profile, "youtube:manage") && (
            <a className={linkClass("/admin/youtube-settings")} href="/admin/youtube-settings" onClick={(event) => {
              event.preventDefault();
              navigate("/admin/youtube-settings");
            }}>
              YouTube
            </a>
          )}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <strong>{profile.displayName}</strong>
            <div className="muted">{profile.email} · {profile.role}</div>
          </div>

          <button className="button secondary" onClick={logout} type="button">
            Sign Out
          </button>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
