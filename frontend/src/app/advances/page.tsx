"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  ArrowDownLeft,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  FileText,
  History,
  Trash2,
  Download,
  Archive,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ExcelJS from "exceljs";
import {
  advancesService,
  AdvanceStats,
  AdvanceHistoryItem,
  MonthlyAdvanceHistoryResponse,
} from "@/services/advances.service";
import { staffService } from "@/services/staff.service";
import { StaffAdvance, Staff } from "@/types";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<AdvanceStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState("ALL");

  // Modals
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<StaffAdvance | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Advance State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<StaffAdvance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Monthly History & Archive Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<MonthlyAdvanceHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Forms
  const [issueForm, setIssueForm] = useState({
    staffId: "",
    amount: 5000,
    advanceDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    notes: "",
  });

  const [repayForm, setRepayForm] = useState({
    amount: 1000,
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [advRes, statsRes, staffRes] = await Promise.all([
        advancesService.findAll({
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          staffId: selectedStaffFilter !== "ALL" ? selectedStaffFilter : undefined,
          page,
          limit: 15,
        }),
        advancesService.getStats(),
        staffService.findAll({ employmentStatus: "ACTIVE", limit: 100 }),
      ]);
      setAdvances(advRes.items);
      setTotal(advRes.total);
      setTotalPages(advRes.totalPages);
      setStats(statsRes);
      setStaffList(staffRes.items);
      if (staffRes.items.length > 0 && !issueForm.staffId) {
        setIssueForm((prev) => ({ ...prev, staffId: staffRes.items[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load staff advances ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, selectedStaffFilter, page]);

  const handleOpenIssue = () => {
    if (staffList.length > 0) {
      setIssueForm({
        staffId: staffList[0].id,
        amount: 5000,
        advanceDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        notes: "",
      });
    }
    setIssueModalOpen(true);
  };

  const handleOpenRepay = (adv: StaffAdvance) => {
    setSelectedAdvance(adv);
    setRepayForm({
      amount: Number(adv.balanceAmount),
      notes: "Cash recovery from staff",
    });
    setRepayModalOpen(true);
  };

  const handleOpenDetails = (adv: StaffAdvance) => {
    setSelectedAdvance(adv);
    setDetailsModalOpen(true);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.staffId) {
      toast.error("Please select a staff member");
      return;
    }
    try {
      setSubmitting(true);
      await advancesService.issueAdvance({
        ...issueForm,
        amount: Number(issueForm.amount),
      });
      toast.success("Salary advance disbursed successfully!");
      setIssueModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to disburse advance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance) return;
    try {
      setSubmitting(true);
      await advancesService.recordRepayment(selectedAdvance.id, {
        amount: Number(repayForm.amount),
        notes: repayForm.notes,
      });
      toast.success("Repayment recorded and balance updated!");
      setRepayModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record repayment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (adv: StaffAdvance) => {
    setAdvanceToDelete(adv);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!advanceToDelete) return;
    try {
      setIsDeleting(true);
      const res = await advancesService.delete(advanceToDelete.id);
      toast.success(res.message || `Advance ${advanceToDelete.advanceReference} deleted and archived`);
      setDeleteModalOpen(false);
      setAdvanceToDelete(null);
      fetchData();
      if (historyModalOpen) fetchHistory(historyMonth, historyYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete advance voucher");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHistory = async (m?: number, y?: number) => {
    try {
      setHistoryLoading(true);
      const res = await advancesService.getHistory({
        month: m || historyMonth,
        year: y || historyYear,
      });
      setHistoryData(res);
    } catch (err: any) {
      toast.error("Failed to load staff advances history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistoryModal = () => {
    setHistoryModalOpen(true);
    fetchHistory(historyMonth, historyYear);
  };

  const handlePrevMonth = () => {
    let newM = historyMonth - 1;
    let newY = historyYear;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setHistoryMonth(newM);
    setHistoryYear(newY);
    fetchHistory(newM, newY);
  };

  const handleNextMonth = () => {
    let newM = historyMonth + 1;
    let newY = historyYear;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setHistoryMonth(newM);
    setHistoryYear(newY);
    fetchHistory(newM, newY);
  };

  const handleExportExcel = async (scope: "MONTH" | "ALL") => {
    try {
      setIsExporting(true);
      toast.info("Generating Excel report for Staff Advances & Loan Ledger...");

      let exportItems: AdvanceHistoryItem[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await advancesService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const now = new Date();
        const histRes = await advancesService.getHistory({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        exportItems = histRes.items || [];
        scopeTitle = `${MONTH_NAMES[now.getMonth()]}_${now.getFullYear()}`;
      }

      if (exportItems.length === 0) {
        toast.warning("No staff advance records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Staff Advances Ledger");

      // Title Banner
      worksheet.mergeCells("A1:N1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — STAFF ADVANCE & LOAN LEDGER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:N2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Records: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Advance Ref #",
        "Employee Code",
        "Staff Name",
        "Department",
        "Disbursed Date",
        "Payment Method",
        "Principal Amount (₹)",
        "Recovered Amount (₹)",
        "Balance Pending (₹)",
        "Status",
        "Notes",
        "Lifecycle",
        "Archived Date",
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A4652" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE8DDD8" } },
          bottom: { style: "medium", color: { argb: "FF59283A" } },
          left: { style: "thin", color: { argb: "FFE8DDD8" } },
          right: { style: "thin", color: { argb: "FFE8DDD8" } },
        };
      });

      exportItems.forEach((adv: AdvanceHistoryItem, idx: number) => {
        const dateStr = adv.advanceDate ? new Date(adv.advanceDate).toLocaleDateString("en-IN") : "—";
        const row = worksheet.addRow([
          idx + 1,
          adv.advanceReference || "—",
          adv.employeeCode || "—",
          adv.staffName || "—",
          adv.department || "—",
          dateStr,
          adv.paymentMethod || "CASH",
          Number(adv.amount || 0),
          Number(adv.recoveredAmount || 0),
          Number(adv.balanceAmount || 0),
          adv.repaymentStatus || "PENDING",
          adv.notes || "—",
          adv.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE VOUCHER",
          adv.deletedAt ? new Date(adv.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = adv.isDeleted;

        row.eachCell((cell, colNum) => {
          cell.font = { name: "Arial", size: 9 };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE8DDD8" } },
            bottom: { style: "thin", color: { argb: "FFE8DDD8" } },
            left: { style: "thin", color: { argb: "FFE8DDD8" } },
            right: { style: "thin", color: { argb: "FFE8DDD8" } },
          };

          if (isDeletedRow) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8E8E5" } };
          } else if (!isEven) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDFBF9" } };
          }

          if (
            colNum === 1 ||
            colNum === 2 ||
            colNum === 3 ||
            colNum === 6 ||
            colNum === 7 ||
            colNum === 11 ||
            colNum === 13 ||
            colNum === 14
          ) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum === 8 || colNum === 9 || colNum === 10) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            cell.numFmt = "₹#,##0.00";
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 8 },  // S.No
        { width: 18 }, // Advance Ref #
        { width: 16 }, // Employee Code
        { width: 22 }, // Staff Name
        { width: 18 }, // Department
        { width: 16 }, // Date
        { width: 16 }, // Method
        { width: 20 }, // Principal Amount
        { width: 20 }, // Recovered Amount
        { width: 20 }, // Balance Pending
        { width: 16 }, // Status
        { width: 26 }, // Notes
        { width: 20 }, // Lifecycle
        { width: 18 }, // Archived Date
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Hotel_Radha_Palace_Staff_Advances_${scopeTitle.replace(/\s+/g, "_")}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Advances report exported successfully (${exportItems.length} records)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to generate Excel export");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredHistoryItems = (historyData?.items || []).filter((item) => {
    if (historyFilter === "ACTIVE" && item.isDeleted) return false;
    if (historyFilter === "DELETED" && !item.isDeleted) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.staffName && item.staffName.toLowerCase().includes(q)) ||
      (item.employeeCode && item.employeeCode.toLowerCase().includes(q)) ||
      (item.advanceReference && item.advanceReference.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q)) ||
      (item.repaymentStatus && item.repaymentStatus.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.advanceDate && item.advanceDate.includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#59283A]">
            Staff Advance & Loan Ledger
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
            Track employee salary advances, disbursement references, recoveries, and linked monthly payroll balances.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Advance History</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportExcel("ALL")}
            disabled={isExporting}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5"
            title="Download complete staff advance ledger as Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </Button>

          <Button
            onClick={handleOpenIssue}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 shadow-sm text-xs h-9 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Disburse New Advance</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase">
              Total Advances Disbursed
            </CardTitle>
            <CreditCard className="w-4 h-4 text-[#C4A06A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#59283A] font-mono">
              ₹{(stats?.totalIssued || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">Cumulative principal issued</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase">
              Total Recovered
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{(stats?.totalRecovered || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">Direct cash & payroll deductions</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase">
              Outstanding Balance
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              ₹{(stats?.totalOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">Remaining to be recovered</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase">
              Pending Ledgers
            </CardTitle>
            <Clock className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#59283A]">
              {(stats?.statusCounts?.PENDING || 0) + (stats?.statusCounts?.PARTIALLY_REPAID || 0)}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">
              {stats?.statusCounts?.PARTIALLY_REPAID || 0} Partial • {stats?.statusCounts?.REPAID || 0} Repaid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#82747A] mr-1">Status:</span>
          {["ALL", "PENDING", "PARTIALLY_REPAID", "REPAID"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-[#F5F0EA] text-[#82747A] hover:bg-slate-100 border border-[#E8DDD8]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#82747A]">Employee:</span>
          <select
            value={selectedStaffFilter}
            onChange={(e) => {
              setSelectedStaffFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-[#E8DDD8] rounded-lg px-2.5 py-1.5 bg-[#F5F0EA] text-[#7A4652]"
          >
            <option value="ALL">All Staff Members</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advances Table */}
      <Card className="border-[#E8DDD8] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner text="Loading Staff Advances & Recoveries..." subtext="Retrieving employee advance vouchers and balances..." />
            </div>
          ) : advances.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E7079]">
              No staff advance records found. Click &quot;Disburse New Advance&quot; to issue an advance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Disbursed Date</th>
                    <th className="px-4 py-3">Disbursed Amount</th>
                    <th className="px-4 py-3">Recovered</th>
                    <th className="px-4 py-3">Remaining Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD8]">
                  {advances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-[#C4A06A]">
                        {adv.advanceReference}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#59283A]">
                        <div>{adv.staff?.fullName}</div>
                        <div className="text-[11px] text-[#8E7079] font-mono">
                          {adv.staff?.employeeCode} • {adv.staff?.department}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#82747A]">
                        <div>{new Date(adv.advanceDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#8E7079]">{adv.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#59283A]">
                        ₹{Number(adv.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-600 font-medium">
                        ₹{Number(adv.recoveredAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-600">
                        ₹{Number(adv.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            adv.repaymentStatus === "REPAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : adv.repaymentStatus === "PARTIALLY_REPAID"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {adv.repaymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        {adv.repaymentStatus !== "REPAID" && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenRepay(adv)}
                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                            title="Record Repayment"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 mr-1" /> Repay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(adv)}
                          className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A] hover:bg-[#EFE8E0]"
                          title="View Ledger Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(adv)}
                          className="h-7 px-2 text-[#B54C44] hover:bg-rose-50 hover:text-rose-700"
                          title="Delete Advance Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Issue Advance Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Disburse Salary Advance
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Issue an advance payment to a staff member. This will be tracked in the ledger and can be deducted during payroll.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Select Employee *</label>
              <select
                required
                value={issueForm.staffId}
                onChange={(e) => setIssueForm({ ...issueForm, staffId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeCode}) — Monthly Salary: ₹{Number(s.monthlySalary)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Advance Amount (₹) *</label>
                <Input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={issueForm.amount}
                  onChange={(e) => setIssueForm({ ...issueForm, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Disbursement Date *</label>
                <Input
                  type="date"
                  required
                  value={issueForm.advanceDate}
                  onChange={(e) => setIssueForm({ ...issueForm, advanceDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Payment Method *</label>
              <select
                value={issueForm.paymentMethod}
                onChange={(e) => setIssueForm({ ...issueForm, paymentMethod: e.target.value as any })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI / QR CODE</option>
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Reason / Notes</label>
              <Input
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                placeholder="Medical emergency, festival advance..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#59283A] hover:bg-[#472130] text-white">
                {submitting ? "Disbursing..." : "Confirm & Disburse Advance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Repayment Modal */}
      <Dialog open={repayModalOpen} onOpenChange={setRepayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Record Advance Repayment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] font-mono">
              Ref: {selectedAdvance?.advanceReference} • Employee: {selectedAdvance?.staff?.fullName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRepaySubmit} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-[#F5F0EA] rounded-xl space-y-1">
              <div className="flex justify-between text-[#82747A]">
                <span>Original Advance Amount:</span>
                <span className="font-mono font-semibold">₹{Number(selectedAdvance?.amount || 0)}</span>
              </div>
              <div className="flex justify-between text-[#82747A]">
                <span>Total Already Recovered:</span>
                <span className="font-mono text-emerald-600 font-semibold">₹{Number(selectedAdvance?.recoveredAmount || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#59283A] border-t border-[#E8DDD8] pt-1 mt-1">
                <span>Max Outstanding Balance:</span>
                <span className="font-mono text-amber-600">₹{Number(selectedAdvance?.balanceAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Repayment Amount (₹) *</label>
              <Input
                type="number"
                min="1"
                max={Number(selectedAdvance?.balanceAmount || 1)}
                step="50"
                required
                value={repayForm.amount}
                onChange={(e) => setRepayForm({ ...repayForm, amount: Number(e.target.value) })}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Recovery Notes</label>
              <Input
                value={repayForm.notes}
                onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                placeholder="Cash handed over to reception..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setRepayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {submitting ? "Saving..." : "Record Repayment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A] font-mono">
              {selectedAdvance?.advanceReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Disbursed on {selectedAdvance ? new Date(selectedAdvance.advanceDate).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#F5F0EA] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8E7079] block">Employee Information</span>
                <span className="font-semibold text-[#59283A] block text-sm">{selectedAdvance.staff?.fullName}</span>
                <span className="text-[#82747A] block font-mono">{selectedAdvance.staff?.employeeCode} • {selectedAdvance.staff?.department}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F0EA] rounded-xl">
                <div>
                  <span className="text-[#8E7079] text-[10px] uppercase block font-semibold">Principal Amount</span>
                  <span className="font-mono font-semibold text-[#59283A] text-sm">₹{Number(selectedAdvance.amount)}</span>
                </div>
                <div>
                  <span className="text-[#8E7079] text-[10px] uppercase block font-semibold">Status</span>
                  <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">
                    {selectedAdvance.repaymentStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-[#8E7079] text-[10px] uppercase block font-semibold">Recovered Amount</span>
                  <span className="font-mono font-semibold text-emerald-600">₹{Number(selectedAdvance.recoveredAmount)}</span>
                </div>
                <div>
                  <span className="text-[#8E7079] text-[10px] uppercase block font-semibold">Balance Pending</span>
                  <span className="font-mono font-bold text-amber-600">₹{Number(selectedAdvance.balanceAmount)}</span>
                </div>
              </div>

              {selectedAdvance.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  {selectedAdvance.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
            <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (AUDIT ARCHIVED)                                */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="text-center sm:text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-[#F8E8E5] border border-[#F2D1CB] text-[#B54C44] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
              Delete Staff Advance Voucher?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] mt-1">
              Are you sure you want to delete advance voucher{" "}
              <strong className="text-[#59283A] font-semibold">
                {advanceToDelete?.advanceReference}
              </strong>
              {advanceToDelete?.staff?.fullName && ` issued to ${advanceToDelete.staff.fullName}`}
              {advanceToDelete?.amount && ` for ₹${Number(advanceToDelete.amount).toLocaleString("en-IN")}`}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This advance voucher reference, employee code, principal amount, and recovery status will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Ledger Removal:</strong> The voucher will be permanently removed from active advance ledgers and will no longer show as pending debt in monthly payroll.
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-4 border-t border-[#E8DDD8]/60 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setAdvanceToDelete(null);
              }}
              className="text-xs h-9 px-4 font-medium border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleExecuteDelete}
              className="text-xs h-9 px-4 font-semibold bg-[#B54C44] hover:bg-[#923832] text-white flex items-center justify-center gap-1.5 min-w-[130px] rounded-lg transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Yes, Delete Advance</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH ADVANCE HISTORY & ARCHIVE MODAL                                */}
      {/* ========================================================================= */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-5xl bg-white max-h-[92vh] overflow-hidden flex flex-col border-[#E8DDD8] shadow-2xl p-0">
          <DialogHeader className="p-5 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#59283A] text-[#C4A06A] px-2 py-0.5 rounded">
                    Hotel Radha Palace Archive
                  </span>
                  <span className="text-xs text-[#82747A]">• Full Month Salary Advances &amp; Recovery Audit Logs</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Staff Advance History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month employee advances, recoveries, remaining balances, and deleted voucher archives.
                </DialogDescription>
              </div>

              {/* Month Selector Controls */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E8DDD8] shadow-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0 text-[#59283A]"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold text-[#59283A] px-2 font-serif min-w-[130px] text-center">
                  {historyData?.monthName || `${MONTH_NAMES[historyMonth - 1]} ${historyYear}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0 text-[#59283A]"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Vouchers</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active / Disbursed</div>
                  <div className="text-lg font-serif font-bold text-[#32765B]">
                    {historyData?.activeCount || 0}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#32765B]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#B54C44]">Deleted / Cancelled</div>
                  <div className="text-lg font-serif font-bold text-[#B54C44]">
                    {historyData?.deletedCount || 0}
                  </div>
                </div>
                <Archive className="w-5 h-5 text-[#B54C44]" />
              </div>
            </div>
          </DialogHeader>

          {/* Search & Filter Toolbar inside History */}
          <div className="p-3 border-b border-[#E8DDD8] bg-white flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E7079]" />
              <Input
                placeholder="Search history by reference #, employee name, code, dept, status, notes..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant={historyFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setHistoryFilter("ALL")}
                className={`h-7 text-xs px-2.5 ${historyFilter === "ALL" ? "bg-[#59283A] text-white" : "border-[#E8DDD8] text-[#59283A]"}`}
              >
                All ({historyData?.totalCount || 0})
              </Button>
              <Button
                variant={historyFilter === "ACTIVE" ? "default" : "outline"}
                size="sm"
                onClick={() => setHistoryFilter("ACTIVE")}
                className={`h-7 text-xs px-2.5 ${historyFilter === "ACTIVE" ? "bg-[#32765B] text-white" : "border-[#E8DDD8] text-[#32765B]"}`}
              >
                Active ({historyData?.activeCount || 0})
              </Button>
              <Button
                variant={historyFilter === "DELETED" ? "default" : "outline"}
                size="sm"
                onClick={() => setHistoryFilter("DELETED")}
                className={`h-7 text-xs px-2.5 ${historyFilter === "DELETED" ? "bg-[#B54C44] text-white" : "border-[#E8DDD8] text-[#B54C44]"}`}
              >
                Deleted ({historyData?.deletedCount || 0})
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportExcel("MONTH")}
                disabled={isExporting}
                className="h-7 text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] ml-1 flex items-center gap-1"
                title="Download this month's complete advance records"
              >
                <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
                <span>Export Month</span>
              </Button>
            </div>
          </div>

          {/* History Records Table */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F5F0EA]/20">
            {historyLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <LoadingSpinner size="md" text="Loading advance history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No staff advance records or deletion activity found for {historyData?.monthName || "this month"}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryItems.map((item: any, idx: number) => {
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        item.isDeleted
                          ? "border-[#B54C44]/30 bg-[#F8E8E5]/20 hover:border-[#B54C44]"
                          : "border-[#E8DDD8] hover:border-[#C4A06A]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                            item.isDeleted
                              ? "bg-[#B54C44]/10 text-[#B54C44]"
                              : "bg-[#59283A]/10 text-[#59283A]"
                          }`}
                        >
                          {item.staffName ? item.staffName.substring(0, 2).toUpperCase() : "AD"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#59283A]">
                              {item.staffName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F0EA] text-[#C4A06A] border border-[#E8DDD8]">
                              {item.advanceReference}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-semibold px-2 py-0.5 ${
                                item.repaymentStatus === "REPAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.repaymentStatus === "PARTIALLY_REPAID"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.repaymentStatus}
                            </Badge>
                          </div>

                          <div className="text-xs text-[#82747A] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{item.employeeCode}</span>
                            <span>•</span>
                            <span>{item.department}</span>
                            <span>•</span>
                            <span className="font-medium text-[#59283A]">
                              Date: {new Date(item.advanceDate).toLocaleDateString("en-IN")}
                            </span>
                            <span>•</span>
                            <span>Method: {item.paymentMethod}</span>
                          </div>

                          <div className="text-[11px] text-[#8E7079] mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-mono">
                              Principal: <strong className="text-[#59283A]">₹{Number(item.amount).toLocaleString("en-IN")}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-emerald-700">
                              Recovered: ₹{Number(item.recoveredAmount).toLocaleString("en-IN")}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-amber-700 font-semibold">
                              Balance: ₹{Number(item.balanceAmount).toLocaleString("en-IN")}
                            </span>
                            {item.notes && (
                              <>
                                <span>•</span>
                                <span className="italic truncate max-w-[200px]">"{item.notes}"</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                        {item.isDeleted ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#B54C44]/10 text-[#B54C44] border border-[#B54C44]/20">
                              <Archive className="w-3 h-3" />
                              DELETED / ARCHIVED
                            </span>
                            {item.deletedAt && (
                              <div className="text-[10px] text-[#8E7079] mt-0.5">
                                {new Date(item.deletedAt).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#32765B]/10 text-[#32765B] border border-[#32765B]/20">
                              <CheckCircle2 className="w-3 h-3" />
                              ACTIVE VOUCHER
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleOpenDelete({
                                  id: item.id,
                                  advanceReference: item.advanceReference,
                                  amount: item.amount,
                                  balanceAmount: item.balanceAmount,
                                  staff: {
                                    id: item.staffId,
                                    fullName: item.staffName,
                                    employeeCode: item.employeeCode,
                                    department: item.department,
                                  } as any,
                                } as any);
                              }}
                              className="h-7 px-2 text-xs text-[#B54C44] hover:bg-rose-50 hover:text-rose-700"
                              title="Delete this advance voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
