import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function AdminStatCard({ title, value, icon: Icon, trend, className }: AdminStatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-slate-200 shadow-sm hover:shadow-md hover:border-stonehill-accent/30 motion-safe:transition-all", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900/60 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-stonehill-primary">{value}</p>
            {trend && (
              <p className="mt-1 flex items-center text-sm">
                <span
                  className={cn(
                    "font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="ml-2 text-slate-900/50">{trend.label}</span>
              </p>
            )}
          </div>
          <div className="ml-4 p-3 bg-slate-50 rounded-xl text-stonehill-accent">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
