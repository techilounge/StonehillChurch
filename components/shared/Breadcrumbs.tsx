import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-stonehill-muted", className)}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:text-stonehill-evergreen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold rounded-sm">
            <span className="sr-only">Home</span>
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              {isLast || !item.href ? (
                <span className="font-medium text-stonehill-ink" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-stonehill-evergreen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold rounded-sm">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
