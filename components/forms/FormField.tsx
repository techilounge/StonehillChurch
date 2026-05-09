import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  id?: string;
  error?: string | string[];
  description?: string;
}

export function FormField({
  label,
  id,
  error,
  description,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stonehill-ink">
          {label}
        </label>
      )}
      {children}
      {description && (
        <p className="text-sm text-stonehill-ink/70" id={id ? `${id}-description` : undefined}>
          {description}
        </p>
      )}
      {error && (
        <p className="text-sm font-medium text-red-500" id={id ? `${id}-error` : undefined}>
          {Array.isArray(error) ? error.join(", ") : error}
        </p>
      )}
    </div>
  );
}
