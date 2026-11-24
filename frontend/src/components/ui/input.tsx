import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#E8DDD8] bg-white px-3.5 py-2 text-sm text-[#352630] placeholder:text-[#82747A] shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A06A] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F5F0EA]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
