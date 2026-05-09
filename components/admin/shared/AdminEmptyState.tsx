import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/shared/Button";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stonehill-line bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stonehill-cream">
        <Icon className="h-8 w-8 text-stonehill-gold" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-stonehill-ink">{title}</h3>
      <p className="mt-1 text-sm text-stonehill-ink/60">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
