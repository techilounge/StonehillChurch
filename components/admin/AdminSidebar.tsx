"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hasPermission,
  type AdminPermission,
  type PermissionSubject,
} from "@/lib/permissions";
import {
  LayoutDashboard,
  Images,
  Mic2,
  CalendarDays,
  Users,
  Contact,
  Megaphone,
  BookOpen,
  ClipboardList,
  FolderOpen,
  Settings,
  UsersRound,
  Youtube,
  FileText,
  Sparkles,
  Menu,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermission?: AdminPermission;
};

export const adminNavigation: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/homepage-slides", label: "Homepage Slides", icon: Images },
  { href: "/admin/sermons", label: "Sermons", icon: Mic2 },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/ministries", label: "Ministries", icon: Users },
  { href: "/admin/leaders", label: "Leaders", icon: Contact },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/pages", label: "Pages", icon: FileText, requiredPermission: "settings:manage" },
  { href: "/admin/popups", label: "Popups", icon: Sparkles },
  { href: "/admin/menus", label: "Menus", icon: Menu, requiredPermission: "settings:manage" },
  { href: "/admin/forms", label: "Forms", icon: ClipboardList, requiredPermission: "forms:manage" },
  { href: "/admin/media", label: "Media", icon: FolderOpen },
  { href: "/admin/youtube", label: "YouTube", icon: Youtube, requiredPermission: "youtube:manage" },
  { href: "/admin/users", label: "Users", icon: UsersRound, requiredPermission: "users:manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, requiredPermission: "settings:manage" },
];

export function filterAdminNavigation(
  subject: PermissionSubject | null | undefined,
  items: readonly AdminNavItem[] = adminNavigation,
): AdminNavItem[] {
  return items.filter(
    (item) => !item.requiredPermission || hasPermission(subject, item.requiredPermission),
  );
}

export function AdminSidebar({ session }: { session: PermissionSubject }) {
  const pathname = usePathname();
  const visibleNavigation = filterAdminNavigation(session);

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-72 md:flex-col md:border-r md:border-slate-200 md:bg-white md:shadow-sm">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200 bg-stonehill-primary text-white">
        <Link href="/admin/dashboard" className="text-xl font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 rounded-sm">
          Stonehill CMS
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {visibleNavigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2",
                  isActive
                    ? "bg-stonehill-primary/10 text-stonehill-primary"
                    : "text-slate-900/70 hover:bg-slate-50 hover:text-stonehill-primary"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-stonehill-primary" : "text-slate-900/50 group-hover:text-stonehill-primary"
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
