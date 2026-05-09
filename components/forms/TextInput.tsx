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
          "flex h-10 w-full rounded-md border border-stonehill-line bg-white px-3 py-2 text-sm text-stonehill-ink file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stonehill-ink/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-forest disabled:cursor-not-allowed disabled:opacity-50 transition",
          hasError && "border-red-500 focus-visible:ring-red-500",
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
