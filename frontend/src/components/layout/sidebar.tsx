"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hotel,
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
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          active: pathname === "/",
        },
      ],
    },
    {
      title: "FRONT OFFICE",
      items: [
        {
          name: "Guests",
          href: "/guests",
          icon: Users,
          active: pathname.startsWith("/guests"),
        },
        {
          name: "Rooms",
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
          name: "Stays",
          href: "/stays",
          icon: DoorOpen,
          active: pathname.startsWith("/stays"),
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Items & Services",
          href: "/items",
          icon: UtensilsCrossed,
          active: pathname.startsWith("/items"),
        },
        {
          name: "Invoices",
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
      ],
    },
    {
      title: "WORKFORCE",
      items: [
        {
          name: "Staff",
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
          name: "Payroll",
          href: "/payroll",
          icon: Banknote,
          active: pathname.startsWith("/payroll"),
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          name: "Expenses",
          href: "/expenses",
          icon: WalletCards,
          active: pathname.startsWith("/expenses"),
        },
        {
          name: "Reports",
          href: "/reports",
          icon: BarChart3,
          active: pathname.startsWith("/reports"),
        },
      ],
    },
    {
      title: "RECORDS",
      items: [
        {
          name: "Digital Registers",
          href: "/registers",
          icon: BookOpenCheck,
          active: pathname.startsWith("/registers"),
        },
        {
          name: "Audit Logs",
          href: "/audit-logs",
          icon: ShieldAlert,
          active: pathname.startsWith("/audit-logs"),
        },
      ],
    },
    {
      title: "ADMINISTRATION",
      items: [
        {
          name: "Hotel Settings",
          href: "/settings",
          icon: Settings,
          active: pathname.startsWith("/settings"),
        },
        {
          name: "DB Health & Setup",
          href: "/setup",
          icon: Activity,
          active: pathname.startsWith("/setup"),
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#362A22] text-[#EEE7DA] flex flex-col flex-shrink-0 border-r border-[#2A201A] shadow-xl select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#43352B] gap-3.5 bg-[#2A201A]/60">
        <div className="w-10 h-10 rounded-xl bg-[#B08A60] flex items-center justify-center text-white shadow-md font-bold text-lg flex-shrink-0">
          <Hotel className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-serif font-bold text-base text-white tracking-tight leading-tight truncate">
            Grand Horizon
          </span>
          <span className="text-[10px] text-[#B08A60] tracking-widest uppercase font-semibold mt-0.5">
            Boutique Luxury OS
          </span>
        </div>
      </div>

      {/* Admin Access Pill */}
      <div className="px-5 py-2.5 border-b border-[#43352B] bg-[#2A201A]/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#C4B5AC]">
            <Shield className="w-3.5 h-3.5 text-[#B08A60]" />
            <span className="text-[11px] font-medium tracking-wide">System Access:</span>
          </div>
          <span className="text-[10px] bg-[#43352B] text-[#EEE7DA] border border-[#79695B]/40 px-2 py-0.5 rounded-full font-semibold">
            Single Admin
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-[#948779] tracking-wider uppercase">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                      item.active
                        ? "bg-[#B08A60] text-white shadow-sm font-semibold tracking-wide"
                        : "text-[#DDD4CE] hover:text-white hover:bg-[#43352B]",
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", item.active ? "text-white" : "text-[#B08A60]")} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#43352B] text-xs bg-[#2A201A]/70 text-[#C4B5AC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#32765B] animate-pulse" />
            <span className="text-white font-medium text-[11px]">Neon DB Connected</span>
          </div>
          <span className="text-[10px] text-[#B08A60] font-mono">v1.0</span>
        </div>
        <p className="mt-1 text-[10px] text-[#948779]">PostgreSQL 18.7 • Modular Monolith</p>
      </div>
    </aside>
  );
}
