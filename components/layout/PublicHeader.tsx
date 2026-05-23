import Link from "next/link";
import Image from "next/image";
import { DesktopNav, type NavItem } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menus";
import { DEFAULT_HEADER_MENU } from "@/lib/constants/defaultMenus";

/** Convert a MenuItem (from Firestore) to a NavItem (used by DesktopNav/MobileNav). */
function menuItemToNavItem(item: MenuItem): NavItem {
  return {
    href: item.url,
    label: item.label,
    openInNewTab: item.openInNewTab || undefined,
    subItems: item.children.length > 0
      ? item.children.map(menuItemToNavItem)
      : undefined,
  };
}

/** Hardcoded fallback used when no dynamic menu data is available. */
const defaultNavigation: NavItem[] = DEFAULT_HEADER_MENU.map(menuItemToNavItem);

export interface PublicHeaderProps {
  settings?: Record<string, any>;
  headerMenu?: MenuItem[];
}

export function PublicHeader({ settings, headerMenu }: PublicHeaderProps) {
  const logoUrl = typeof settings?.["general.logo_url"] === "string" ? settings["general.logo_url"] : null;
  const churchName = typeof settings?.["general.churchName"] === "string" ? settings["general.churchName"] : "Stonehill SDA Church";

  const navigation: NavItem[] =
    headerMenu && headerMenu.length > 0
      ? headerMenu.map(menuItemToNavItem)
      : defaultNavigation;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur shadow-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-stonehill-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-stonehill-accent focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex shrink-0">
          <Link
            href="/"
            className="-m-1.5 rounded-sm p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 flex items-center"
            aria-label={`${churchName} home`}
          >
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="relative h-10 w-10">
                  <Image
                    src={logoUrl}
                    alt={`${churchName} Logo`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
              <span className="text-base lg:text-lg font-bold text-stonehill-primary whitespace-nowrap tracking-tight lg:tracking-normal">
                {churchName}
              </span>
            </div>
          </Link>
        </div>
        
        <DesktopNav items={navigation} />
        
        <div className="flex shrink-0 justify-end items-center gap-x-4">
          <Link 
            href="/give" 
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "hidden sm:inline-flex")}
          >
            Give
          </Link>
          <MobileNav 
            items={[...navigation, { href: "/give", label: "Give" }]} 
            churchName={churchName}
            logoUrl={logoUrl}
          />
        </div>
      </div>
    </header>
  );
}

