"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Users,
  BedDouble,
  Receipt,
  CreditCard,
  Briefcase,
  Clock,
  ArrowRight,
  DoorOpen,
  LogOut,
  Wallet,
  ShoppingBag,
  IndianRupee,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Building,
  Hash,
  X,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import { registersService } from "@/services/registers.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const REGISTERS = [
  // 1-4: Front Desk Operations
  {
    id: "guests",
    label: "1. Guest Register",
    subtitle: "Guest Information Records",
    group: "Front Desk Operations",
    badge: "Guest Info",
    icon: Users,
    desc: "Complete guest demographics, contact details, identity documents, stay history, and lifetime spend.",
  },
  {
    id: "check-ins",
    label: "2. Check-in Register",
    subtitle: "Check-in Records",
    group: "Front Desk Operations",
    badge: "Arrivals & In-House",
    icon: DoorOpen,
    desc: "Detailed check-in logs: guest details, allocated room, check-in date/time, expected departure, tariff, and advance collected.",
  },
  {
    id: "check-outs",
    label: "3. Check-out Register",
    subtitle: "Check-out Records",
    group: "Front Desk Operations",
    badge: "Departures & Settlements",
    icon: LogOut,
    desc: "Completed stays audit: actual departure date/time, total nights, room charges, additional items, taxes, discounts, and final settlement.",
  },
  {
    id: "rooms",
    label: "4. Room Register",
    subtitle: "Room Management Records",
    group: "Front Desk Operations",
    badge: "Room Inventory",
    icon: BedDouble,
    desc: "Live room inventory: room number, category, floor, standard tariff, live status (Available/Occupied/Maintenance), and current occupant.",
  },

  // 5-9: Financial & Billing
  {
    id: "billing",
    label: "5. Guest Billing Register",
    subtitle: "Billing Records",
    group: "Financial & Accounts",
    badge: "Folios & Invoices",
    icon: Receipt,
    desc: "Complete invoice ledger: invoice number, guest name, room charges, F&B, laundry, sundries, GST taxes, discounts, paid amount, and balance.",
  },
  {
    id: "payments",
    label: "6. Payment Register",
    subtitle: "Payment History",
    group: "Financial & Accounts",
    badge: "Payment Inflow",
    icon: CreditCard,
    desc: "Complete chronological payment audit: voucher ref, transaction UTR, booking ref, payment method (Cash, UPI, Bank), and settlement status.",
  },
  {
    id: "cash-book",
    label: "7. Daily Cash Book",
    subtitle: "Daily Cash Transactions",
    group: "Financial & Accounts",
    badge: "Cash Flow Audit",
    icon: Wallet,
    desc: "Statutory Rokad Bahi: chronological stream of cash inflows (guest settlements) and cash outflows (expenses, advances, salaries) with net cash balance.",
  },
  {
    id: "expenses",
    label: "8. Expense Register",
    subtitle: "Expense Records",
    group: "Financial & Accounts",
    badge: "Hotel Outflow",
    icon: TrendingDown,
    desc: "Hotel expenditure ledger: voucher ref, payment date, category (Supplies, Utilities, Food Raw Materials, Maintenance), payment channel, and vendor.",
  },
  {
    id: "business",
    label: "9. Daily Business Register",
    subtitle: "Daily Business Reports",
    group: "Financial & Accounts",
    badge: "Day Book Summary",
    icon: BarChart3,
    desc: "Executive daily hotel performance: rooms occupied, occupancy %, check-ins, check-outs, room revenue, service revenue, daily expenses, and net profit.",
  },

  // 10-13: Services & Workforce
  {
    id: "services",
    label: "10. Service Register",
    subtitle: "Items & Services Records",
    group: "Services & Workforce",
    badge: "Guest Purchases",
    icon: ShoppingBag,
    desc: "Itemized service consumption: guest name, room number, service/item name, category, quantity, unit price, total bill, and order time.",
  },
  {
    id: "staff",
    label: "11. Staff Register",
    subtitle: "Staff Information",
    group: "Services & Workforce",
    badge: "Human Resources",
    icon: Briefcase,
    desc: "Employee roll: employee code, full name, mobile, address, emergency contact, department, designation, joining date, monthly salary, and bank details.",
  },
  {
    id: "attendance",
    label: "12. Attendance Register",
    subtitle: "Attendance Records",
    group: "Services & Workforce",
    badge: "Muster Roll",
    icon: Clock,
    desc: "Daily muster roll: attendance date, staff member, department, attendance status (Present, Absent, Half Day, Leave, Weekly Off), in/out time, and overtime.",
  },
  {
    id: "salaries",
    label: "13. Salary Register",
    subtitle: "Payroll Records",
    group: "Services & Workforce",
    badge: "Salary & Wages",
    icon: IndianRupee,
    desc: "Monthly payroll ledger: staff name, basic pay, configured days, payable attendance, overtime, advance deductions, other deductions, net salary, and balance.",
  },
];

