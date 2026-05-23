"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/shared/Button";

export interface NavItem {
  href: string;
  label: string;
  openInNewTab?: boolean;
  subItems?: NavItem[];
}

export interface MobileNavProps {
  items: NavItem[];
  churchName?: string;
  logoUrl?: string | null;
}

export function MobileNav({ items, churchName = "Stonehill SDA Church", logoUrl }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Prevent scrolling when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-900"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Open main menu</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-slate-900/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="-m-1.5 rounded-sm p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <div className="relative h-8 w-8">
                      <Image
                        src={logoUrl}
                        alt={`${churchName} Logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-lg font-bold text-stonehill-primary">
                    {churchName}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="-m-2.5 rounded-md p-2.5 text-slate-900"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-slate-200">
                <div className="space-y-2 py-6">
                  {items.map((item) => (
                    <div key={item.href}>
                      {item.openInNewTab ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 hover:bg-slate-50 hover:text-stonehill-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 hover:bg-slate-50 hover:text-stonehill-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )}
                      {item.subItems && (
                        <div className="ml-4 mt-1 border-l border-slate-200 pl-4 space-y-1">
                          {item.subItems.map((subItem) => (
                            subItem.openInNewTab ? (
                              <a
                                key={subItem.href}
                                href={subItem.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-slate-600 hover:bg-slate-50 hover:text-stonehill-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                                onClick={() => setIsOpen(false)}
                              >
                                {subItem.label}
                              </a>
                            ) : (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                aria-current={pathname === subItem.href ? "page" : undefined}
                                className="-mx-3 block rounded-lg px-3 py-2 text-base font-medium leading-7 text-slate-600 hover:bg-slate-50 hover:text-stonehill-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                                onClick={() => setIsOpen(false)}
                              >
                                {subItem.label}
                              </Link>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
