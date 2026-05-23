"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  openInNewTab?: boolean;
  subItems?: NavItem[];
}

export interface DesktopNavProps {
  items: NavItem[];
  className?: string;
}

export function DesktopNav({ items, className }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden lg:flex items-center gap-x-6 text-sm font-medium", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || (item.subItems?.some(sub => pathname === sub.href));
        
        return (
          <div key={item.href} className={cn("relative group flex items-center")}>
            {item.openInNewTab ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-sm px-1 py-2 transition-colors hover:text-stonehill-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 flex items-center gap-1",
                  isActive ? "text-stonehill-primary font-bold" : "text-slate-900"
                )}
              >
                {item.label}
                {item.subItems && (
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-stonehill-dark transition-colors" />
                )}
              </a>
            ) : (
              <Link 
                href={item.href} 
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "rounded-sm px-1 py-2 transition-colors hover:text-stonehill-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 flex items-center gap-1",
                  isActive ? "text-stonehill-primary font-bold" : "text-slate-900"
                )}
              >
                {item.label}
                {item.subItems && (
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-stonehill-dark transition-colors" />
                )}
              </Link>
            )}

            {item.subItems && (
              <div className="absolute top-full left-0 w-48 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all z-50">
                <div className="bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden flex flex-col py-1">
                  {item.subItems.map((subItem) => (
                    subItem.openInNewTab ? (
                      <a
                        key={subItem.href}
                        href={subItem.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:text-stonehill-primary",
                          "text-slate-700 hover:bg-slate-50 hover:text-stonehill-primary"
                        )}
                      >
                        {subItem.label}
                      </a>
                    ) : (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        aria-current={pathname === subItem.href ? "page" : undefined}
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-slate-50 focus-visible:text-stonehill-primary",
                          pathname === subItem.href 
                            ? "bg-slate-50 text-stonehill-primary font-bold" 
                            : "text-slate-700 hover:bg-slate-50 hover:text-stonehill-primary"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
