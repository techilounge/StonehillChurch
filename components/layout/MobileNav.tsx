"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shared/Button";

export interface NavItem {
  href: string;
  label: string;
}

export interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
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
        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-stonehill-ink"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Open main menu</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-stonehill-ink/20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-stonehill-ink/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 text-lg font-bold text-stonehill-evergreen" onClick={() => setIsOpen(false)}>
                Stonehill
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="-m-2.5 rounded-md p-2.5 text-stonehill-ink"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-stonehill-line">
                <div className="space-y-2 py-6">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stonehill-ink hover:bg-stonehill-cream hover:text-stonehill-forest transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
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
