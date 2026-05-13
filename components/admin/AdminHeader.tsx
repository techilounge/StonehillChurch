"use client";

import { usePathname } from "next/navigation";
import { User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { session, signingOut, signOutAdmin } = useAdminAuth();
  
  // Basic breadcrumb logic based on pathname
  const segments = pathname?.split("/").filter(Boolean) || [];
  const currentPage = segments[segments.length - 1] || "Dashboard";
  const formattedPage = currentPage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-stonehill-line bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-stonehill-ink/70 hover:text-stonehill-evergreen md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-stonehill-line md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center font-medium text-stonehill-ink">
          {formattedPage}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-stonehill-line" aria-hidden="true" />

          {/* Profile dropdown / Profile placeholder */}
          <div className="flex items-center gap-x-4">
            <span className="hidden text-sm font-medium leading-6 text-stonehill-ink/80 lg:block">
              {session.email ?? session.role}
            </span>
            <div className="h-8 w-8 rounded-full bg-stonehill-evergreen/10 flex items-center justify-center text-stonehill-evergreen">
              <User className="h-5 w-5" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-stonehill-ink/70 hover:text-red-600"
              title="Sign out"
              onClick={signOutAdmin}
              disabled={signingOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
