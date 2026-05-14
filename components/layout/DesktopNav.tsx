import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

export interface DesktopNavProps {
  items: NavItem[];
  className?: string;
}

export function DesktopNav({ items, className }: DesktopNavProps) {
  return (
    <nav className={cn("hidden lg:flex items-center gap-x-6 text-sm font-medium", className)}>
      {items.map((item) => (
        <Link 
          key={item.href} 
          href={item.href} 
          className="rounded-sm px-1 text-slate-900 transition-colors hover:text-stonehill-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
