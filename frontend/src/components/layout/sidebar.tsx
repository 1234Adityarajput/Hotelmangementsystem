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
  UserCheck,
  CalendarCheck2,
  HandCoins,
  Banknote,
  WalletCards,
  BookOpenCheck,
  BarChart3,
  Settings,
  ShieldAlert,
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

  const operationsNav = [
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

  const hrNav = [
    {
      name: "Staff Directory",
      href: "/staff",
      icon: UserCheck,
      active: pathname.startsWith("/staff"),
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: CalendarCheck2,
      active: pathname.startsWith("/attendance"),
    },
    {
      name: "Staff Advances",
      href: "/advances",
      icon: HandCoins,
      active: pathname.startsWith("/advances"),
    },
    {
      name: "Payroll & Salary",
      href: "/payroll",
      icon: Banknote,
      active: pathname.startsWith("/payroll"),
    },
  ];

  const reportsNav = [
    {
      name: "Expenses",
      href: "/expenses",
      icon: WalletCards,
      active: pathname.startsWith("/expenses"),
    },
    {
      name: "Digital Registers",
      href: "/registers",
      icon: BookOpenCheck,
      active: pathname.startsWith("/registers"),
    },
    {
      name: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
    },
  ];

  const systemNav = [
    {
      name: "Hotel Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
    {
      name: "Audit Logs",
      href: "/audit-logs",
      icon: ShieldAlert,
      active: pathname.startsWith("/audit-logs"),
    },
    {
      name: "Setup & DB Health",
      href: "/setup",
      icon: Activity,
      active: pathname.startsWith("/setup"),
    },
  ];

  const renderNavGroup = (title: string, items: typeof operationsNav) => (
    <div className="pt-3 first:pt-0">
      <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                item.active
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900",
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-60 bg-slate-950 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-white tracking-tight">
            Grand Horizon
          </span>
          <span className="text-[10px] text-slate-400">Hotel Admin OS</span>
        </div>
      </div>

      {/* Admin Status Pill */}
      <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Access:</span>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700 py-0">
            Single Admin
          </Badge>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {renderNavGroup("Front Desk & Ops", operationsNav)}
        {renderNavGroup("Staff & Payroll", hrNav)}
        {renderNavGroup("Finance & Records", reportsNav)}
        {renderNavGroup("System Administration", systemNav)}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-900 text-xs text-slate-500 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 font-medium text-[11px]">Neon DB Live</span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-600">PostgreSQL 18.7 • Monolith</p>
      </div>
    </aside>
  );
}
