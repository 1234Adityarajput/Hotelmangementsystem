"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-[#E8DDD8]">
      <h2 className="font-serif text-3xl font-bold text-[#59283A] mb-2">404</h2>
      <p className="text-base text-[#82747A] mb-6">Page Not Found</p>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
