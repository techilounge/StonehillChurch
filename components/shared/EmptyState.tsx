import React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon = <FolderOpen className="h-10 w-10 text-stonehill-muted" />, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-stonehill-line bg-white/50", className)}>
      <div className="mb-4 rounded-full bg-stonehill-cream p-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stonehill-ink mb-2">{title}</h3>
      {description && <p className="text-stonehill-muted max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
