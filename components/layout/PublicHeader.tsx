import Link from "next/link";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/im-new", label: "I'm New" },
  { href: "/plan-your-visit", label: "Plan Your Visit" },
  { href: "/sermons", label: "Sermons" },
  { href: "/events", label: "Events" },
  { href: "/ministries", label: "Ministries" },
  { href: "/about", label: "About" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur shadow-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-stonehill-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-stonehill-accent focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link
            href="/"
            className="-m-1.5 rounded-sm p-1.5 text-lg font-bold text-stonehill-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
            aria-label="Stonehill SDA Church home"
          >
            Stonehill SDA Church
          </Link>
        </div>
        
        <DesktopNav items={navigation} />
        
        <div className="flex flex-1 justify-end items-center gap-x-4">
          <Link 
            href="/give" 
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "hidden sm:inline-flex")}
          >
            Give
          </Link>
          <MobileNav items={[...navigation, { href: "/give", label: "Give" }]} />
        </div>
      </div>
    </header>
  );
}
