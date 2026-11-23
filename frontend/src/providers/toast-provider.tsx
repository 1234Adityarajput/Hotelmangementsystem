"use client";

import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-white text-slate-900 border border-slate-200 shadow-md",
          description: "text-slate-500",
          actionButton: "bg-slate-900 text-white",
          cancelButton: "bg-slate-100 text-slate-500",
        },
      }}
    />
  );
}
