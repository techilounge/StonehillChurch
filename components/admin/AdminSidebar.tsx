"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

export const adminNavigation = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/homepage-slides", label: "Homepage Slides", icon: Images },
  { href: "/admin/sermons", label: "Sermons", icon: Mic2 },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/ministries", label: "Ministries", icon: Users },
  { href: "/admin/leaders", label: "Leaders", icon: Contact },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/forms", label: "Forms", icon: ClipboardList },
  { href: "/admin/media", label: "Media", icon: FolderOpen },
  { href: "/admin/youtube", label: "YouTube", icon: Youtube },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-72 md:flex-col md:border-r md:border-stonehill-line md:bg-white md:shadow-sm">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-stonehill-line bg-stonehill-evergreen text-white">
        <Link href="/admin/dashboard" className="text-xl font-bold tracking-tight">
          Stonehill CMS
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {adminNavigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-stonehill-evergreen/10 text-stonehill-evergreen"
                    : "text-stonehill-ink/70 hover:bg-stonehill-cream hover:text-stonehill-evergreen"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-stonehill-evergreen" : "text-stonehill-ink/50 group-hover:text-stonehill-evergreen"
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
