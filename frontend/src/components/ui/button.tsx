import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A60] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#362A22] text-[#FFFFFF] hover:bg-[#43352B] shadow-sm active:scale-[0.99]",
        accent:
          "bg-[#B08A60] text-white hover:bg-[#96724A] shadow-sm active:scale-[0.99]",
        destructive:
          "bg-[#B54C44] text-white hover:bg-[#9E3E37] shadow-sm",
        outline:
          "border border-[#E3D9CA] bg-white text-[#362A22] hover:bg-[#F2EADF] hover:text-[#362A22] shadow-sm",
        secondary:
          "bg-[#EEE7DA] text-[#362A22] hover:bg-[#E3D9CA] font-medium",
        ghost:
          "text-[#79695B] hover:bg-[#F2EADF] hover:text-[#362A22]",
        link:
          "text-[#B08A60] underline-offset-4 hover:underline font-semibold",
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
