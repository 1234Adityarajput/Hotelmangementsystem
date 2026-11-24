"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Shield, LogOut, CheckCircle2, ChevronRight, Menu } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenMobile?: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") {
    return null;
  }

  const getPageInfo = (path: string): { title: string; category: string; description: string } => {
    if (path === "/") {
      return {
        category: "Overview",
        title: "Hotel Operations Dashboard",
        description: "Real-time key operational metrics, live room inventory, and revenue overview.",
      };
    }
    if (path.startsWith("/guests")) {
      return {
        category: "Front Office",
        title: "Guest Directory & Profiles",
        description: "Manage guest identity documents, contact information, and stay histories.",
      };
    }
    if (path.startsWith("/rooms")) {
      return {
        category: "Front Office",
        title: "Room Inventory & Categories",
        description: "Configure room pricing, floor distribution, and maintenance status.",
      };
    }
    if (path.startsWith("/bookings")) {
      return {
        category: "Front Office",
        title: "Reservations & Bookings",
        description: "Manage upcoming reservations, advance deposits, and room assignments.",
      };
    }
    if (path.startsWith("/stays")) {
      return {
        category: "Front Office",
        title: "Front Desk Check-In & Check-Out",
        description: "Process live arrivals, active in-house stays, key returns, and room relocations.",
      };
    }
    if (path.startsWith("/items")) {
      return {
        category: "Operations",
        title: "Hotel Services & POS Catalog",
        description: "Manage restaurant items, spa packages, laundry, and minibar price points.",
      };
    }
    if (path.startsWith("/invoices")) {
      return {
        category: "Operations",
        title: "Billing & Folio Invoices",
        description: "Generate checkout tax invoices, review folios, and print guest bills.",
      };
    }
    if (path.startsWith("/payments")) {
      return {
        category: "Operations",
        title: "Financial Payments & Ledger",
        description: "Track cash, UPI, and bank transfer receipts with real-time audit balance.",
      };
    }
    if (path.startsWith("/staff")) {
      return {
        category: "Workforce",
        title: "Staff Directory & Personnel",
        description: "Manage employee profiles, designations, department assignments, and base salaries.",
      };
    }
    if (path.startsWith("/attendance")) {
      return {
        category: "Workforce",
        title: "Daily Attendance & Overtime",
        description: "Record daily shift check-ins, check-outs, working hours, and overtime.",
      };
    }
    if (path.startsWith("/advances")) {
      return {
        category: "Workforce",
        title: "Staff Advance Ledger",
        description: "Disburse employee salary advances, track recoveries, and view outstanding balances.",
      };
    }
    if (path.startsWith("/payroll")) {
      return {
        category: "Workforce",
        title: "Payroll & Salary Disbursement",
        description: "Compute monthly attendance pay, advance deductions, and issue payslips.",
      };
    }
    if (path.startsWith("/expenses")) {
      return {
        category: "Finance",
        title: "Hotel Expenses & Operations",
        description: "Record operational expenditures, categorize vendors, and audit outflows.",
      };
    }
    if (path.startsWith("/reports")) {
      return {
        category: "Finance",
        title: "Executive Reports & Analytics",
        description: "Comprehensive financial performance, occupancy trends, and business KPIs.",
      };
    }
    if (path.startsWith("/registers")) {
      return {
        category: "Records",
        title: "Statutory Digital Registers (14 Types)",
        description: "Hospitality statutory registers with instant CSV download and print support.",
      };
    }
    if (path.startsWith("/audit-logs")) {
      return {
        category: "Records",
        title: "System Audit Trail & History",
        description: "Immutable record of all state mutations, administrative actions, and user events.",
      };
    }
    if (path.startsWith("/settings")) {
      return {
        category: "Administration",
        title: "Hotel Settings & Policies",
        description: "Configure hotel identity, default tax percentages, check-in timings, and rules.",
      };
    }
    if (path.startsWith("/setup")) {
      return {
        category: "Administration",
        title: "Database Health & System Setup",
        description: "Verify PostgreSQL connection latency, table migrations, and system uptime.",
      };
    }
    if (path.startsWith("/billing")) {
      return {
        category: "Operations",
        title: "Automatic Billing & Folio Settlement",
        description: "Unified automatic billing engine for active stays, amenities, and payments.",
      };
    }

    return {
      category: "Hotel Admin",
      title: "Grand Horizon OS",
      description: "Royal luxury boutique hotel management platform.",
    };
  };

  const info = getPageInfo(pathname);

  return (
    <header className="h-20 bg-white border-b border-[#E8DDD8] px-4 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-sm transition-all z-20">
      {/* Left: Mobile Toggle & Editorial Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl text-[#59283A] hover:bg-[#F5F0EA] border border-[#E8DDD8] transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#82747A] tracking-wider uppercase">
            <span>{info.category}</span>
            <ChevronRight className="w-3 h-3 text-[#C4A06A]" />
            <span className="text-[#59283A] font-bold">{info.title}</span>
          </div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-[#59283A] tracking-tight leading-tight mt-0.5">
            {info.title}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Neon Live Status Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-[#E7F1E9] text-[#32765B] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#32765B]/25 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#32765B]" />
          <span className="tracking-wide">Neon DB Live</span>
        </div>

        {/* Administrator Profile Pill */}
        <div className="flex items-center gap-2.5 bg-[#F5F0EA] px-3 sm:px-3.5 py-1.5 rounded-full border border-[#E8DDD8] shadow-xs">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#59283A] to-[#472130] flex items-center justify-center text-[#C4A06A] shadow-xs">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#352630] leading-none">
              {user?.username || "admin"}
            </span>
            <span className="text-[10px] font-semibold leading-tight text-[#59283A]">
              {user?.role === "MANAGER" ? "👔 Hotel Manager" : "👑 Hotel Owner"}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          title="Sign out of Admin session"
          className="border-[#E8DDD8] text-[#82747A] hover:text-[#B54C44] hover:bg-[#F8E8E5] hover:border-[#B54C44]/30 h-9 px-2.5 sm:px-3 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
