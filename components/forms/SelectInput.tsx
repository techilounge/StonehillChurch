"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-stonehill-line bg-white px-3 py-2 text-sm text-stonehill-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-forest disabled:cursor-not-allowed disabled:opacity-50 transition",
            hasError && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stonehill-ink/50" />
      </div>
    );
  }
);
SelectInput.displayName = "SelectInput";

export { SelectInput };
