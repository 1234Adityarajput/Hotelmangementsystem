"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarDays,
  DoorOpen,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const pathname = usePathname();

  // If on login page, hide sidebar
  if (pathname === "/login") {
    return null;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Guests",
      href: "/guests",
      icon: Users,
      active: pathname.startsWith("/guests"),
    },
    {
      name: "Rooms & Types",
      href: "/rooms",
      icon: BedDouble,
      active: pathname.startsWith("/rooms"),
    },
    {
      name: "Bookings",
      href: "/bookings",
      icon: CalendarDays,
      active: pathname.startsWith("/bookings"),
    },
    {
      name: "Check-In / Out",
      href: "/stays",
      icon: DoorOpen,
      active: pathname.startsWith("/stays"),
    },
    {
      name: "Items & Services",
      href: "/items",
      icon: UtensilsCrossed,
      active: pathname.startsWith("/items"),
    },
    {
      name: "Billing & Invoices",
      href: "/invoices",
      icon: Receipt,
      active: pathname.startsWith("/invoices"),
    },
    {
      name: "Payments",
      href: "/payments",
      icon: CreditCard,
      active: pathname.startsWith("/payments"),
    },
  ];

  const systemNav = [
    {
      name: "Setup & DB Health",
      href: "/setup",
      icon: Activity,
      active: pathname.startsWith("/setup"),
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-white tracking-tight">
            Grand Horizon
          </span>
          <span className="text-[11px] text-slate-400">Hotel Admin OS</span>
        </div>
      </div>

      {/* Admin Status Pill */}
      <div className="px-4 py-2.5 border-b border-slate-900 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Access:</span>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
            Single Admin
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Operations
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                item.active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          System
        </div>
        {systemNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                item.active
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-900 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 font-medium">Neon DB Live</span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-600">PostgreSQL 18.7 • Monolith</p>
      </div>
    </aside>
  );
}
