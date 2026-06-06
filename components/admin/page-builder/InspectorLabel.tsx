"use client";

import * as React from "react";
import { InfoIcon } from "@/components/admin/shared/InfoIcon";

interface InspectorLabelProps {
  children: React.ReactNode;
  tooltip?: string;
  popover?: string;
  /** Override the default `<label>` element when the control isn't a real input. */
  as?: "label" | "span" | "div";
  className?: string;
}

const DEFAULT_CLASS =
  "text-xs font-semibold text-slate-900 uppercase tracking-wider inline-flex items-center gap-1.5";

export function InspectorLabel({
  children,
  tooltip,
  popover,
  as = "label",
  className,
}: InspectorLabelProps) {
  const Tag = as;
  const labelText = typeof children === "string" ? children : undefined;
  const ariaLabel = labelText ? `Help for ${labelText}` : "More information";
  return (
    <Tag className={`${DEFAULT_CLASS} ${className ?? ""}`}>
      <span>{children}</span>
      {(popover || tooltip) && (
        <InfoIcon
          {...(popover ? { popover, width: 320 } : { tooltip })}
          ariaLabel={ariaLabel}
        />
      )}
    </Tag>
  );
}
