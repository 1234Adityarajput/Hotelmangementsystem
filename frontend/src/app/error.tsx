"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-red-200">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
      <h2 className="text-xl font-bold text-slate-900 mb-1">
        Application Error
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={() => reset()} variant="default">
        Try Again
      </Button>
    </div>
  );
}
