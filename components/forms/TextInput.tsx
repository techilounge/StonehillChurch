"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors",
          hasError && "border-red-600 focus-visible:ring-red-600",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TextInput.displayName = "TextInput";

export { TextInput };
