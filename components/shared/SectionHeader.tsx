import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, eyebrow, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8", className)}>
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-sm font-bold uppercase tracking-widest text-stonehill-dark">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-stonehill-accent font-handwritten text-2xl md:text-3xl max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
