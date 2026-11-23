"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { reportsService, ExecutiveReportData } from "@/services/reports.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function ReportsPage() {
  const [data, setData] = useState<ExecutiveReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getExecutiveReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error("Failed to load executive reports and analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const applyPreset = (preset: "today" | "month" | "year") => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
    } else if (preset === "year") {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(`${now.getFullYear()}-12-31`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Reports & Executive Analytics
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Aggregated hotel operations, revenue collections, operating expenses, and cash flow analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center gap-1.5 bg-white text-[#5D493D]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report / PDF</span>
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E3D9CA] shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[#79695B] mr-1">Date Range:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs w-36"
          />
          <span className="text-xs text-[#948779]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs w-36"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => applyPreset("today")} className="h-7 text-xs">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("month")} className="h-7 text-xs">
            This Month
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyPreset("year")} className="h-7 text-xs">
            Year-to-Date
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <LoadingSpinner className="w-8 h-8 text-[#B08A60]" />
        </div>
      ) : data ? (
        <>
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
                  Revenue Collected
                </CardTitle>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 font-mono">
                  ₹{Number(data.financials.totalCollectedRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[#948779] mt-1">
                  {data.financials.inflowTransactionsCount} completed payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
                  Operating Expenses
                </CardTitle>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 font-mono">
                  ₹{Number(data.financials.totalOperatingExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[#948779] mt-1">
                  {data.financials.expenseTransactionsCount} expense items paid
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
                  Payroll Disbursed
                </CardTitle>
                <Users className="w-4 h-4 text-[#B08A60]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#362A22] font-mono">
                  ₹{Number(data.financials.totalPayrollDisbursed).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[#948779] mt-1">
                  {data.staff.activeStaffCount} active employees
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
                  Net Operating Cash Flow
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-[#B08A60]" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${data.financials.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  ₹{Number(data.financials.netCashFlow).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-[#948779] mt-1">Revenue minus expenses & payroll</p>
              </CardContent>
            </Card>
          </div>

          {/* Operations & Occupancy Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-[#EAE3D8]">
                <CardTitle className="text-sm font-bold text-[#362A22]">
                  Room Occupancy & Operational Status
                </CardTitle>
                <CardDescription className="text-xs text-[#79695B]">
                  Total inventory: {data.operations.totalRooms} rooms across all categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-xl font-bold text-emerald-700 block">{data.operations.availableRooms}</span>
                    <span className="text-[11px] text-emerald-600 font-medium">Available</span>
                  </div>
                  <div className="p-3 bg-[#FAF6F0] rounded-lg border border-indigo-100">
                    <span className="text-xl font-bold text-[#362A22] block">{data.operations.occupiedRooms}</span>
                    <span className="text-[11px] text-[#B08A60] font-medium">Occupied</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-xl font-bold text-amber-700 block">{data.operations.maintenanceRooms}</span>
                    <span className="text-[11px] text-amber-600 font-medium">Maintenance</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#5D493D] block">Occupancy by Room Category</span>
                  {data.operations.roomTypeOccupancy.map((rt) => (
                    <div key={rt.roomTypeName} className="space-y-1">
                      <div className="flex justify-between text-xs text-[#79695B]">
                        <span className="font-medium">{rt.roomTypeName}</span>
                        <span className="font-mono">{rt.occupiedRooms}/{rt.totalRooms} ({rt.occupancyRate}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#362A22] h-2 rounded-full transition-all"
                          style={{ width: `${rt.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-[#EAE3D8]">
                <CardTitle className="text-sm font-bold text-[#362A22]">
                  Billing, Taxes & Inflow Collections
                </CardTitle>
                <CardDescription className="text-xs text-[#79695B]">
                  Total invoiced billings: ₹{Number(data.financials.totalInvoiced).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[#948779] text-[10px] uppercase font-semibold block">Outstanding Receivables</span>
                    <span className="text-lg font-bold font-mono text-amber-600">
                      ₹{Number(data.financials.totalOutstandingReceivables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[#948779] text-[10px] uppercase font-semibold block">Taxes Collected</span>
                    <span className="text-lg font-bold font-mono text-[#362A22]">
                      ₹{Number(data.financials.totalTaxCollected).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#5D493D] block">Payment Collections by Channel</span>
                  <div className="divide-y divide-[#EAE3D8] border border-[#E3D9CA] rounded-lg overflow-hidden text-xs">
                    {data.financials.paymentsByMethod.map((pm) => (
                      <div key={pm.method} className="p-2.5 flex justify-between items-center">
                        <span className="font-semibold text-[#362A22]">{pm.method} ({pm.count} txns)</span>
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
          <Card className="border-[#E3D9CA] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[#EAE3D8]">
              <CardTitle className="text-sm font-bold text-[#362A22]">
                Operating Expenses by Category
              </CardTitle>
              <CardDescription className="text-xs text-[#79695B]">
                Breakdown of operational costs incurred during the period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {data.financials.expensesByCategory.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#948779]">
                  No expenses recorded in the selected date range.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.financials.expensesByCategory.map((ec) => (
                    <div key={ec.category} className="p-3 bg-[#F7F4EE] rounded-xl border border-[#EAE3D8] text-xs">
                      <span className="font-bold text-[#362A22] block text-sm">{ec.category}</span>
                      <span className="text-[11px] text-[#948779] block mb-2">{ec.count} expense receipts</span>
                      <span className="font-mono font-bold text-rose-600 text-base">
                        ₹{Number(ec.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
