"use client";

import React from "react";
import Image from "next/image";
import { Loader2, Hotel, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  text?: string;
  subtext?: string | null;
  fullPage?: boolean;
  inline?: boolean;
}

export function LoadingSpinner({
  className,
  size = "md",
  text,
  subtext,
  fullPage = false,
  inline = false,
}: LoadingSpinnerProps) {
  if (inline) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 select-none", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4A06A]" />
        {text && <span className="text-xs text-[#82747A] font-medium">{text}</span>}
      </span>
    );
  }

  const content = (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center select-none", className)}>
      {/* Royal Luxury Dual-Ring Hotel Crest Loader */}
      <div className="relative flex items-center justify-center mb-3">
        {/* Outer glowing pulsing aura */}
        <div className="absolute inset-0 rounded-full bg-[#C4A06A]/20 blur-md animate-pulse" />

        {/* Outer Champagne Gold spinning orbit */}
        <div
          className={cn(
            "rounded-full border-2 border-transparent border-t-[#C4A06A] border-r-[#C4A06A]/50 animate-spin",
            size === "sm" ? "w-8 h-8" : size === "lg" || size === "xl" ? "w-16 h-16" : "w-12 h-12"
          )}
          style={{ animationDuration: "0.9s" }}
        />

        {/* Inner Royal Burgundy counter-spinning orbit */}
        <div
          className={cn(
            "absolute rounded-full border-2 border-transparent border-b-[#59283A] border-l-[#59283A]/60 animate-spin",
            size === "sm" ? "w-6 h-6" : size === "lg" || size === "xl" ? "w-12 h-12" : "w-9 h-9"
          )}
          style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
        />

        {/* Center Royal Hotel Crest Emblem */}
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-xl bg-gradient-to-br from-[#59283A] to-[#472130] text-[#C4A06A] shadow-md border border-[#C4A06A]/40",
            size === "sm" ? "w-5 h-5" : size === "lg" || size === "xl" ? "w-9 h-9" : "w-7 h-7"
          )}
        >
          <Hotel
            className={
              size === "sm"
                ? "w-3 h-3 text-[#C4A06A]"
                : size === "lg" || size === "xl"
                ? "w-5 h-5 text-[#C4A06A]"
                : "w-4 h-4 text-[#C4A06A]"
            }
          />
        </div>
      </div>

      {/* Primary Loading Text with Animated Shimmer Dots */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-serif font-bold text-sm text-[#59283A] tracking-tight">
            {text || "Loading..."}
          </span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#C4A06A] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-[#C4A06A] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-[#C4A06A] animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>

        {/* Secondary Subtitle / Context */}
        {subtext !== null && (
          <p className="text-[11px] font-medium text-[#82747A] tracking-wide">
            {subtext || "Please wait while records are synchronized"}
          </p>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F0EA]/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl border border-[#E8DDD8] shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
