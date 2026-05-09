import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  text?: string;
  className?: string;
  fullHeight?: boolean;
}

export function LoadingState({ text = "Loading...", className, fullHeight = false }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-stonehill-muted", fullHeight && "min-h-[400px]", className)}>
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-stonehill-gold" />
      <p className="text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}
