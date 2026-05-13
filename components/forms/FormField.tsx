import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  id?: string;
  error?: string | string[];
  description?: string;
  required?: boolean;
}

export function FormField({
  label,
  id,
  error,
  description,
  required,
  className,
  children,
  ...props
}: FormFieldProps) {
  const descriptionId = id && description ? `${id}-description` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const normalizedError = Array.isArray(error) ? error.join(", ") : error;

  const child = React.Children.only(children);
  type FieldChildProps = {
    id?: string;
    required?: boolean;
    hasError?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    "aria-required"?: boolean;
  } & Record<string, unknown>;
  const childElement = React.isValidElement<FieldChildProps>(child) ? child : null;
  const childProps = childElement?.props;
  const labelHasRequiredMarker = typeof label === "string" && label.includes("*");
  const isRequired =
    required === true || childProps?.required === true || labelHasRequiredMarker;
  const shouldShowRequiredMarker =
    isRequired && !labelHasRequiredMarker;
  const describedBy = [
    childProps?.["aria-describedby"],
    descriptionId,
    errorId,
  ]
    .filter(Boolean)
    .join(" ");
  const fieldId = childProps?.id ?? id;
  const isIntrinsic = typeof childElement?.type === "string";
  const field = childElement
    ? React.cloneElement(childElement, {
        id: childProps?.id ?? id,
        ...(isIntrinsic ? {} : { hasError: childProps?.hasError ?? Boolean(error) }),
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : childProps?.["aria-invalid"],
        "aria-required": isRequired ? true : childProps?.["aria-required"],
      })
    : child;

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-stonehill-ink">
          {label}
          {shouldShowRequiredMarker && (
            <span className="ml-1 text-red-700" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {field}
      {description && (
        <p className="text-sm text-stonehill-ink/70" id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p
          className="inline-flex items-start gap-1.5 text-sm font-medium text-red-700"
          id={errorId}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{normalizedError}</span>
        </p>
      )}
    </div>
  );
}
