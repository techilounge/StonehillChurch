import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stonehill-gold focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-stonehill-evergreen text-white hover:bg-stonehill-forest",
        secondary:
          "border-transparent bg-stonehill-cream text-stonehill-evergreen hover:bg-[#e8e0d1]",
        destructive:
          "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        outline: "text-stonehill-ink border-stonehill-line",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
