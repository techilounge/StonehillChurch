import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  fullHeight?: boolean;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "There was an error loading this content. Please try again later.", 
  onRetry,
  className,
  fullHeight = false
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", fullHeight && "min-h-[400px]", className)}>
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-stonehill-ink mb-2">{title}</h3>
      <p className="text-stonehill-muted max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
