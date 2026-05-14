import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-stonehill-primary text-white hover:bg-stonehill-dark",
        secondary:
          "border-transparent bg-slate-50 text-stonehill-primary hover:bg-[#e8e0d1]",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        outline: "text-slate-900 border-slate-200",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
