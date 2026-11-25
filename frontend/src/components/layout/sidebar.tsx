"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Calculator,
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

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
          name: "Automatic Billing",
          href: "/billing",
          icon: Calculator,
          active: pathname.startsWith("/billing"),
        },
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
          name: "Advances",
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
          name: "Registers",
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
          name: "Settings",
          href: "/settings",
          icon: Settings,
          active: pathname.startsWith("/settings"),
        },
        {
          name: "DB Setup",
          href: "/setup",
          icon: Activity,
          active: pathname.startsWith("/setup"),
        },
      ],
    },
  ];

  const filteredNavGroups = !isManager
    ? navGroups
    : [
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
              name: "Automatic Billing",
              href: "/billing",
              icon: Calculator,
              active: pathname.startsWith("/billing"),
            },
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
          ],
        },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#59283A] text-white select-none">
      {/* Brand Header */}
      <div className={cn(
        "h-24 flex items-center border-b border-[#472130] bg-[#472130]/70 flex-shrink-0 transition-all px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/" className="flex items-center gap-3.5 min-w-0" onClick={onMobileClose}>
          <div className={cn(
            "rounded-2xl overflow-hidden shadow-xl flex-shrink-0 border-2 border-[#C4A06A] relative bg-[#59283A] transition-all",
            collapsed ? "w-13 h-13" : "w-16 h-16"
          )}>
            <Image
              src="/radha-krishna-logo.jpg"
              alt="Hotel Radha Palace"
              fill
              className="object-cover"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-lg text-white tracking-tight leading-tight truncate">
                Hotel Radha Palace
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="w-3 h-3 text-[#C4A06A]" />
                <span className="text-[11px] text-[#C4A06A] tracking-widest uppercase font-semibold">
                  Royal Luxury OS
                </span>
              </div>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-[#8E7079] hover:text-white hover:bg-[#472130] transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-[#8E7079] hover:text-white hover:bg-[#472130] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin Access Pill */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-[#472130] bg-[#472130]/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#8E7079]">
              <Shield className="w-3.5 h-3.5 text-[#C4A06A]" />
              <span className="text-[11px] font-medium text-white/80">Role:</span>
            </div>
            <span className="text-[10px] bg-[#472130] text-[#C4A06A] border border-[#C4A06A]/30 px-2 py-0.5 rounded-full font-semibold">
              {isManager ? "👔 Hotel Manager" : "👑 Hotel Owner"}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {filteredNavGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-[#8E7079] tracking-wider uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150",
                      item.active
                        ? "bg-[#472130] text-white shadow-sm font-semibold tracking-wide"
                        : "text-white/90 hover:text-white hover:bg-[#472130]/60",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    {/* Champagne Gold Active Indicator Bar */}
                    {item.active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C4A06A] rounded-r-full" />
                    )}

                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        item.active
                          ? "text-[#C4A06A]"
                          : "text-[#8E7079] group-hover:text-white",
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Status */}
      <div className={cn(
        "p-4 border-t border-[#472130] text-xs bg-[#472130]/70 text-[#8E7079] flex-shrink-0",
        collapsed && "p-2 text-center"
      )}>
        {collapsed ? (
          <div className="w-2.5 h-2.5 rounded-full bg-[#32765B] mx-auto animate-pulse" title="PostgreSQL Live" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#32765B] animate-pulse" />
                <span className="text-white font-medium text-[11px]">Database Connected</span>
              </div>
              <span className="text-[10px] text-[#C4A06A] font-mono">v2.0</span>
            </div>
            <p className="mt-1 text-[10px] text-[#8E7079]">Royal Burgundy & Pearl • Monolith</p>
          </>
        )}
      </div>

      {/* Expand Button for Collapsed State */}
      {collapsed && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="p-3 text-[#8E7079] hover:text-white hover:bg-[#472130] transition-colors flex justify-center border-t border-[#472130]"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 border-r border-[#472130] shadow-2xl transition-all duration-300 z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
