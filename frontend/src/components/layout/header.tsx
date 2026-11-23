"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Shield, LogOut, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function Header() {
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

    return {
      category: "Hotel Admin",
      title: "Grand Horizon OS",
      description: "Modern editorial luxury hotel management platform.",
    };
  };

  const info = getPageInfo(pathname);

  return (
    <header className="h-20 bg-white border-b border-[#E3D9CA] px-8 flex items-center justify-between flex-shrink-0 shadow-sm">
      {/* Breadcrumb & Editorial Page Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#79695B] tracking-wider uppercase">
          <span>{info.category}</span>
          <ChevronRight className="w-3 h-3 text-[#B08A60]" />
          <span className="text-[#362A22]">{info.title}</span>
        </div>
        <h1 className="font-serif text-xl font-bold text-[#362A22] tracking-tight leading-tight mt-0.5">
          {info.title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Neon Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-[#E7F1E9] text-[#32765B] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#32765B]/25">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#32765B]" />
          <span className="tracking-wide">Neon DB Live</span>
        </div>

        {/* Administrator Profile Pill */}
        <div className="flex items-center gap-2.5 bg-[#F7F4EE] px-3.5 py-1.5 rounded-full border border-[#E3D9CA]">
          <div className="w-6 h-6 rounded-full bg-[#B08A60] flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#362A22] leading-none">
              {user?.username || "admin"}
            </span>
            <span className="text-[10px] text-[#79695B] font-medium leading-tight">
              Single Admin
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          title="Sign out of Admin session"
          className="border-[#E3D9CA] text-[#79695B] hover:text-[#B54C44] hover:bg-[#F8E8E5] hover:border-[#B54C44]/30 h-9 px-3 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}
