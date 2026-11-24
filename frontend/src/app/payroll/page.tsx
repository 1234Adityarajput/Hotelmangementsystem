"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  User,
  CreditCard,
  TrendingDown,
  Layers,
  Calculator,
  CheckCheck,
  Building,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Wallet,
  Receipt,
  Download,
} from "lucide-react";
import { payrollService, PayrollStats } from "@/services/payroll.service";
import { staffService } from "@/services/staff.service";
import { attendanceService } from "@/services/attendance.service";
import { SalaryRecord, SalaryPayment, Staff } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEPARTMENTS = [
  "ALL",
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Kitchen & Culinary",
  "Maintenance & Engineering",
  "Security",
  "Administration",
  "Accounts & Finance",
  "Spa & Wellness",
];

export default function PayrollPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "payments" | "report">("register");

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [bulkGenerateModalOpen, setBulkGenerateModalOpen] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Single Generate Form with live calculation
  const [genForm, setGenForm] = useState({
    staffId: "",
    payrollMonth: currentDate.getMonth() + 1,
    payrollYear: currentDate.getFullYear(),
    configuredSalaryDays: 30,
    payableDays: 30,
    deductions: 0,
    advanceDeductions: 0,
  });

  // Bulk Generate Form
  const [bulkGenForm, setBulkGenForm] = useState({
    payrollMonth: currentDate.getMonth() + 1,
    payrollYear: currentDate.getFullYear(),
    configuredSalaryDays: 30,
    department: "ALL",
    autoDeductAdvances: true,
  });

  // Disburse Form
  const [disburseForm, setDisburseForm] = useState({
    paymentAmount: 0,
    paymentMethod: "BANK_TRANSFER" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionReference: "",
    notes: "",
  });

  // Fetch all live payroll data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, statsRes, staffRes] = await Promise.all([
        payrollService.findAll({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          limit: 100,
        }).catch((e) => {
          console.warn("Payroll findAll error:", e);
          return { items: [], total: 0, page: 1, limit: 100, totalPages: 1 };
        }),
        payrollService.getStats(selectedMonth, selectedYear).catch(() => null),
        staffService.findAll({ employmentStatus: "ACTIVE", limit: 100 }).catch(() => ({ items: [] })),
      ]);

      setRecords(recRes.items || []);
      setStats(statsRes);
      setStaffList(staffRes.items || []);
      if (staffRes.items && staffRes.items.length > 0 && !genForm.staffId) {
        setGenForm((prev) => ({ ...prev, staffId: staffRes.items[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load payroll records from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, statusFilter]);

  // Handle Month Navigation
  const handleMonthShift = (delta: number) => {
    let nextMonth = selectedMonth + delta;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  const handleOpenGenerate = () => {
    if (staffList.length > 0) {
      setGenForm({
        staffId: staffList[0].id,
        payrollMonth: selectedMonth,
        payrollYear: selectedYear,
        configuredSalaryDays: 30,
        payableDays: 30,
        deductions: 0,
        advanceDeductions: 0,
      });
    }
    setGenerateModalOpen(true);
  };

  const handleOpenDisburse = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setDisburseForm({
      paymentAmount: Number(record.balanceAmount),
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date().toISOString().split("T")[0],
      transactionReference: "",
      notes: `Salary payment for ${MONTHS[record.payrollMonth - 1]} ${record.payrollYear}`,
    });
    setDisburseModalOpen(true);
  };

  const handleOpenSlip = async (id: string) => {
    try {
      const rec = await payrollService.findOne(id);
      setSelectedRecord(rec);
      setSlipModalOpen(true);
    } catch (err) {
      toast.error("Could not fetch salary slip details");
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genForm.staffId) {
      toast.error("Please select a staff member");
      return;
    }
    try {
      setSubmitting(true);
      await payrollService.generatePayroll({
        ...genForm,
        configuredSalaryDays: Number(genForm.configuredSalaryDays),
        payableDays: Number(genForm.payableDays),
        deductions: Number(genForm.deductions),
        advanceDeductions: Number(genForm.advanceDeductions),
      });
      toast.success("Salary slip generated successfully!");
      setGenerateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate payroll slip");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await payrollService.generateAllPayroll({
        payrollMonth: bulkGenForm.payrollMonth,
        payrollYear: bulkGenForm.payrollYear,
        configuredSalaryDays: Number(bulkGenForm.configuredSalaryDays),
        department: bulkGenForm.department !== "ALL" ? bulkGenForm.department : undefined,
        autoDeductAdvances: bulkGenForm.autoDeductAdvances,
      });
      toast.success(
        `Generated ${res.generatedCount} salary slips! (${res.skippedCount} already existed/skipped)`,
      );
      setBulkGenerateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process bulk payroll generation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setSubmitting(true);
      await payrollService.recordSalaryPayment({
        salaryRecordId: selectedRecord.id,
        paymentAmount: Number(disburseForm.paymentAmount),
        paymentMethod: disburseForm.paymentMethod,
        paymentDate: disburseForm.paymentDate,
        transactionReference: disburseForm.transactionReference,
        notes: disburseForm.notes,
      });
      toast.success("Salary disbursement recorded successfully!");
      setDisburseModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected Staff info for Live Single Generation Preview
  const selectedStaffForGen = staffList.find((s) => s.id === genForm.staffId);
  const monthlySalary = selectedStaffForGen ? Number(selectedStaffForGen.monthlySalary) : 0;
  const configuredDays = Number(genForm.configuredSalaryDays) || 30;
  const payableDays = Number(genForm.payableDays) || 0;
  const perDaySalary = configuredDays > 0 ? monthlySalary / configuredDays : 0;
  const earnedBasic = Math.round(perDaySalary * payableDays * 100) / 100;
  const totalDeductions = Number(genForm.deductions || 0) + Number(genForm.advanceDeductions || 0);
  const liveNetSalary = Math.max(0, Math.round((earnedBasic - totalDeductions) * 100) / 100);

  // Filtered Records
  const filteredRecords = records.filter((rec) => {
    if (departmentFilter !== "ALL" && rec.staff?.department !== departmentFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      rec.staff?.fullName.toLowerCase().includes(s) ||
      rec.staff?.employeeCode.toLowerCase().includes(s) ||
      rec.staff?.department.toLowerCase().includes(s) ||
      rec.staff?.designation.toLowerCase().includes(s)
    );
  });

  // All Payments aggregated from records
  const allPayments = records.flatMap((r) =>
    (r.salaryPayments || []).map((p) => ({
      ...p,
      staff: r.staff,
      payrollMonth: r.payrollMonth,
      payrollYear: r.payrollYear,
    })),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4A06A] bg-[#F5F0EA] px-2.5 py-0.5 rounded-full">
              Workforce Operations • Module 11
            </span>
            <span className="text-xs text-[#82747A]">• Automated Salary & Payslips</span>
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#59283A] mt-1">
            Staff Salary & Payroll Management
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
            Automatic salary computation based on attendance records, advance recoveries, payment ledger, and individual payslips.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => {
              setBulkGenForm((prev) => ({
                ...prev,
                payrollMonth: selectedMonth,
                payrollYear: selectedYear,
              }));
              setBulkGenerateModalOpen(true);
            }}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 text-xs h-9 px-3.5 shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Calculate All Salaries</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenGenerate}
            className="bg-[#C4A06A] hover:bg-[#97734C] text-white flex items-center gap-1.5 text-xs h-9 px-3.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Generate Single Slip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A]"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Salary Calculation Logic & Exact Formulas Banner */}
      <div className="p-4 bg-white rounded-xl border border-[#E8DDD8] shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C4A06A]" />
          <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#59283A]">
            Standard Salary Calculation Logic & Formulations
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
            <span className="text-[10px] uppercase font-bold text-[#82747A] block">1. Per Day Salary</span>
            <div className="font-mono text-[11px] font-semibold text-[#59283A] mt-0.5">
              Monthly Basic Salary ÷ Configured Salary Days
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">e.g. ₹30,000 ÷ 30 days = ₹1,000 / day</p>
          </div>

          <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
            <span className="text-[10px] uppercase font-bold text-[#82747A] block">2. Earned Salary</span>
            <div className="font-mono text-[11px] font-semibold text-[#59283A] mt-0.5">
              Per Day Salary × Payable Attendance Days
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Present + (Half Day × 0.5) + Paid Leaves + Offs</p>
          </div>

          <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
            <span className="text-[10px] uppercase font-bold text-[#82747A] block">3. Final Net Payable</span>
            <div className="font-mono text-[11px] font-semibold text-emerald-800 mt-0.5">
              Earned Salary + Overtime − Deductions − Advances
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Net balance settled via Bank Transfer or Cash</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("register")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "register"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Monthly Payroll Register</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "payments"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Disbursement History Ledger ({allPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "report"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Executive Payroll Summary</span>
          </button>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthShift(-1)}
            className="h-8 w-8 p-0 border-[#E8DDD8]"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#82747A]" />
          </Button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-8 text-xs font-semibold border border-[#E8DDD8] rounded-md px-2 bg-[#F5F0EA] text-[#59283A]"
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 text-xs font-mono font-semibold border border-[#E8DDD8] rounded-md px-2 bg-[#F5F0EA] text-[#59283A]"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthShift(1)}
            className="h-8 w-8 p-0 border-[#E8DDD8]"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#82747A]" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Total Net Payable
            </CardTitle>
            <Banknote className="w-4 h-4 text-[#C4A06A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#59283A]">
              ₹{(stats?.totalNetPayable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#82747A] mt-1">{MONTHS[selectedMonth - 1]} {selectedYear} obligations</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-sm bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Total Disbursed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-emerald-700">
              ₹{(stats?.totalPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Disbursed via bank / cash</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Remaining Balance Due
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-amber-700">
              ₹{(stats?.totalBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-amber-600 mt-1">Unsettled salary liabilities</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Advances Recovered
            </CardTitle>
            <Wallet className="w-4 h-4 text-[#C4A06A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#59283A]">
              ₹
              {records
                .reduce((sum, r) => sum + Number(r.advanceDeductions || 0), 0)
                .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#82747A] mt-1">Deducted from payroll</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Settlement Status
            </CardTitle>
            <Clock className="w-4 h-4 text-[#C4A06A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#59283A]">
              {stats?.statusCounts?.PAID || 0} / {records.length}
            </div>
            <p className="text-[11px] text-[#82747A] mt-1">
              {stats?.statusCounts?.FINALIZED || 0} Pending Settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MONTHLY PAYROLL REGISTER                                           */}
      {/* ========================================================================= */}
      {activeTab === "register" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#82747A]">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs border border-[#E8DDD8] rounded-md px-2.5 py-1.5 bg-[#F5F0EA] text-[#59283A] focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-[#82747A] ml-2">Status:</span>
              {["ALL", "FINALIZED", "PAID"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-[#59283A] text-white font-semibold"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#82747A] absolute left-2.5 top-2.5" />
              <Input
                type="text"
                placeholder="Search employee, ID, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs border-[#E8DDD8]"
              />
            </div>
          </div>

          {/* Salary Records Table */}
          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner className="w-8 h-8 text-[#C4A06A] mb-2" />
                  <span className="text-xs text-[#82747A]">Loading payroll slips from database...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A] space-y-3">
                  <Banknote className="w-10 h-10 text-[#C4A06A] mx-auto opacity-40" />
                  <p className="text-sm font-serif font-semibold text-[#59283A]">
                    No payroll slips generated for {MONTHS[selectedMonth - 1]} {selectedYear}
                  </p>
                  <p className="max-w-md mx-auto">
                    Click &quot;Calculate All Salaries&quot; to auto-generate payroll slips based on attendance records.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setBulkGenForm((prev) => ({
                        ...prev,
                        payrollMonth: selectedMonth,
                        payrollYear: selectedYear,
                      }));
                      setBulkGenerateModalOpen(true);
                    }}
                    className="bg-[#59283A] hover:bg-[#472130] text-white text-xs"
                  >
                    <Calculator className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                    <span>Auto-Calculate Payroll Now</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Dept & Role</th>
                        <th className="px-4 py-3">Basic Salary</th>
                        <th className="px-4 py-3">Attendance Days</th>
                        <th className="px-4 py-3">Overtime</th>
                        <th className="px-4 py-3">Earned Gross</th>
                        <th className="px-4 py-3">Deductions</th>
                        <th className="px-4 py-3">Net Payable</th>
                        <th className="px-4 py-3">Balance Due</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-[#59283A]">
                            <div className="font-semibold">{rec.staff?.fullName}</div>
                            <div className="text-[11px] text-[#C4A06A] font-mono">
                              {rec.staff?.employeeCode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#59283A]">{rec.staff?.designation}</div>
                            <div className="text-[11px] text-[#82747A]">{rec.staff?.department}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-[#59283A]">
                            ₹{Number(rec.monthlyBasicSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-[#59283A]">
                              {Number(rec.payableDays)} / {rec.configuredSalaryDays}d
                            </div>
                            <div className="text-[10px] text-[#82747A]">
                              P: {Number(rec.presentDays)} • A: {Number(rec.absentDays)} • L: {Number(rec.paidLeaves)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {Number(rec.overtimeHours) > 0 ? (
                              <div>
                                <span className="text-amber-700 font-bold">
                                  ₹{Number(rec.overtimeAmount).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-[#82747A] block">
                                  ({Number(rec.overtimeHours)}h OT)
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#8E7079]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#59283A]">
                            ₹{Number(rec.grossSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono text-rose-600">
                            <div>
                              ₹{(Number(rec.deductions) + Number(rec.advanceDeductions)).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {Number(rec.advanceDeductions) > 0 && (
                              <div className="text-[10px] text-[#82747A]">
                                Adv: ₹{Number(rec.advanceDeductions)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-800 text-sm">
                            ₹{Number(rec.netSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">
                            ₹{Number(rec.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${
                                rec.payrollStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {rec.payrollStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            {Number(rec.balanceAmount) > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenDisburse(rec)}
                                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                title="Disburse Salary"
                              >
                                <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSlip(rec.id)}
                              className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A] hover:bg-[#EFE8E0]"
                              title="View Salary Slip & Print"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Slip
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISBURSEMENT HISTORY LEDGER                                        */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-4 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-serif font-bold text-[#59283A]">
                Salary Payment Disbursements Ledger
              </CardTitle>
              <CardDescription className="text-xs text-[#82747A]">
                Complete audit ledger of all salary payments released across staff for {MONTHS[selectedMonth - 1]} {selectedYear}.
              </CardDescription>
            </div>
            <span className="font-mono text-xs font-bold text-[#59283A]">
              Total Released: ₹{stats?.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {allPayments.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-[#C4A06A] opacity-40" />
                <p className="font-semibold text-[#59283A]">No salary payments disbursed yet this month.</p>
                <p>Click &quot;Pay&quot; on any finalized salary record to record disbursement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-4 py-3">Receipt Ref</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Disbursement Date</th>
                      <th className="px-4 py-3">Payment Channel</th>
                      <th className="px-4 py-3">Bank Reference</th>
                      <th className="px-4 py-3">Amount Released</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {allPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#C4A06A]">
                          {p.paymentReference}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#59283A]">
                          <div className="font-semibold">{p.staff?.fullName}</div>
                          <div className="text-[11px] text-[#82747A] font-mono">{p.staff?.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#59283A]">
                          {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-mono text-[#59283A] bg-[#F5F0EA]">
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#82747A]">
                          {p.transactionReference || "Direct Cash / Counter"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 text-sm">
                          ₹{Number(p.paymentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-[#82747A] max-w-[200px] truncate">
                          {p.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXECUTIVE PAYROLL SUMMARY REPORT                                    */}
      {/* ========================================================================= */}
      {activeTab === "report" && (
        <div className="space-y-4">
          <Card className="border-[#E8DDD8] shadow-sm bg-white">
            <CardHeader className="p-4 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#59283A]">
                  Department-Wise Payroll Distribution
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  Financial allocation across operational hotel wings for {MONTHS[selectedMonth - 1]} {selectedYear}.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs border-[#E8DDD8]"
              >
                <Printer className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Print Summary
              </Button>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.filter((d) => d !== "ALL").map((dept) => {
                  const deptRecords = records.filter((r) => r.staff?.department === dept);
                  if (deptRecords.length === 0) return null;

                  const deptGross = deptRecords.reduce((sum, r) => sum + Number(r.grossSalary), 0);
                  const deptNet = deptRecords.reduce((sum, r) => sum + Number(r.netSalary), 0);
                  const deptPaid = deptRecords.reduce((sum, r) => sum + Number(r.totalPaid), 0);
                  const deptBal = deptRecords.reduce((sum, r) => sum + Number(r.balanceAmount), 0);

                  return (
                    <div
                      key={dept}
                      className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-[#E8DDD8] pb-1.5">
                        <span className="font-serif font-bold text-sm text-[#59283A]">{dept}</span>
                        <Badge variant="outline" className="text-[10px] bg-white text-[#82747A]">
                          {deptRecords.length} Staff
                        </Badge>
                      </div>

                      <div className="space-y-1 text-[#82747A]">
                        <div className="flex justify-between">
                          <span>Gross Salary:</span>
                          <span className="font-mono text-[#59283A]">₹{deptGross.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Net Payable:</span>
                          <span className="font-mono text-emerald-800">₹{deptNet.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Disbursed:</span>
                          <span className="font-mono text-emerald-600">₹{deptPaid.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-amber-700 font-semibold border-t border-[#E8DDD8] pt-1">
                          <span>Balance Due:</span>
                          <span className="font-mono">₹{deptBal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE SALARY SLIP CALCULATION MODAL (WITH LIVE FORMULA PREVIEW)          */}
      {/* ========================================================================= */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-xl bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Payroll Module • Formula Calculation Engine
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Calculate & Generate Salary Slip
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Calculates staff salary based on monthly wage, attendance days, overtime hours, and allows deduction adjustments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateSubmit} className="space-y-4 pt-2 text-xs">
            {/* Employee Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select Staff Member *</label>
              <select
                required
                value={genForm.staffId}
                onChange={(e) => setGenForm({ ...genForm, staffId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeCode}) • Base: ₹{Number(s.monthlySalary).toLocaleString("en-IN")} • {s.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payroll Month *</label>
                <select
                  value={genForm.payrollMonth}
                  onChange={(e) => setGenForm({ ...genForm, payrollMonth: Number(e.target.value) })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payroll Year *</label>
                <Input
                  type="number"
                  value={genForm.payrollYear}
                  onChange={(e) => setGenForm({ ...genForm, payrollYear: Number(e.target.value) })}
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Days Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">
                  Configured Salary Days <span className="text-[10px] text-[#82747A]">(Formula Divisor)</span>
                </label>
                <Input
                  type="number"
                  min="20"
                  max="31"
                  required
                  value={genForm.configuredSalaryDays}
                  onChange={(e) => setGenForm({ ...genForm, configuredSalaryDays: Number(e.target.value) })}
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">
                  Payable Attendance Days <span className="text-[10px] text-[#82747A]">(Multiplier)</span>
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  required
                  value={genForm.payableDays}
                  onChange={(e) => setGenForm({ ...genForm, payableDays: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold text-[#59283A] border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Deductions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Other Deductions (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={genForm.deductions}
                  onChange={(e) => setGenForm({ ...genForm, deductions: Number(e.target.value) })}
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Salary Advance Recovery (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={genForm.advanceDeductions}
                  onChange={(e) => setGenForm({ ...genForm, advanceDeductions: Number(e.target.value) })}
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2">
              <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#59283A] block">
                Live Formula Calculation Breakdown
              </span>
              <div className="space-y-1 text-xs text-[#82747A]">
                <div className="flex justify-between">
                  <span>Monthly Base Salary:</span>
                  <span className="font-mono text-[#59283A]">₹{monthlySalary.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Per Day Salary (Base ÷ {configuredDays}d):</span>
                  <span className="font-mono text-[#59283A]">₹{perDaySalary.toFixed(2)} / day</span>
                </div>
                <div className="flex justify-between">
                  <span>Earned Basic ({payableDays} payable days):</span>
                  <span className="font-mono font-bold text-[#59283A]">₹{earnedBasic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Deductions (Other + Advance):</span>
                  <span className="font-mono">- ₹{totalDeductions.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 border-t border-[#E8DDD8] pt-1.5 text-sm">
                  <span>Estimated Net Payable:</span>
                  <span className="font-mono">₹{liveNetSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGenerateModalOpen(false)}
                className="text-xs border-[#E8DDD8]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs"
              >
                {submitting ? "Calculating..." : "Generate Official Slip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* BULK CALCULATE ALL SALARIES MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={bulkGenerateModalOpen} onOpenChange={setBulkGenerateModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C4A06A]" />
              <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
                Auto-Calculate All Staff Salaries
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#82747A]">
              Calculates salaries for all active employees for {MONTHS[bulkGenForm.payrollMonth - 1]} {bulkGenForm.payrollYear} using attendance records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkGenerateSubmit} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Target Department</label>
              <select
                value={bulkGenForm.department}
                onChange={(e) => setBulkGenForm({ ...bulkGenForm, department: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Active Hotel Staff" : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Configured Monthly Salary Days (Divisor)</label>
              <Input
                type="number"
                min="20"
                max="31"
                required
                value={bulkGenForm.configuredSalaryDays}
                onChange={(e) => setBulkGenForm({ ...bulkGenForm, configuredSalaryDays: Number(e.target.value) })}
                className="h-8 text-xs font-mono border-[#E8DDD8]"
              />
            </div>

            <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] text-xs text-[#82747A] space-y-1">
              <span className="font-bold text-[#59283A] block">Automated Features Applied:</span>
              <p>• Auto-reads monthly attendance (Present, Absent, Half Day, Leave, Weekly Off)</p>
              <p>• Auto-calculates overtime hours at 1.5x hourly standard rate</p>
              <p>• Automatically checks and recovers pending staff salary advances</p>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkGenerateModalOpen(false)}
                className="text-xs border-[#E8DDD8]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs"
              >
                {submitting ? "Processing Payroll..." : "Calculate All Salaries Now"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DISBURSE PAYMENT MODAL                                                    */}
      {/* ========================================================================= */}
      <Dialog open={disburseModalOpen} onOpenChange={setDisburseModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
              Record Salary Disbursement
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Employee: {selectedRecord?.staff?.fullName} • {selectedRecord ? `${MONTHS[selectedRecord.payrollMonth - 1]} ${selectedRecord.payrollYear}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisburseSubmit} className="space-y-3.5 pt-2 text-xs">
            <div className="p-3 bg-[#F5F0EA] rounded-xl space-y-1.5 border border-[#E8DDD8]">
              <div className="flex justify-between text-[#82747A]">
                <span>Net Salary Payable:</span>
                <span className="font-mono font-semibold text-[#59283A]">
                  ₹{Number(selectedRecord?.netSalary || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#82747A]">
                <span>Already Disbursed:</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  ₹{Number(selectedRecord?.totalPaid || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-[#59283A] border-t border-[#E8DDD8] pt-1">
                <span>Outstanding Balance:</span>
                <span className="font-mono text-amber-700">
                  ₹{Number(selectedRecord?.balanceAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Amount (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  max={Number(selectedRecord?.balanceAmount || 1)}
                  step="100"
                  required
                  value={disburseForm.paymentAmount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, paymentAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Disbursement Date *</label>
                <Input
                  type="date"
                  required
                  value={disburseForm.paymentDate}
                  onChange={(e) => setDisburseForm({ ...disburseForm, paymentDate: e.target.value })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Payment Method *</label>
              <select
                value={disburseForm.paymentMethod}
                onChange={(e) => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value as any })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Transaction Reference / UTR</label>
              <Input
                value={disburseForm.transactionReference}
                onChange={(e) => setDisburseForm({ ...disburseForm, transactionReference: e.target.value })}
                placeholder="NEFT-UTR-12345 or Cheque #"
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDisburseModalOpen(false)}
                className="text-xs border-[#E8DDD8]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {submitting ? "Processing..." : "Confirm Disbursement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* OFFICIAL SALARY PAYSLIP PREVIEW & PRINT MODAL                              */}
      {/* ========================================================================= */}
      <Dialog open={slipModalOpen} onOpenChange={setSlipModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
                  Official Employee Payslip
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Formal payroll statement for official employee remuneration and tax records.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#C4A06A]" />
                <span>Print / Download PDF</span>
              </Button>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div className="p-6 border border-[#E8DDD8] rounded-xl space-y-5 text-xs font-sans bg-white print:border-none print:p-0">
              {/* Hotel Header */}
              <div className="text-center pb-4 border-b border-[#E8DDD8]">
                <h3 className="text-xl font-serif font-bold text-[#59283A] tracking-wider uppercase">
                  Grand Horizon Boutique Luxury Hotel
                </h3>
                <p className="text-[11px] text-[#82747A] mt-0.5">
                  100 Beach Road, Luxury Promenade • accounts@grandhorizon.com • +91 98765 43210
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-[#F5F0EA] rounded border border-[#E8DDD8]">
                  <span className="font-bold text-[#59283A] text-xs uppercase tracking-wider">
                    Payslip for the Period of {MONTHS[selectedRecord.payrollMonth - 1]} {selectedRecord.payrollYear}
                  </span>
                </div>
              </div>

              {/* Employee & Bank Dossier */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#82747A] uppercase font-bold block">Employee Information</span>
                  <div className="font-bold text-sm text-[#59283A]">{selectedRecord.staff?.fullName}</div>
                  <div className="text-[11px] font-mono text-[#C4A06A]">ID: {selectedRecord.staff?.employeeCode}</div>
                  <div className="text-[11px] text-[#82747A]">{selectedRecord.staff?.designation}</div>
                  <div className="text-[11px] text-[#82747A]">Dept: {selectedRecord.staff?.department}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#82747A] uppercase font-bold block">Bank & Remuneration Mode</span>
                  <div className="text-[11px] text-[#59283A]">
                    <span className="text-[#82747A]">Account Holder:</span>{" "}
                    <strong>{selectedRecord.staff?.bankAccountHolder || selectedRecord.staff?.fullName}</strong>
                  </div>
                  <div className="text-[11px] text-[#59283A] font-mono">
                    <span className="text-[#82747A]">Account No:</span>{" "}
                    <strong>{selectedRecord.staff?.bankAccountNumber || "Not set"}</strong>
                  </div>
                  <div className="text-[11px] text-[#59283A] font-mono">
                    <span className="text-[#82747A]">IFSC Code:</span>{" "}
                    <strong>{selectedRecord.staff?.bankIfscCode || "Not set"}</strong>
                  </div>
                  <div className="text-[11px] text-[#59283A] font-mono">
                    <span className="text-[#82747A]">Payable Days:</span>{" "}
                    <strong>{Number(selectedRecord.payableDays)} / {selectedRecord.configuredSalaryDays} Days</strong>
                  </div>
                </div>
              </div>

              {/* Attendance Details Row */}
              <div className="grid grid-cols-5 gap-2 p-3 bg-white rounded-lg border border-[#E8DDD8] text-center">
                <div>
                  <span className="text-[10px] text-[#82747A] block font-semibold">Present Days</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">{Number(selectedRecord.presentDays)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#82747A] block font-semibold">Absent Days</span>
                  <span className="font-bold font-mono text-rose-700 text-sm">{Number(selectedRecord.absentDays)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#82747A] block font-semibold">Half Days</span>
                  <span className="font-bold font-mono text-amber-700 text-sm">{Number(selectedRecord.halfDays)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#82747A] block font-semibold">Paid Leaves</span>
                  <span className="font-bold font-mono text-blue-700 text-sm">{Number(selectedRecord.paidLeaves)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#82747A] block font-semibold">Overtime</span>
                  <span className="font-bold font-mono text-amber-800 text-sm">{Number(selectedRecord.overtimeHours)}h</span>
                </div>
              </div>

              {/* Earnings & Deductions Dual Grid */}
              <div className="grid grid-cols-2 gap-4 border border-[#E8DDD8] rounded-xl overflow-hidden">
                <div className="p-4 border-r border-[#E8DDD8] space-y-2 bg-white">
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#59283A] block border-b border-[#E8DDD8] pb-1.5">
                    Earnings
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Monthly Basic Rate:</span>
                    <span className="font-mono">₹{Number(selectedRecord.monthlyBasicSalary).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Earned Basic ({Number(selectedRecord.payableDays)}d):</span>
                    <span className="font-mono font-medium">
                      ₹{((Number(selectedRecord.monthlyBasicSalary) / selectedRecord.configuredSalaryDays) * Number(selectedRecord.payableDays)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Overtime Pay ({Number(selectedRecord.overtimeHours)}h):</span>
                    <span className="font-mono font-medium text-emerald-700">
                      ₹{Number(selectedRecord.overtimeAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-[#E8DDD8] pt-2 text-[#59283A]">
                    <span>Total Gross Salary:</span>
                    <span className="font-mono">₹{Number(selectedRecord.grossSalary).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2 bg-white">
                  <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#59283A] block border-b border-[#E8DDD8] pb-1.5">
                    Deductions & Recoveries
                  </span>
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Statutory / Other Deductions:</span>
                    <span className="font-mono">₹{Number(selectedRecord.deductions).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Salary Advance Recovery:</span>
                    <span className="font-mono text-rose-600">₹{Number(selectedRecord.advanceDeductions).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-[#E8DDD8] pt-2 text-[#59283A]">
                    <span>Total Deductions:</span>
                    <span className="font-mono text-rose-600">
                      ₹{(Number(selectedRecord.deductions) + Number(selectedRecord.advanceDeductions)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Box */}
              <div className="p-4 bg-[#F5F0EA] border border-[#E8DDD8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#82747A] block">Final Payable Net Salary</span>
                  <span className="text-xs text-[#82747A]">Take-home amount for the month</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-serif text-[#59283A]">
                    ₹{Number(selectedRecord.netSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Disbursement History in Slip */}
              {selectedRecord.salaryPayments && selectedRecord.salaryPayments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[#59283A] text-[11px] block uppercase tracking-wider">
                    Disbursement Payment Receipts
                  </span>
                  <div className="divide-y divide-[#E8DDD8] border border-[#E8DDD8] rounded-lg overflow-hidden">
                    {selectedRecord.salaryPayments.map((p) => (
                      <div key={p.id} className="p-2.5 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-mono font-bold text-[#59283A]">{p.paymentReference}</span>
                          <span className="text-[#82747A] ml-2">
                            ({p.paymentMethod} • {new Date(p.paymentDate).toLocaleDateString()})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{Number(p.paymentAmount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Blocks for Formal Print */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-[#82747A] border-t border-[#E8DDD8]">
                <div>
                  <div className="border-b border-[#59283A] w-40 mx-auto pb-6"></div>
                  <span className="block mt-1 font-semibold text-[#59283A]">Employee Signature</span>
                </div>
                <div>
                  <div className="border-b border-[#59283A] w-40 mx-auto pb-6"></div>
                  <span className="block mt-1 font-semibold text-[#59283A]">Authorized Hotel Signatory</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-[#E8DDD8] print:hidden">
            <Button variant="outline" size="sm" onClick={() => setSlipModalOpen(false)}>
              Close Payslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
