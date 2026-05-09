"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-stonehill-line bg-white px-3 py-2 text-sm text-stonehill-ink placeholder:text-stonehill-ink/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-forest disabled:cursor-not-allowed disabled:opacity-50 transition",
          hasError && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TextArea.displayName = "TextArea";

export { TextArea };
