import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-stonehill-evergreen text-white hover:bg-stonehill-forest",
        primary: "bg-stonehill-gold text-stonehill-ink hover:bg-[#b89544]",
        secondary: "bg-stonehill-cream text-stonehill-evergreen hover:bg-[#e8e0d1]",
        outline:
          "border border-stonehill-line bg-transparent hover:bg-stonehill-cream text-stonehill-evergreen",
        ghost: "hover:bg-stonehill-cream text-stonehill-evergreen",
        link: "text-stonehill-gold underline-offset-4 hover:underline",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