export default function DigitalRegistersPage() {
  const [activeRegister, setActiveRegister] = useState("guests");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const currentMeta = useMemo(() => {
    return REGISTERS.find((r) => r.id === activeRegister) || REGISTERS[0];
  }, [activeRegister]);

  const fetchRegisterData = async () => {
    try {
      setLoading(true);
      const res = await registersService.getRegister({
        type: activeRegister,
        search: search || undefined,
        roomNumber: roomNumber || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page,
        limit: 25,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setSummary(res.summary || null);
    } catch (err: any) {
      console.error(`Failed to load ${activeRegister} register:`, err);
      toast.error(`Failed to load ${currentMeta.label} records`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisterData();
  }, [activeRegister, search, roomNumber, startDate, endDate, statusFilter, page]);

  // Quick Date Range Presets
  const setPresetDates = (preset: "today" | "week" | "month" | "all") => {
    setPage(1);
    const now = new Date();
    if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const past = new Date(Date.now() - 7 * 86400000);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const past = new Date(Date.now() - 30 * 86400000);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("No records available to export");
      return;
    }

    try {
      const sample = items[0];
      const headers = Object.keys(sample).filter((k) => typeof sample[k] !== "object");
      const rows = items.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `grand_horizon_${activeRegister}_register_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${currentMeta.label} exported to CSV / Excel successfully!`);
    } catch (err) {
      toast.error("Failed to generate CSV export");
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 print:p-0">
      {/* 
      =======================================================================
      HEADER BAR
      =======================================================================
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3D9CA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded tracking-wider">
              Statutory Hotel Ledgers • Module 12
            </span>
            <Badge variant="outline" className="text-[10px] border-[#B08A60] text-[#362A22] bg-white">
              13 Core Digital Registers
            </Badge>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#362A22] mt-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#B08A60]" />
            Digital Register Management
          </h1>
          <p className="text-xs text-[#79695B] max-w-3xl mt-0.5">
            Digitally maintaining the exact information traditionally recorded in physical hotel books & ledgers.
            Real-time searchable by dates, guest names, room numbers, and financial vouchers.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs border-[#E3D9CA] hover:bg-[#F7F4EE] text-[#362A22] flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Export CSV / Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Print Register</span>
          </Button>
        </div>
      </div>

      {/* 
      =======================================================================
      13 REGISTERS SELECTOR TABS (Categorized with Luxury Editorial Design)
      =======================================================================
      */}
      <div className="bg-white p-4 rounded-xl border border-[#E3D9CA] shadow-sm space-y-3.5 print:hidden">
        <div className="flex items-center justify-between border-b border-[#EEE7DA] pb-2">
          <span className="text-[11px] font-bold text-[#362A22] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#B08A60]" />
            Select Digital Register (Traditional Hotel Book ➔ Digital Record):
          </span>
          <span className="text-[10px] text-[#79695B]">13 of 13 Registers Available</span>
        </div>

        {/* Categories Grid */}
        <div className="space-y-2.5">
          {["Front Desk Operations", "Financial & Accounts", "Services & Workforce"].map((groupName) => {
            const groupRegisters = REGISTERS.filter((r) => r.group === groupName);
            return (
              <div key={groupName} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[10px] font-bold text-[#79695B] uppercase tracking-wider w-40 shrink-0">
                  {groupName}:
                </span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {groupRegisters.map((reg) => {
                    const IconComponent = reg.icon;
                    const isActive = activeRegister === reg.id;
                    return (
                      <button
                        key={reg.id}
                        onClick={() => {
                          setActiveRegister(reg.id);
                          setPage(1);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isActive
                            ? "bg-[#362A22] text-white border-[#362A22] shadow-sm"
                            : "bg-[#F7F4EE] text-[#5D493D] hover:bg-[#EEE7DA] border-[#E3D9CA]"
                        }`}
                      >
                        <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-[#B08A60]" : "text-[#79695B]"}`} />
                        <span>{reg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 
      =======================================================================
      ACTIVE REGISTER METADATA & TOP DYNAMIC KPI STRIP
      =======================================================================
      */}
      <div className="bg-[#F7F4EE] border border-[#E3D9CA] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3D9CA] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-lg border border-[#E3D9CA] shadow-sm">
              {React.createElement(currentMeta.icon, { className: "w-5 h-5 text-[#B08A60]" })}
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#362A22] flex items-center gap-2">
                {currentMeta.label}
                <span className="text-xs font-normal text-[#79695B]">— {currentMeta.subtitle}</span>
              </h2>
              <p className="text-[11px] text-[#79695B] mt-0.5">{currentMeta.desc}</p>
            </div>
          </div>
          <Badge className="bg-[#362A22] text-white text-[10px] w-fit">
            {currentMeta.badge}
          </Badge>
        </div>

        {/* Dynamic KPI Cards Based on Active Register */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Default Total Records */}
          <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-[#79695B] tracking-wider block">Total Entries</span>
            <span className="text-lg font-serif font-bold text-[#362A22] mt-0.5 block">{total}</span>
            <span className="text-[10px] text-[#948779]">Stored Digitally</span>
          </div>

          {/* Cash Book Specific KPIs */}
          {activeRegister === "cash-book" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Total Cash Inflow</span>
                <span className="text-lg font-mono font-bold text-emerald-800 mt-0.5 block">
                  ₹{Number(summary?.totalCashInflow || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600">Guest Settlements</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">Total Cash Outflow</span>
                <span className="text-lg font-mono font-bold text-rose-800 mt-0.5 block">
                  ₹{Number(summary?.totalCashOutflow || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-600">Expenses & Salaries</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Net Cash Balance</span>
                <span className="text-lg font-mono font-bold text-[#B08A60] mt-0.5 block">
                  ₹{Number(summary?.netCashFlow || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">Inflow − Outflow</span>
              </div>
            </>
          )}

          {/* Business Register Specific KPIs */}
          {activeRegister === "business" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Gross Revenue</span>
                <span className="text-lg font-mono font-bold text-emerald-800 mt-0.5 block">
                  ₹{Number(summary?.totalGrossRevenue || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600">Rooms & Services</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">Total Expenses</span>
                <span className="text-lg font-mono font-bold text-rose-800 mt-0.5 block">
                  ₹{Number(summary?.totalExpenses || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-600">Operations & Utilities</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Net Operating Profit</span>
                <span className="text-lg font-mono font-bold text-[#B08A60] mt-0.5 block">
                  ₹{Number(summary?.netOperatingProfit || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">Revenue − Costs</span>
              </div>
            </>
          )}

          {/* Billing Specific KPIs */}
          {activeRegister === "billing" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#79695B] tracking-wider block">Total Invoiced</span>
                <span className="text-lg font-mono font-bold text-[#362A22] mt-0.5 block">
                  ₹{Number(summary?.totalBilled || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">All Folios</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Total Paid</span>
                <span className="text-lg font-mono font-bold text-emerald-800 mt-0.5 block">
                  ₹{Number(summary?.totalPaid || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600">Realized Collections</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">Balance Due</span>
                <span className="text-lg font-mono font-bold text-amber-800 mt-0.5 block">
                  ₹{Number(summary?.totalBalanceDue || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-600">Outstanding</span>
              </div>
            </>
          )}

          {/* Payments Specific KPIs */}
          {activeRegister === "payments" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Total Collected</span>
                <span className="text-lg font-mono font-bold text-emerald-800 mt-0.5 block">
                  ₹{Number(summary?.totalCollected || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600">All Channels</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Cash Inflow</span>
                <span className="text-lg font-mono font-bold text-[#362A22] mt-0.5 block">
                  ₹{Number(summary?.cashCollected || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">Cash Drawer</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#B08A60] tracking-wider block">UPI & Bank Net</span>
                <span className="text-lg font-mono font-bold text-[#B08A60] mt-0.5 block">
                  ₹{(Number(summary?.upiCollected || 0) + Number(summary?.bankCollected || 0)).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">Digital Transfers</span>
              </div>
            </>
          )}

          {/* Check-ins Specific KPIs */}
          {activeRegister === "check-ins" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Total Check-Ins</span>
                <span className="text-lg font-serif font-bold text-emerald-800 mt-0.5 block">
                  {summary?.totalCheckIns || total}
                </span>
                <span className="text-[10px] text-emerald-600">Arrivals Processed</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Advance Collected</span>
                <span className="text-lg font-mono font-bold text-[#B08A60] mt-0.5 block">
                  ₹{Number(summary?.totalAdvanceCollected || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">At Check-In</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#79695B] tracking-wider block">Digital Archive</span>
                <span className="text-lg font-serif font-bold text-[#362A22] mt-0.5 block">100%</span>
                <span className="text-[10px] text-[#79695B]">Tamper-Proof Records</span>
              </div>
            </>
          )}

          {/* Services Specific KPIs */}
          {activeRegister === "services" && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Items & Services Sold</span>
                <span className="text-lg font-serif font-bold text-emerald-800 mt-0.5 block">
                  {summary?.totalItemsSold || 0}
                </span>
                <span className="text-[10px] text-emerald-600">Units Delivered</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Service Revenue</span>
                <span className="text-lg font-mono font-bold text-[#B08A60] mt-0.5 block">
                  ₹{Number(summary?.totalServiceRevenue || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#79695B]">F&B, Laundry & Sundries</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#79695B] tracking-wider block">Guest Folio Link</span>
                <span className="text-lg font-serif font-bold text-[#362A22] mt-0.5 block">Automated</span>
                <span className="text-[10px] text-[#79695B]">Added to Final Bill</span>
              </div>
            </>
          )}

          {/* Other registers fallback KPIs */}
          {!["cash-book", "business", "billing", "payments", "check-ins", "services"].includes(activeRegister) && (
            <>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#79695B] tracking-wider block">Statutory Format</span>
                <span className="text-lg font-serif font-bold text-[#362A22] mt-0.5 block">Standard</span>
                <span className="text-[10px] text-[#79695B]">Hotel Regulations Compliant</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">Audit Status</span>
                <span className="text-lg font-serif font-bold text-emerald-800 mt-0.5 block">Live & Synced</span>
                <span className="text-[10px] text-emerald-600">Database Verified</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#E3D9CA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#362A22] tracking-wider block">Search Coverage</span>
                <span className="text-lg font-serif font-bold text-[#B08A60] mt-0.5 block">Full Matrix</span>
                <span className="text-[10px] text-[#79695B]">Date, Name & Room #</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 
      =======================================================================
      ADVANCED FILTER & SEARCH BAR (Date Range, Room Number, Text Search)
      =======================================================================
      */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm print:hidden">
        {/* Left Side: Date Range + Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#362A22] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#B08A60]" />
            Date Range:
          </span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36 border-[#E3D9CA]"
          />
          <span className="text-xs text-[#79695B]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36 border-[#E3D9CA]"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1 border-l border-[#EEE7DA] pl-2">
            <button
              onClick={() => setPresetDates("today")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F7F4EE] hover:bg-[#EEE7DA] text-[#362A22]"
            >
              Today
            </button>
            <button
              onClick={() => setPresetDates("week")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F7F4EE] hover:bg-[#EEE7DA] text-[#362A22]"
            >
              Last 7D
            </button>
            <button
              onClick={() => setPresetDates("month")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F7F4EE] hover:bg-[#EEE7DA] text-[#362A22]"
            >
              Last 30D
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => setPresetDates("all")}
                className="text-[10px] font-semibold px-2 py-1 rounded text-rose-600 hover:bg-rose-50 flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Room Number & Text Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Room Number Filter */}
          <div className="relative w-32">
            <BedDouble className="w-3.5 h-3.5 text-[#79695B] absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Room #"
              value={roomNumber}
              onChange={(e) => {
                setRoomNumber(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs border-[#E3D9CA]"
            />
          </div>

          {/* General Text Search */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#79695B] absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search by name, code, ref..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs border-[#E3D9CA]"
            />
          </div>
        </div>
      </div>

      {/* 
      =======================================================================
      REGISTER DATA TABLE (Tailored columns for all 13 registers)
      =======================================================================
      */}
      <Card className="border-[#E3D9CA] shadow-sm overflow-hidden print:border-none print:shadow-none bg-white">
        <CardHeader className="bg-[#F7F4EE] border-b border-[#E3D9CA] py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#362A22] flex items-center gap-2">
                <span>{currentMeta.label}</span>
                <span className="text-xs font-normal text-[#79695B]">({currentMeta.subtitle})</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#79695B]">
                Showing {items.length} of {total} total digital ledger records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#79695B]">Grand Horizon Hotel Official Register</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-2">
              <LoadingSpinner className="w-7 h-7 text-[#B08A60]" />
              <span className="text-xs text-[#79695B]">Querying digital ledger records...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#79695B] space-y-1">
              <AlertCircle className="w-8 h-8 text-[#B08A60] mx-auto opacity-60 mb-2" />
              <p className="font-semibold text-[#362A22]">No entries found in {currentMeta.label}</p>
              <p className="text-[11px] text-[#948779]">
                Try adjusting your search query, clearing the date range, or removing the room number filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                {/* 
                ===============================================================
                TABLE HEADERS
                ===============================================================
                */}
                <thead className="bg-[#F7F4EE] text-[#5D493D] uppercase text-[10px] font-bold border-b border-[#E3D9CA] tracking-wider">
                  <tr>
                    {/* 1. GUEST REGISTER */}
                    {activeRegister === "guests" && (
                      <>
                        <th className="px-4 py-3">Guest Code</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Mobile Contact</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">City / Address</th>
                        <th className="px-4 py-3">ID Document</th>
                        <th className="px-4 py-3">Stay History</th>
                        <th className="px-4 py-3">Enrolled At</th>
                      </>
                    )}

                    {/* 2. CHECK-IN REGISTER */}
                    {activeRegister === "check-ins" && (
                      <>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Guest Details</th>
                        <th className="px-4 py-3">Room Allocated</th>
                        <th className="px-4 py-3">Check-In Date & Time</th>
                        <th className="px-4 py-3">Expected Check-Out</th>
                        <th className="px-4 py-3">Stay Duration</th>
                        <th className="px-4 py-3">Tariff / Night</th>
                        <th className="px-4 py-3">Advance Payment</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}

                    {/* 3. CHECK-OUT REGISTER */}
                    {activeRegister === "check-outs" && (
                      <>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Guest Details</th>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Actual Check-Out</th>
                        <th className="px-4 py-3">Nights</th>
                        <th className="px-4 py-3">Room Charges</th>
                        <th className="px-4 py-3">Additional Items</th>
                        <th className="px-4 py-3">Taxes & Disc.</th>
                        <th className="px-4 py-3">Total Bill</th>
                        <th className="px-4 py-3">Advance / Payments</th>
                        <th className="px-4 py-3">Remaining Balance</th>
                      </>
                    )}

                    {/* 4. ROOM REGISTER */}
                    {activeRegister === "rooms" && (
                      <>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Room Type / Category</th>
                        <th className="px-4 py-3">Floor</th>
                        <th className="px-4 py-3">Tariff / Night</th>
                        <th className="px-4 py-3">Room Status</th>
                        <th className="px-4 py-3">Current Occupant</th>
                        <th className="px-4 py-3">Housekeeping</th>
                      </>
                    )}

                    {/* 5. GUEST BILLING REGISTER */}
                    {activeRegister === "billing" && (
                      <>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Room Charges</th>
                        <th className="px-4 py-3">Services & Items</th>
                        <th className="px-4 py-3">Tax (GST)</th>
                        <th className="px-4 py-3">Total Billed</th>
                        <th className="px-4 py-3">Total Paid</th>
                        <th className="px-4 py-3">Balance Due</th>
                        <th className="px-4 py-3">Invoice Status</th>
                      </>
                    )}

                    {/* 6. PAYMENT REGISTER */}
                    {activeRegister === "payments" && (
                      <>
                        <th className="px-4 py-3">Payment Ref</th>
                        <th className="px-4 py-3">Transaction / UTR</th>
                        <th className="px-4 py-3">Booking Ref</th>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Channel / Method</th>
                        <th className="px-4 py-3">Payment Type</th>
                        <th className="px-4 py-3">Amount Received</th>
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}

                    {/* 7. DAILY CASH BOOK */}
                    {activeRegister === "cash-book" && (
                      <>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Flow Type</th>
                        <th className="px-4 py-3">Transaction Category</th>
                        <th className="px-4 py-3">Voucher Reference</th>
                        <th className="px-4 py-3">Party Name (Guest/Vendor/Staff)</th>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Cash Inflow (+)</th>
                        <th className="px-4 py-3">Cash Outflow (−)</th>
                        <th className="px-4 py-3">Remarks / Summary</th>
                      </>
                    )}

                    {/* 8. SERVICE REGISTER */}
                    {activeRegister === "services" && (
                      <>
                        <th className="px-4 py-3">Purchase Date & Time</th>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Room Allocated</th>
                        <th className="px-4 py-3">Item / Service Name</th>
                        <th className="px-4 py-3">Service Category</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Unit Tariff</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Linked Booking</th>
                      </>
                    )}

                    {/* 9. STAFF REGISTER */}
                    {activeRegister === "staff" && (
                      <>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Mobile Contact</th>
                        <th className="px-4 py-3">Joining Date</th>
                        <th className="px-4 py-3">Monthly Basic Wage</th>
                        <th className="px-4 py-3">Bank Details</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}

                    {/* 10. ATTENDANCE REGISTER */}
                    {activeRegister === "attendance" && (
                      <>
                        <th className="px-4 py-3">Attendance Date</th>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Staff Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Muster Status</th>
                        <th className="px-4 py-3">Check-In Time</th>
                        <th className="px-4 py-3">Check-Out Time</th>
                        <th className="px-4 py-3">Working Hours</th>
                        <th className="px-4 py-3">Overtime</th>
                      </>
                    )}

                    {/* 11. SALARY REGISTER */}
                    {activeRegister === "salaries" && (
                      <>
                        <th className="px-4 py-3">Payroll Period</th>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Staff Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Basic Wage</th>
                        <th className="px-4 py-3">Payable Days</th>
                        <th className="px-4 py-3">Overtime Pay</th>
                        <th className="px-4 py-3">Deductions & Advances</th>
                        <th className="px-4 py-3">Net Payable</th>
                        <th className="px-4 py-3">Disbursed</th>
                        <th className="px-4 py-3">Balance Due</th>
                      </>
                    )}

                    {/* 12. EXPENSE REGISTER */}
                    {activeRegister === "expenses" && (
                      <>
                        <th className="px-4 py-3">Expense Voucher</th>
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Expense Category</th>
                        <th className="px-4 py-3">Description / Payee</th>
                        <th className="px-4 py-3">Payment Channel</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Notes</th>
                      </>
                    )}

                    {/* 13. DAILY BUSINESS REGISTER */}
                    {activeRegister === "business" && (
                      <>
                        <th className="px-4 py-3">Business Date</th>
                        <th className="px-4 py-3">Occupied Rooms</th>
                        <th className="px-4 py-3">Check-Ins</th>
                        <th className="px-4 py-3">Check-Outs</th>
                        <th className="px-4 py-3">Room Revenue</th>
                        <th className="px-4 py-3">Services Revenue</th>
                        <th className="px-4 py-3">Total Gross Revenue</th>
                        <th className="px-4 py-3">Total Daily Expenses</th>
                        <th className="px-4 py-3">Net Operating Profit</th>
                        <th className="px-4 py-3">Cash vs Digital</th>
                      </>
                    )}
                  </tr>
                </thead>

                {/* 
                ===============================================================
                TABLE BODY
                ===============================================================
                */}
                <tbody className="divide-y divide-[#EAE3D8]">
                  {items.map((row: any) => (
                    <tr key={row.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                      {/* 1. GUEST REGISTER */}
                      {activeRegister === "guests" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-[#B08A60]">{row.guestCode}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.fullName}</td>
                          <td className="px-4 py-3 text-[#79695B] font-mono">{row.mobileNumber}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.email || "-"}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.city || row.address || "-"}</td>
                          <td className="px-4 py-3 text-[#79695B]">
                            {row.documents && row.documents.length > 0 ? (
                              <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                                {row.documents[0].documentType}: {row.documents[0].documentNumber}
                              </span>
                            ) : (
                              <span className="text-[#948779]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#362A22]">
                            {row._count?.stayHistory || 0} Stays
                          </td>
                          <td className="px-4 py-3 text-[#948779]">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </td>
                        </>
                      )}

                      {/* 2. CHECK-IN REGISTER */}
                      {activeRegister === "check-ins" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-[#B08A60]">{row.bookingNumber}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#362A22] block">{row.guestName}</span>
                            <span className="text-[11px] text-[#79695B] font-mono">{row.guestMobile}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#362A22]">
                            Room {row.roomNumber} ({row.roomType})
                          </td>
                          <td className="px-4 py-3 text-[#5D493D]">
                            <span className="font-medium block">{new Date(row.checkInDate).toLocaleDateString()}</span>
                            <span className="text-[10px] text-[#79695B] font-mono">{row.checkInTime}</span>
                          </td>
                          <td className="px-4 py-3 text-[#79695B]">
                            <span>{new Date(row.expectedCheckOutDate).toLocaleDateString()}</span>
                            <span className="text-[10px] block font-mono">{row.expectedCheckOutTime}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#362A22]">{row.numberOfNights} Nights</td>
                          <td className="px-4 py-3 font-mono font-semibold">₹{Number(row.roomPricePerNight)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                            ₹{Number(row.advancePayment).toLocaleString()}
                            <span className="text-[9px] text-[#79695B] block font-sans">({row.advancePaymentMethod})</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                              {row.bookingStatus}
                            </Badge>
                          </td>
                        </>
                      )}

                      {/* 3. CHECK-OUT REGISTER */}
                      {activeRegister === "check-outs" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-[#B08A60]">{row.bookingNumber}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#362A22] block">{row.guestName}</span>
                            <span className="text-[11px] text-[#79695B] font-mono">{row.guestMobile}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#362A22]">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 text-[#5D493D]">
                            <span className="font-medium block">{new Date(row.actualCheckOutDate).toLocaleDateString()}</span>
                            <span className="text-[10px] text-[#79695B] font-mono">{row.actualCheckOutTime}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold">{row.totalNumberOfNights}N</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.roomCharges).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-700">₹{Number(row.additionalItemCharges).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">
                            +₹{Number(row.tax)} / -₹{Number(row.discount)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.totalBillAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">
                            ₹{(Number(row.advancePayment) + Number(row.additionalPayments)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">
                            {Number(row.remainingPayment) > 0 ? `₹${Number(row.remainingPayment).toLocaleString()}` : "Settled (₹0)"}
                          </td>
                        </>
                      )}

                      {/* 4. ROOM REGISTER */}
                      {activeRegister === "rooms" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-sm text-[#362A22]">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 text-[#79695B] font-medium">{row.roomType}</td>
                          <td className="px-4 py-3">Floor {row.floor}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.pricePerNight).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                row.roomStatus === "AVAILABLE"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : row.roomStatus === "OCCUPIED"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300"
                              }`}
                            >
                              {row.roomStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.currentGuest}</td>
                          <td className="px-4 py-3 text-[#79695B] text-[11px]">{row.cleanlinessStatus}</td>
                        </>
                      )}

                      {/* 5. GUEST BILLING REGISTER */}
                      {activeRegister === "billing" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-[#B08A60]">{row.invoiceNumber}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.bookingNumber}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.guestName}</td>
                          <td className="px-4 py-3 font-bold text-[#362A22]">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.roomCharges).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-700">₹{Number(row.additionalCharges).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">₹{Number(row.taxAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.totalAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-emerald-700">₹{Number(row.totalPaid).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">₹{Number(row.balanceAmount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {row.invoiceStatus}
                            </Badge>
                          </td>
                        </>
                      )}

                      {/* 6. PAYMENT REGISTER */}
                      {activeRegister === "payments" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-[#B08A60]">{row.paymentReference}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#79695B]">{row.transactionReference}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.bookingNumber}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.guestName}</td>
                          <td className="px-4 py-3 font-bold text-[#362A22]">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">
                            <span className="bg-[#EEE7DA] px-2 py-0.5 rounded text-[11px]">{row.paymentMethod}</span>
                          </td>
                          <td className="px-4 py-3 text-[#79695B]">{row.paymentType}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">₹{Number(row.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[#79695B]">{new Date(row.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                              {row.paymentStatus}
                            </Badge>
                          </td>
                        </>
                      )}

                      {/* 7. DAILY CASH BOOK */}
                      {activeRegister === "cash-book" && (
                        <>
                          <td className="px-4 py-3 font-mono text-[#5D493D]">
                            <span className="font-semibold block">{new Date(row.date).toLocaleDateString()}</span>
                            <span className="text-[10px] text-[#79695B]">{row.time}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                row.flowType === "INFLOW"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {row.flowType === "INFLOW" ? "+ CASH IN" : "− CASH OUT"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.category}</td>
                          <td className="px-4 py-3 font-mono font-medium text-[#B08A60]">{row.reference}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.partyName}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{row.roomNumber !== "-" ? `Room ${row.roomNumber}` : "-"}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                            {row.flowType === "INFLOW" ? `₹${Number(row.amount).toLocaleString()}` : "-"}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-rose-700">
                            {row.flowType === "OUTFLOW" ? `₹${Number(row.amount).toLocaleString()}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-[#79695B] truncate max-w-xs">{row.description}</td>
                        </>
                      )}

                      {/* 8. SERVICE REGISTER */}
                      {activeRegister === "services" && (
                        <>
                          <td className="px-4 py-3 font-mono text-[#5D493D]">
                            <span className="font-semibold block">{new Date(row.purchaseDate).toLocaleDateString()}</span>
                            <span className="text-[10px] text-[#79695B]">{row.purchaseTime}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.guestName}</td>
                          <td className="px-4 py-3 font-bold text-[#362A22]">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 font-semibold text-[#362A22]">{row.itemName}</td>
                          <td className="px-4 py-3 text-[#79695B]">
                            <span className="bg-[#EEE7DA] px-2 py-0.5 rounded text-[11px]">{row.category}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-center">{row.quantity}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">₹{Number(row.price).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">₹{Number(row.totalAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#B08A60]">{row.bookingNumber}</td>
                        </>
                      )}

                      {/* 9. STAFF REGISTER */}
                      {activeRegister === "staff" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-[#B08A60]">{row.employeeId}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.fullName}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.department}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.designation}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.mobileNumber}</td>
                          <td className="px-4 py-3 text-[#79695B]">{new Date(row.joiningDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.monthlySalary).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[11px] text-[#79695B] truncate max-w-xs">{row.bankDetails}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                              {row.employmentStatus}
                            </Badge>
                          </td>
                        </>
                      )}

                      {/* 10. ATTENDANCE REGISTER */}
                      {activeRegister === "attendance" && (
                        <>
                          <td className="px-4 py-3 font-mono text-[#5D493D] font-medium">{new Date(row.attendanceDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-mono text-[#B08A60] font-semibold">{row.employeeId}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.staffName}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.department}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                row.attendanceStatus === "PRESENT"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : row.attendanceStatus === "ABSENT"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {row.attendanceStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.checkInTime}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.checkOutTime}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{row.workingHours}h</td>
                          <td className="px-4 py-3 font-mono text-amber-700 font-bold">
                            {row.overtimeHours > 0 ? `+${row.overtimeHours}h OT` : "-"}
                          </td>
                        </>
                      )}

                      {/* 11. SALARY REGISTER */}
                      {activeRegister === "salaries" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-[#B08A60]">{row.payrollPeriod}</td>
                          <td className="px-4 py-3 font-mono text-[#79695B]">{row.employeeId}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">{row.staffName}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.department}</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.monthlyBasicSalary).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-center">{row.payableDays}D</td>
                          <td className="px-4 py-3 font-mono text-emerald-700">₹{Number(row.overtimeAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-rose-700">
                            -₹{(Number(row.salaryAdvances) + Number(row.otherDeductions)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.finalPayableSalary).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-emerald-700">₹{Number(row.totalDisbursed).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">₹{Number(row.remainingBalance).toLocaleString()}</td>
                        </>
                      )}

                      {/* 12. EXPENSE REGISTER */}
                      {activeRegister === "expenses" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-[#B08A60]">{row.expenseReference}</td>
                          <td className="px-4 py-3 text-[#79695B]">{new Date(row.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-[#362A22]">
                            <span className="bg-[#EEE7DA] px-2 py-0.5 rounded text-[11px]">{row.categoryName}</span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#362A22] truncate max-w-xs">{row.description}</td>
                          <td className="px-4 py-3 text-[#79695B]">{row.paymentMethod}</td>
                          <td className="px-4 py-3 font-mono font-bold text-rose-700">₹{Number(row.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[11px] text-[#79695B]">{row.notes}</td>
                        </>
                      )}

                      {/* 13. DAILY BUSINESS REGISTER */}
                      {activeRegister === "business" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">{row.date}</td>
                          <td className="px-4 py-3 font-semibold text-[#362A22]">
                            {row.occupiedRooms} Rooms ({row.occupancyRate}%)
                          </td>
                          <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{row.checkIns} In</td>
                          <td className="px-4 py-3 font-mono text-amber-700 font-bold">{row.checkOuts} Out</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.roomRevenue).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-700">₹{Number(row.serviceRevenue).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#362A22]">₹{Number(row.totalRevenue).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-rose-700">₹{Number(row.totalExpenses).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                            ₹{Number(row.netOperatingProfit).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-mono">
                            <span className="text-emerald-700 font-semibold">C: ₹{Number(row.cashCollected)}</span> |{" "}
                            <span className="text-[#B08A60] font-semibold">D: ₹{Number(row.digitalCollected)}</span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-[#EAE3D8] flex items-center justify-between text-xs text-[#79695B] bg-[#F7F4EE]/50">
              <span>
                Showing page <strong className="text-[#362A22]">{page}</strong> of <strong className="text-[#362A22]">{totalPages}</strong> ({total} total entries)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-3 text-xs border-[#E3D9CA] hover:bg-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-3 text-xs border-[#E3D9CA] hover:bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
