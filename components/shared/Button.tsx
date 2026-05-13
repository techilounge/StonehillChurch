"use client";

import * as React from "react";
import { buttonVariants, type ButtonVariantProps } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    const buttonClassName = buttonVariants({ variant, size, className });

    if (asChild) {
      const child = React.Children.only(children);

      if (React.isValidElement(child)) {
        const childElement = child as React.ReactElement<
          { className?: string } & Record<string, unknown>
        >;

        return React.cloneElement(childElement, {
          ...props,
          className: cn(buttonClassName, childElement.props.className),
        });
      }

      return null;
    }

    return (
      <button
        className={cn(buttonClassName)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
