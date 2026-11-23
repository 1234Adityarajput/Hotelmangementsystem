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
} from "lucide-react";
import { payrollService, PayrollStats } from "@/services/payroll.service";
import { staffService } from "@/services/staff.service";
import { SalaryRecord, Staff } from "@/types";
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

export default function PayrollPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Generate form
  const [genForm, setGenForm] = useState({
    staffId: "",
    payrollMonth: currentDate.getMonth() + 1,
    payrollYear: currentDate.getFullYear(),
    configuredSalaryDays: 30,
    payableDays: 30,
    deductions: 0,
    advanceDeductions: 0,
  });

  // Disburse form
  const [disburseForm, setDisburseForm] = useState({
    paymentAmount: 0,
    paymentMethod: "BANK_TRANSFER" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionReference: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, statsRes, staffRes] = await Promise.all([
        payrollService.findAll({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          limit: 50,
        }),
        payrollService.getStats(selectedMonth, selectedYear),
        staffService.findAll({ employmentStatus: "ACTIVE", limit: 100 }),
      ]);
      setRecords(recRes.items);
      setStats(statsRes);
      setStaffList(staffRes.items);
      if (staffRes.items.length > 0 && !genForm.staffId) {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Payroll & Salary Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process monthly payroll, attendance-based salary calculations, advance deductions, and disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenGenerate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Salary Slip</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Net Payable ({MONTHS[selectedMonth - 1]})
            </CardTitle>
            <Banknote className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ₹{(stats?.totalNetPayable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total approved salary obligations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Salary Disbursed
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{(stats?.totalPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Disbursed via bank / cash</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Remaining Balance
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              ₹{(stats?.totalBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Outstanding salary payable</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Slip Settlement
            </CardTitle>
            <Clock className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.statusCounts?.PAID || 0} / {records.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.statusCounts?.FINALIZED || 0} Pending Payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 ml-2">Status:</span>
          {["ALL", "FINALIZED", "PAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Salary Records Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No salary records found for {MONTHS[selectedMonth - 1]} {selectedYear}. Click &quot;Generate Salary Slip&quot; to calculate salary.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Payable Days</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Net Salary</th>
                    <th className="px-4 py-3">Balance Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{rec.staff?.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.staff?.employeeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{rec.staff?.designation}</div>
                        <div className="text-[11px] text-slate-400">{rec.staff?.department}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {Number(rec.payableDays)} / {rec.configuredSalaryDays}d
                        {Number(rec.overtimeHours) > 0 && (
                          <span className="text-amber-600 block text-[10px]">
                            +{Number(rec.overtimeHours)}h OT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        ₹{Number(rec.grossSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-600">
                        ₹{(Number(rec.deductions) + Number(rec.advanceDeductions)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {Number(rec.advanceDeductions) > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            (Adv: ₹{Number(rec.advanceDeductions)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        ₹{Number(rec.netSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-600">
                        ₹{Number(rec.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
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
                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                            title="Disburse Salary"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSlip(rec.id)}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Salary Slip & Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {/* Generate Salary Slip Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Generate Monthly Salary Slip
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Calculates salary based on attendance records, overtime hours, and allows advance deduction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Employee *</label>
              <select
                required
                value={genForm.staffId}
                onChange={(e) => setGenForm({ ...genForm, staffId: e.target.value })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeCode}) — Base: ₹{Number(s.monthlySalary)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Month</label>
                <select
                  value={genForm.payrollMonth}
                  onChange={(e) => setGenForm({ ...genForm, payrollMonth: Number(e.target.value) })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Year</label>
                <Input
                  type="number"
                  value={genForm.payrollYear}
                  onChange={(e) => setGenForm({ ...genForm, payrollYear: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Configured Days</label>
                <Input
                  type="number"
                  min="20"
                  max="31"
                  value={genForm.configuredSalaryDays}
                  onChange={(e) => setGenForm({ ...genForm, configuredSalaryDays: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payable Days</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={genForm.payableDays}
                  onChange={(e) => setGenForm({ ...genForm, payableDays: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Other Deductions (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={genForm.deductions}
                  onChange={(e) => setGenForm({ ...genForm, deductions: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Advance Recovery (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={genForm.advanceDeductions}
                  onChange={(e) => setGenForm({ ...genForm, advanceDeductions: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Calculating..." : "Generate Slip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disburse Payment Modal */}
      <Dialog open={disburseModalOpen} onOpenChange={setDisburseModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Disburse Salary Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Employee: {selectedRecord?.staff?.fullName} • Period: {selectedRecord ? `${MONTHS[selectedRecord.payrollMonth - 1]} ${selectedRecord.payrollYear}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDisburseSubmit} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Net Salary Payable:</span>
                <span className="font-mono font-semibold">₹{Number(selectedRecord?.netSalary || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Disbursed:</span>
                <span className="font-mono text-emerald-600 font-semibold">₹{Number(selectedRecord?.totalPaid || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                <span>Current Outstanding Balance:</span>
                <span className="font-mono text-amber-600">₹{Number(selectedRecord?.balanceAmount || 0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Disbursement Amount (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  max={Number(selectedRecord?.balanceAmount || 1)}
                  step="100"
                  required
                  value={disburseForm.paymentAmount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, paymentAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Disbursement Date *</label>
                <Input
                  type="date"
                  required
                  value={disburseForm.paymentDate}
                  onChange={(e) => setDisburseForm({ ...disburseForm, paymentDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Payment Channel *</label>
              <select
                value={disburseForm.paymentMethod}
                onChange={(e) => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value as any })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
              >
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transaction Reference</label>
              <Input
                value={disburseForm.transactionReference}
                onChange={(e) => setDisburseForm({ ...disburseForm, transactionReference: e.target.value })}
                placeholder="NEFT-REF-12345 or Cheque #"
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setDisburseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {submitting ? "Processing..." : "Confirm Disbursement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Salary Slip Preview & Print Modal */}
      <Dialog open={slipModalOpen} onOpenChange={setSlipModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-slate-900">
                Salary Payslip Preview
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </Button>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div className="p-4 border border-slate-200 rounded-xl space-y-4 text-xs font-sans bg-white print:border-none">
              {/* Slip Header */}
              <div className="text-center pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Grand Horizon Hotel & Suites
                </h3>
                <p className="text-[11px] text-slate-500">100 Beach Road, Civil Lines • hotel@grandhorizon.com</p>
                <h4 className="text-xs font-bold text-indigo-700 mt-2 uppercase tracking-wider">
                  Payslip for {MONTHS[selectedRecord.payrollMonth - 1]} {selectedRecord.payrollYear}
                </h4>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRecord.staff?.fullName}</span>
                  <span className="text-slate-500 block font-mono text-[11px]">Code: {selectedRecord.staff?.employeeCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Designation & Department</span>
                  <span className="font-bold text-slate-900">{selectedRecord.staff?.designation}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedRecord.staff?.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Account Number</span>
                  <span className="font-mono text-slate-800">{selectedRecord.staff?.bankAccountNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Payable Days</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Number(selectedRecord.payableDays)} Days (out of {selectedRecord.configuredSalaryDays})
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-3 border-r border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-100 pb-1">Earnings</span>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Monthly Wage:</span>
                    <span className="font-mono">₹{Number(selectedRecord.monthlyBasicSalary).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Earned Basic Salary:</span>
                    <span className="font-mono font-medium">₹{(Number(selectedRecord.monthlyBasicSalary) / selectedRecord.configuredSalaryDays * Number(selectedRecord.payableDays)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Overtime Earnings ({Number(selectedRecord.overtimeHours)}h):</span>
                    <span className="font-mono font-medium text-emerald-600">₹{Number(selectedRecord.overtimeAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                    <span>Total Gross Earnings:</span>
                    <span className="font-mono">₹{Number(selectedRecord.grossSalary).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] block border-b border-slate-100 pb-1">Deductions</span>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Statutory / Other Deductions:</span>
                    <span className="font-mono">₹{Number(selectedRecord.deductions).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Salary Advance Recovery:</span>
                    <span className="font-mono text-rose-600">₹{Number(selectedRecord.advanceDeductions).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="font-mono text-rose-600">₹{(Number(selectedRecord.deductions) + Number(selectedRecord.advanceDeductions)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay & Settlement */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Net Salary Payable</span>
                  <span className="text-xs text-slate-500">Total earnings after all deductions</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-indigo-900">
                    ₹{Number(selectedRecord.netSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Disbursement History */}
              {selectedRecord.salaryPayments && selectedRecord.salaryPayments.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-800 text-[11px] block">Disbursement History</span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {selectedRecord.salaryPayments.map((p) => (
                      <div key={p.id} className="p-2 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-mono font-medium text-slate-900">{p.paymentReference}</span>
                          <span className="text-slate-400 ml-2">({p.paymentMethod} • {new Date(p.paymentDate).toLocaleDateString()})</span>
                        </div>
                        <span className="font-mono font-semibold text-emerald-600">
                          ₹{Number(p.paymentAmount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setSlipModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
