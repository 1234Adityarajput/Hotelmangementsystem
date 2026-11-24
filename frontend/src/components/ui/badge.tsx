import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4A06A]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#59283A] text-white shadow-xs",
        secondary:
          "border-[#E8DDD8] bg-[#F5F0EA] text-[#59283A]",
        destructive:
          "border-[#B54C44]/30 bg-[#F8E8E5] text-[#B54C44]",
        danger:
          "border-[#B54C44]/30 bg-[#F8E8E5] text-[#B54C44]",
        outline:
          "border-[#E8DDD8] text-[#82747A] bg-white",
        success:
          "border-[#32765B]/30 bg-[#E7F1E9] text-[#32765B]",
        warning:
          "border-[#A97832]/30 bg-[#F6EDDC] text-[#A97832]",
        info:
          "border-[#627D91]/30 bg-[#E9EFF3] text-[#627D91]",
        gold:
          "border-[#C4A06A]/40 bg-[#F5F0EA] text-[#A8834F]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
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
