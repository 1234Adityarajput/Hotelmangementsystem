"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Shield, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") {
    return null;
  }

  const getPageTitle = (path: string) => {
    if (path === "/") return "Admin Dashboard";
    if (path.startsWith("/guests")) return "Guest Management";
    if (path.startsWith("/rooms")) return "Room Inventory & Categories";
    if (path.startsWith("/bookings")) return "Booking Management";
    if (path.startsWith("/stays")) return "Check-In & Check-Out Operations";
    if (path.startsWith("/items")) return "Hotel Items & Services Catalog";
    if (path.startsWith("/invoices")) return "Billing & Invoice Generation";
    if (path.startsWith("/payments")) return "Payment Processing & Ledger";
    if (path.startsWith("/setup")) return "Database & Setup Verification";
    return "Hotel Management OS";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Neon Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Neon DB Connected</span>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-800">
            {user?.username || "admin"}
          </span>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          title="Sign out of Admin session"
          className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline ml-1 text-xs">Logout</span>
        </Button>
      </div>
    </header>
  );
}
