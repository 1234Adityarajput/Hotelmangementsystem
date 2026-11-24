import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A06A] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#59283A] text-white hover:bg-[#472130] shadow-sm active:scale-[0.99]",
        accent:
          "bg-[#C4A06A] text-[#352630] hover:bg-[#B8935D] shadow-sm font-bold active:scale-[0.99]",
        destructive:
          "bg-[#B54C44] text-white hover:bg-[#9E3E37] shadow-sm active:scale-[0.99]",
        outline:
          "border border-[#E8DDD8] bg-white text-[#59283A] hover:bg-[#F5F0EA] hover:text-[#472130] shadow-xs",
        secondary:
          "bg-[#F5F0EA] text-[#59283A] hover:bg-[#EFE8E0] border border-[#E8DDD8] font-medium",
        ghost:
          "text-[#82747A] hover:bg-[#F5F0EA] hover:text-[#59283A]",
        link:
          "text-[#C4A06A] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
