import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-stonehill-primary text-white hover:bg-stonehill-dark",
        primary: "bg-stonehill-accent text-stonehill-primary hover:bg-[#cca300]",
        secondary: "bg-stonehill-secondary text-white hover:bg-[#15536e]",
        outline:
          "border border-slate-200 bg-transparent hover:bg-slate-50 text-stonehill-primary",
        ghost: "hover:bg-slate-50 text-stonehill-primary",
        link: "text-stonehill-accent underline-offset-4 hover:underline",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[44px] rounded-md px-3 text-sm",
        lg: "min-h-[48px] rounded-md px-8 text-base",
        icon: "min-h-[44px] min-w-[44px] w-11 h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
