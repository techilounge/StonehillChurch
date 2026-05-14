import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn("sm:flex sm:items-center sm:justify-between mb-8", className)} {...props}>
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-bold leading-6 text-stonehill-primary">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-900/70">{description}</p>}
      </div>
      {children && <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">{children}</div>}
    </div>
  );
}
