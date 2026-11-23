import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#B08A60]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#362A22] text-[#FFFFFF] shadow-sm",
        secondary:
          "border-transparent bg-[#EEE7DA] text-[#362A22]",
        destructive:
          "border-[#B54C44]/30 bg-[#F8E8E5] text-[#B54C44]",
        danger:
          "border-[#B54C44]/30 bg-[#F8E8E5] text-[#B54C44]",
        outline:
          "border-[#E3D9CA] text-[#79695B] bg-white",
        success:
          "border-[#32765B]/30 bg-[#E7F1E9] text-[#32765B]",
        warning:
          "border-[#A97832]/30 bg-[#F6EDDC] text-[#A97832]",
        info:
          "border-[#627D91]/30 bg-[#E9EFF3] text-[#627D91]",
        gold:
          "border-[#B08A60]/40 bg-[#FAF6F0] text-[#7A5935]",
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
