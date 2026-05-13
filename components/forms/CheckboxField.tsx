"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  hasError?: boolean;
}

const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ className, label, description, hasError, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    const descriptionId = fieldId && description ? `${fieldId}-description` : undefined;
    const describedBy = [props["aria-describedby"], descriptionId].filter(Boolean).join(" ");
    return (
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id={fieldId}
          ref={ref}
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-stonehill-line accent-stonehill-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors",
            hasError && "border-red-600 focus-visible:ring-red-600",
            className
          )}
          {...props}
          aria-describedby={describedBy || undefined}
          aria-invalid={hasError ? true : props["aria-invalid"]}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={fieldId}
            className="text-sm font-medium leading-none text-stonehill-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-700" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {description && (
            <p className="text-sm text-stonehill-ink/70" id={descriptionId}>{description}</p>
          )}
        </div>
      </div>
    );
  }
);
CheckboxField.displayName = "CheckboxField";

export { CheckboxField };
