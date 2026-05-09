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
          className="text-stonehill-ink transition-colors hover:text-stonehill-forest"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
