"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  Calendar,
  Filter,
  Printer,
  Download,
  Building,
  DollarSign,
  Receipt,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileText,
  Clock,
  UserCheck,
  Briefcase,
  Layers,
  RefreshCw,
  BookOpen,
  Hotel,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  reportsService,
  ExecutiveReportData,
  ReportTypesCatalog,
  ReportResponse,
  ReportTypeItem,
  ReportColumn,
} from "@/services/reports.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"executive" | "hotel" | "staff">("executive");
  const [catalog, setCatalog] = useState<ReportTypesCatalog | null>(null);

  // Selected report in sub-categories
  const [selectedReportId, setSelectedReportId] = useState<string>("daily-revenue");
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Executive summary data
  const [executiveData, setExecutiveData] = useState<ExecutiveReportData | null>(null);
  const [executiveLoading, setExecutiveLoading] = useState(false);

  // Date filters
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [searchQuery, setSearchQuery] = useState("");

  // Load report catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const cat = await reportsService.getReportTypes();
        setCatalog(cat);
      } catch (err) {
        console.error("Failed to load report catalog", err);
      }
    }
    loadCatalog();
  }, []);

  // Fetch executive report
  const fetchExecutiveReport = async () => {
    try {
      setExecutiveLoading(true);
      const res = await reportsService.getExecutiveReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setExecutiveData(res);
    } catch (err) {
      toast.error("Failed to load executive reports and analytics");
    } finally {
      setExecutiveLoading(false);
    }
  };

  // Fetch specific report
  const fetchSpecificReport = async (reportId: string) => {
    try {
      setReportLoading(true);
      const res = await reportsService.generateReport(reportId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchQuery || undefined,
      });
      setReportData(res);
    } catch (err) {
      toast.error(`Failed to generate ${reportId} report`);
    } finally {
      setReportLoading(false);
    }
  };

  // Trigger data fetching based on active view and date range
  useEffect(() => {
    if (activeTab === "executive") {
      fetchExecutiveReport();
    } else {
      fetchSpecificReport(selectedReportId);
    }
  }, [activeTab, selectedReportId, startDate, endDate]);

  // Handle Tab switch
  const handleTabChange = (tab: "executive" | "hotel" | "staff") => {
    setActiveTab(tab);
    if (tab === "hotel" && (!catalog?.hotelReports.some((r) => r.id === selectedReportId))) {
      setSelectedReportId("daily-revenue");
    } else if (tab === "staff" && (!catalog?.staffReports.some((r) => r.id === selectedReportId))) {
      setSelectedReportId("staff-information");
    }
  };

  const applyPreset = (preset: "today" | "week" | "month" | "year") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
    } else if (preset === "year") {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(`${today.getFullYear()}-12-31`);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // CSV Export function
  const handleExportCSV = () => {
    if (activeTab === "executive" && executiveData) {
      // Export executive metrics
      const lines = [
        "Executive Analytics & Performance Summary",
        `Date Range,${startDate} to ${endDate}`,
        "",
        "Metric,Value",
        `Total Rooms,${executiveData.operations.totalRooms}`,
        `Available Rooms,${executiveData.operations.availableRooms}`,
        `Occupied Rooms,${executiveData.operations.occupiedRooms}`,
        `Occupancy Rate,${executiveData.operations.occupancyRate}%`,
        `Total Collected Revenue,INR ${executiveData.financials.totalCollectedRevenue}`,
        `Total Operating Expenses,INR ${executiveData.financials.totalOperatingExpenses}`,
        `Total Payroll Disbursed,INR ${executiveData.financials.totalPayrollDisbursed}`,
        `Net Cash Flow,INR ${executiveData.financials.netCashFlow}`,
        `Total Invoiced,INR ${executiveData.financials.totalInvoiced}`,
        `Outstanding Receivables,INR ${executiveData.financials.totalOutstandingReceivables}`,
      ];

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Executive_Analytics_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Executive Analytics report exported to CSV");
      return;
    }

    if (!reportData || !reportData.columns || reportData.columns.length === 0) {
      toast.error("No report data available to export");
      return;
    }

    const headers = reportData.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const rows = filteredRows.map((row) =>
      reportData.columns
        .map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportData.reportType}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${reportData.reportTitle} exported to CSV`);
  };

  // Filter rows locally if search input has value
  const filteredRows = useMemo(() => {
    if (!reportData?.rows) return [];
    if (!searchQuery.trim()) return reportData.rows;

    const q = searchQuery.toLowerCase().trim();
    return reportData.rows.filter((row) =>
      Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [reportData?.rows, searchQuery]);

  // Format cell value based on column definition
  const formatCellValue = (val: any, col: ReportColumn) => {
    if (val === null || val === undefined || val === "") return <span className="text-[#8E7079]">—</span>;

    if (col.type === "currency") {
      const num = Number(val);
      return (
        <span className="font-mono font-semibold text-[#59283A]">
          ₹{isNaN(num) ? val : num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      );
    }

    if (col.type === "badge") {
      const strVal = String(val).toUpperCase();
      let badgeStyle = "bg-[#F5F0EA] text-[#82747A] border-[#E8DDD8]";
      if (strVal === "COMPLETED" || strVal === "PAID" || strVal === "PRESENT" || strVal === "ACTIVE" || strVal === "AVAILABLE") {
        badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (strVal === "PENDING" || strVal === "PARTIAL" || strVal === "HALF_DAY") {
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
      } else if (strVal === "CANCELLED" || strVal === "ABSENT" || strVal === "UNPAID" || strVal === "TERMINATED") {
        badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
      } else if (strVal === "OCCUPIED" || strVal === "CONFIRMED") {
        badgeStyle = "bg-[#59283A] text-[#F5F0EA] border-[#59283A]";
      }
      return (
        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${badgeStyle}`}>
          {String(val)}
        </Badge>
      );
    }

    if (col.type === "date") {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return <span className="text-xs text-[#7A4652]">{d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>;
        }
      } catch (e) {
        // fall through
      }
    }

    return <span className="text-xs text-[#59283A]">{String(val)}</span>;
  };

  // Helper icons for specific reports
  const getReportIcon = (id: string) => {
    switch (id) {
      case "daily-revenue":
      case "weekly-revenue":
      case "monthly-revenue":
      case "yearly-revenue":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "room-occupancy":
        return <Building className="w-3.5 h-3.5" />;
      case "guest-history":
        return <Users className="w-3.5 h-3.5" />;
      case "check-ins":
      case "check-outs":
        return <Clock className="w-3.5 h-3.5" />;
      case "guest-billing":
        return <Receipt className="w-3.5 h-3.5" />;
      case "payment-collections":
      case "pending-payments":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "hotel-expenses":
        return <DollarSign className="w-3.5 h-3.5" />;
      case "income-expense-summary":
        return <BarChart3 className="w-3.5 h-3.5" />;
      case "staff-information":
        return <Briefcase className="w-3.5 h-3.5" />;
      case "daily-attendance":
      case "monthly-attendance":
        return <UserCheck className="w-3.5 h-3.5" />;
      case "employee-salary":
      case "salary-payment-history":
      case "monthly-payroll-summary":
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Editorial Luxury Print Letterhead (visible ONLY when printed) */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-[#59283A]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-serif font-black tracking-widest text-[#59283A] uppercase">
              THE GRAND HORIZON
            </h1>
            <p className="text-xs font-mono text-[#82747A] tracking-wider uppercase mt-0.5">
              Luxury Hotel & Executive Suites • Official Audit Dossier
            </p>
          </div>
          <div className="text-right text-xs font-mono text-[#82747A]">
            <div>Generated: {new Date().toLocaleString("en-IN")}</div>
            <div>Period: {startDate} to {endDate}</div>
          </div>
        </div>
        <div className="mt-4 pt-2 border-t border-[#E8DDD8]">
          <h2 className="text-lg font-bold text-[#59283A]">
            {activeTab === "executive" ? "Executive Analytics & Financial Performance Report" : reportData?.reportTitle}
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
            {activeTab === "executive" ? "Aggregated hotel operations, revenue collections, operating expenses, and cash flow analysis." : reportData?.description}
          </p>
        </div>
      </div>

      {/* Page Header (Screen only) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#F5F0EA] text-[#82747A] border border-[#E8DDD8]">
              Module 15 • Intelligence & Audit
            </span>
            <span className="text-xs text-[#8E7079]">• 19 Certified Ledgers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#59283A]">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#82747A] mt-1">
            Real-time hotel operations, guest ledgers, revenue inflows, staff payroll, and financial intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5 bg-white text-[#59283A] border-[#E8DDD8] hover:bg-[#F5F0EA]"
          >
            <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Export Excel / CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center gap-1.5 bg-white text-[#59283A] border-[#E8DDD8] hover:bg-[#F5F0EA]"
          >
            <Printer className="w-3.5 h-3.5 text-[#59283A]" />
            <span>Print Report / PDF</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (activeTab === "executive") fetchExecutiveReport();
              else fetchSpecificReport(selectedReportId);
              toast.success("Report data refreshed");
            }}
            className="text-xs flex items-center gap-1.5 bg-[#59283A] text-[#F5F0EA] hover:bg-[#381926]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation (Screen only) */}
      <div className="print:hidden flex items-center gap-1.5 p-1 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
        <button
          onClick={() => handleTabChange("executive")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "executive"
              ? "bg-[#59283A] text-[#F5F0EA] shadow-sm"
              : "text-[#82747A] hover:text-[#59283A] hover:bg-[#E8DDD8]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => handleTabChange("hotel")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "hotel"
              ? "bg-[#59283A] text-[#F5F0EA] shadow-sm"
              : "text-[#82747A] hover:text-[#59283A] hover:bg-[#E8DDD8]"
          }`}
        >
          <Hotel className="w-4 h-4" />
          <span>Hotel Reports (13)</span>
        </button>

        <button
          onClick={() => handleTabChange("staff")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "staff"
              ? "bg-[#59283A] text-[#F5F0EA] shadow-sm"
              : "text-[#82747A] hover:text-[#59283A] hover:bg-[#E8DDD8]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Reports (6)</span>
        </button>
      </div>

      {/* Sub-Category Report Selector Pills (When Hotel or Staff is active) */}
      {activeTab !== "executive" && catalog && (
        <div className="print:hidden bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#82747A] px-1">
            <span>
              Select {activeTab === "hotel" ? "Hotel Report" : "Staff Report"} (
              {activeTab === "hotel" ? catalog.hotelReports.length : catalog.staffReports.length} Available)
            </span>
            <span className="text-[11px] text-[#C4A06A] font-normal">Click a report ledger below to view</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(activeTab === "hotel" ? catalog.hotelReports : catalog.staffReports).map((item) => {
              const isSelected = selectedReportId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedReportId(item.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-[#59283A] text-[#F5F0EA] border-[#59283A] font-semibold shadow-sm"
                      : "bg-[#F5F0EA] text-[#7A4652] border-[#E8DDD8] hover:bg-[#F2ECE1] hover:border-[#E8DDD8]"
                  }`}
                  title={item.description}
                >
                  <span className={isSelected ? "text-[#C4A06A]" : "text-[#82747A]"}>
                    {getReportIcon(item.id)}
                  </span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Universal Date Range & Search Filter Bar */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#82747A]">
            <Calendar className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Date Range:</span>
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs w-36 bg-[#F5F0EA] border-[#E8DDD8]"
          />
          <span className="text-xs text-[#8E7079]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs w-36 bg-[#F5F0EA] border-[#E8DDD8]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("today")}
            className="h-7 text-xs bg-[#F5F0EA] border-[#E8DDD8] text-[#7A4652] hover:bg-[#F2ECE1]"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("week")}
            className="h-7 text-xs bg-[#F5F0EA] border-[#E8DDD8] text-[#7A4652] hover:bg-[#F2ECE1]"
          >
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("month")}
            className="h-7 text-xs bg-[#F5F0EA] border-[#E8DDD8] text-[#7A4652] hover:bg-[#F2ECE1]"
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("year")}
            className="h-7 text-xs bg-[#F5F0EA] border-[#E8DDD8] text-[#7A4652] hover:bg-[#F2ECE1]"
          >
            Year-to-Date
          </Button>

          {activeTab !== "executive" && (
            <div className="relative ml-2">
              <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search ledger records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 w-44 sm:w-56 bg-[#F5F0EA] border-[#E8DDD8]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. EXECUTIVE OVERVIEW VIEW                                */}
      {/* ========================================================= */}
      {activeTab === "executive" && (
        <>
          {executiveLoading ? (
            <div className="p-16 flex justify-center items-center">
              <LoadingSpinner
                size="lg"
                text="Compiling Executive Intelligence..."
                subtext="Aggregating hotel operations, revenue collections, and cash flow..."
              />
            </div>
          ) : executiveData ? (
            <div className="space-y-6">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
                      Revenue Collected
                    </CardTitle>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 font-mono">
                      ₹{Number(executiveData.financials.totalCollectedRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-[#8E7079] mt-1">
                      {executiveData.financials.inflowTransactionsCount} completed transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
                      Operating Expenses
                    </CardTitle>
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-rose-600 font-mono">
                      ₹{Number(executiveData.financials.totalOperatingExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-[#8E7079] mt-1">
                      {executiveData.financials.expenseTransactionsCount} operational disbursements
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
                      Payroll Disbursed
                    </CardTitle>
                    <Users className="w-4 h-4 text-[#C4A06A]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#59283A] font-mono">
                      ₹{Number(executiveData.financials.totalPayrollDisbursed).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-[#8E7079] mt-1">
                      {executiveData.staff.activeStaffCount} active staff members
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
                      Net Operating Cash Flow
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-[#C4A06A]" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold font-mono ${
                        executiveData.financials.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      ₹{Number(executiveData.financials.netCashFlow).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-[#8E7079] mt-1">
                      Revenue minus expenses & payroll
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Operations & Occupancy Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-[#E8DDD8]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-bold text-[#59283A]">
                        Room Occupancy & Inventory Status
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono border-[#E8DDD8] bg-[#F5F0EA] text-[#7A4652]">
                        Rate: {executiveData.operations.occupancyRate}%
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#82747A]">
                      Total property inventory: {executiveData.operations.totalRooms} rooms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-xl font-bold text-emerald-700 block">
                          {executiveData.operations.availableRooms}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium">Available</span>
                      </div>
                      <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                        <span className="text-xl font-bold text-[#59283A] block">
                          {executiveData.operations.occupiedRooms}
                        </span>
                        <span className="text-[11px] text-[#C4A06A] font-medium">Occupied</span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-xl font-bold text-amber-700 block">
                          {executiveData.operations.maintenanceRooms}
                        </span>
                        <span className="text-[11px] text-amber-600 font-medium">Maintenance</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-[#7A4652] block">Occupancy by Room Category</span>
                      {executiveData.operations.roomTypeOccupancy.map((rt) => (
                        <div key={rt.roomTypeName} className="space-y-1">
                          <div className="flex justify-between text-xs text-[#82747A]">
                            <span className="font-medium text-[#59283A]">{rt.roomTypeName}</span>
                            <span className="font-mono">
                              {rt.occupiedRooms}/{rt.totalRooms} ({rt.occupancyRate}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#F5F0EA] h-2 rounded-full overflow-hidden border border-[#E8DDD8]">
                            <div
                              className="bg-[#59283A] h-2 rounded-full transition-all"
                              style={{ width: `${rt.occupancyRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#E8DDD8] shadow-sm bg-white">
                  <CardHeader className="pb-3 border-b border-[#E8DDD8]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-bold text-[#59283A]">
                        Billing, Taxes & Inflow Collections
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono border-[#E8DDD8] bg-[#F5F0EA] text-[#7A4652]">
                        Total Invoiced: ₹{Number(executiveData.financials.totalInvoiced).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-[#82747A]">
                      Guest folios and settlement channel breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                        <span className="text-[#8E7079] text-[10px] uppercase font-semibold block">
                          Outstanding Receivables
                        </span>
                        <span className="text-lg font-bold font-mono text-amber-600">
                          ₹{Number(executiveData.financials.totalOutstandingReceivables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                        <span className="text-[#8E7079] text-[10px] uppercase font-semibold block">
                          Taxes Collected (GST)
                        </span>
                        <span className="text-lg font-bold font-mono text-[#59283A]">
                          ₹{Number(executiveData.financials.totalTaxCollected).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#7A4652] block">Payment Collections by Channel</span>
                      <div className="divide-y divide-[#E8DDD8] border border-[#E8DDD8] rounded-lg overflow-hidden text-xs">
                        {executiveData.financials.paymentsByMethod.map((pm) => (
                          <div key={pm.method} className="p-2.5 flex justify-between items-center bg-white hover:bg-[#F5F0EA]">
                            <span className="font-semibold text-[#59283A]">{pm.method} ({pm.count} txns)</span>
                            <span className="font-mono font-bold text-emerald-700">
                              ₹{Number(pm.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses by Category Breakdown */}
              <Card className="border-[#E8DDD8] shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-[#E8DDD8]">
                  <CardTitle className="text-sm font-bold text-[#59283A]">
                    Operating Expenses Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs text-[#82747A]">
                    Hotel disbursements by category (Electricity, Water, Groceries, Maintenance, Staff, Operations)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {executiveData.financials.expensesByCategory.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8E7079]">
                      No operating expenses recorded in the selected date range.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {executiveData.financials.expensesByCategory.map((ec) => (
                        <div key={ec.category} className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] text-xs">
                          <span className="font-bold text-[#59283A] block text-sm">{ec.category}</span>
                          <span className="text-[11px] text-[#8E7079] block mb-2">{ec.count} expense receipts</span>
                          <span className="font-mono font-bold text-rose-600 text-base">
                            ₹{Number(ec.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </>
      )}

      {/* ========================================================= */}
      {/* 2. SPECIFIC REPORT LEDGER VIEW (Hotel & Staff)            */}
      {/* ========================================================= */}
      {activeTab !== "executive" && (
        <div className="space-y-6">
          {reportLoading ? (
            <div className="p-16 flex justify-center items-center">
              <LoadingSpinner
                size="lg"
                text="Compiling Ledger Audit Records..."
                subtext="Retrieving verified database rows for selected report period..."
              />
            </div>
          ) : reportData ? (
            <>
              {/* Selected Report Header Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8DDD8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#F5F0EA] text-[#C4A06A] border border-[#E8DDD8]">
                      {getReportIcon(reportData.reportType)}
                    </span>
                    <h2 className="text-xl font-serif font-bold text-[#59283A]">
                      {reportData.reportTitle}
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase bg-[#F5F0EA] text-[#82747A] border-[#E8DDD8]">
                      {reportData.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#82747A] max-w-2xl">
                    {reportData.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#82747A] border-t md:border-t-0 md:border-l border-[#E8DDD8] pt-2 md:pt-0 md:pl-4">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-[#8E7079]">Audit Period</span>
                    <span className="font-mono font-medium text-[#59283A]">
                      {reportData.dateRange?.startDate} to {reportData.dateRange?.endDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-semibold text-[#8E7079]">Matched Rows</span>
                    <span className="font-mono font-bold text-[#59283A]">
                      {filteredRows.length} / {reportData.rows?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic KPI Metric Strip */}
              {reportData.kpis && Object.keys(reportData.kpis).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(reportData.kpis).map(([key, val]) => {
                    const isCurrency = typeof val === "number" && (key.toLowerCase().includes("revenue") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("salary") || key.toLowerCase().includes("expense") || key.toLowerCase().includes("balance") || key.toLowerCase().includes("paid") || key.toLowerCase().includes("invoiced"));
                    return (
                      <div
                        key={key}
                        className="bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm text-center flex flex-col justify-center"
                      >
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8E7079] truncate" title={key}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-mono text-[#59283A] mt-0.5 truncate">
                          {isCurrency
                            ? `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`
                            : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ledger Data Table */}
              <div className="bg-white rounded-xl border border-[#E8DDD8] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F5F0EA] border-b border-[#E8DDD8] text-[11px] font-bold text-[#7A4652] uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center text-[#8E7079]">#</th>
                        {reportData.columns.map((col) => (
                          <th key={col.key} className="py-3 px-4 font-semibold">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8] text-xs">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={reportData.columns.length + 1}
                            className="py-12 text-center text-[#8E7079]"
                          >
                            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[#C4A06A]" />
                            <span className="block font-medium">No records found for this period.</span>
                            <span className="text-[11px]">Try adjusting the date range or clearing the search query.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => (
                          <tr
                            key={row.id || idx}
                            className="hover:bg-[#F5F0EA]/60 transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-mono text-[11px] text-[#8E7079]">
                              {idx + 1}
                            </td>
                            {reportData.columns.map((col) => (
                              <td key={col.key} className="py-3 px-4">
                                {formatCellValue(row[col.key], col)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-3 bg-[#F5F0EA] border-t border-[#E8DDD8] flex items-center justify-between text-xs text-[#82747A]">
                  <span className="font-medium">
                    Showing {filteredRows.length} of {reportData.rows?.length || 0} records
                  </span>
                  <span className="text-[11px] font-mono text-[#8E7079]">
                    Grand Horizon Audit Engine • Compliant
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-xs text-[#8E7079]">
              Select a report from the menu above to generate records.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
