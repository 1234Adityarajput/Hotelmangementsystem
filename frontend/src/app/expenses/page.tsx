"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Building,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileText,
  Tag,
  Download,
  Printer,
  X,
  Zap,
  Droplets,
  ShoppingBag,
  Wrench,
  Users,
  Briefcase,
  CheckCircle2,
  IndianRupee,
  History,
  Archive,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ExcelJS from "exceljs";
import {
  expensesService,
  ExpenseStats,
  ExpenseHistoryItem,
  MonthlyExpenseHistoryResponse,
} from "@/services/expenses.service";
import { Expense, ExpenseCategory } from "@/types";
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

// Icon mapping helper for the 6 core hotel expense categories
function getCategoryIcon(name: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("electric") || n.includes("power")) return Zap;
  if (n.includes("water")) return Droplets;
  if (n.includes("grocery") || n.includes("food") || n.includes("kitchen")) return ShoppingBag;
  if (n.includes("maintenance") || n.includes("repair")) return Wrench;
  if (n.includes("staff")) return Users;
  return Building;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Monthly History & Archive Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<MonthlyExpenseHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Form State
  const initialForm = {
    expenseCategoryId: "",
    description: "",
    amount: 1500,
    paymentMethod: "CASH" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    paymentDate: new Date().toISOString().split("T")[0],
    transactionReference: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, statsRes] = await Promise.all([
        expensesService.findAll({
          search: search || undefined,
          categoryId: categoryId !== "ALL" ? categoryId : undefined,
          paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: 15,
        }),
        expensesService.findAllCategories(),
        expensesService.getStats(),
      ]);
      setExpenses(expRes.items);
      setTotal(expRes.total);
      setTotalPages(expRes.totalPages);
      setCategories(catRes);
      setStats(statsRes);
      if (catRes.length > 0 && !formData.expenseCategoryId) {
        setFormData((prev) => ({ ...prev, expenseCategoryId: catRes[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load expenses from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryId, paymentMethod, startDate, endDate, page]);

  // Date Presets
  const setPresetDates = (preset: "today" | "month" | "all") => {
    setPage(1);
    const now = new Date();
    if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      expenseCategoryId: categories[0]?.id || "",
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setSelectedExpense(exp);
    setFormData({
      expenseCategoryId: exp.expenseCategoryId,
      description: exp.description,
      amount: Number(exp.amount),
      paymentMethod: exp.paymentMethod,
      paymentDate: exp.paymentDate.split("T")[0],
      transactionReference: exp.transactionReference || "",
      notes: exp.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleOpenDetails = (exp: Expense) => {
    setSelectedExpense(exp);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (exp: Expense) => {
    setSelectedExpense(exp);
    setDeleteModalOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expenseCategoryId) {
      toast.error("Please select an expense category");
      return;
    }
    try {
      setSubmitting(true);
      await expensesService.create({
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success("Expense recorded successfully!");
      setAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      setSubmitting(true);
      await expensesService.createCategory({ name: catName.trim(), description: catDesc.trim() || undefined });
      toast.success(`Category "${catName}" created successfully!`);
      setCatName("");
      setCatDesc("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: ExpenseCategory) => {
    const isLinked = cat._count?.expenses && cat._count.expenses > 0;
    const confirmMessage = isLinked
      ? `Are you sure you want to delete category "${cat.name}"?\nIt has ${cat._count?.expenses} linked expense record(s). These records will be safely preserved and moved to General/Miscellaneous.`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      setDeletingCatId(cat.id);
      await expensesService.deleteCategory(cat.id);
      toast.success(`Category "${cat.name}" deleted successfully!`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setDeletingCatId(null);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      !catSearch.trim() ||
      c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(catSearch.toLowerCase()))
  );

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      setSubmitting(true);
      await expensesService.update(selectedExpense.id, {
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success("Expense updated successfully!");
      setEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      setSubmitting(true);
      const res = await expensesService.delete(selectedExpense.id);
      toast.success(res.message || `Expense ${selectedExpense.expenseReference} deleted and archived`);
      setDeleteModalOpen(false);
      setSelectedExpense(null);
      fetchData();
      if (historyModalOpen) fetchHistory(historyMonth, historyYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async (m?: number, y?: number) => {
    try {
      setHistoryLoading(true);
      const res = await expensesService.getHistory({
        month: m || historyMonth,
        year: y || historyYear,
      });
      setHistoryData(res);
    } catch (err: any) {
      toast.error("Failed to load expense history");
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
      toast.info("Generating Excel report for Hotel Expense Management...");

      let exportItems: ExpenseHistoryItem[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await expensesService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const now = new Date();
        const histRes = await expensesService.getHistory({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        exportItems = histRes.items || [];
        scopeTitle = `${MONTH_NAMES[now.getMonth()]}_${now.getFullYear()}`;
      }

      if (exportItems.length === 0) {
        toast.warning("No expense records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Expense Ledger");

      // Title Banner
      worksheet.mergeCells("A1:K1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — HOTEL OPERATING EXPENSE REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:K2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Records: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Expense Ref",
        "Payment Date",
        "Category",
        "Description",
        "Payment Method",
        "Amount (₹)",
        "Bill / Ref #",
        "Additional Notes",
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

      exportItems.forEach((exp: ExpenseHistoryItem, idx: number) => {
        const dateStr = exp.paymentDate ? new Date(exp.paymentDate).toLocaleDateString("en-IN") : "—";
        const row = worksheet.addRow([
          idx + 1,
          exp.expenseReference || "—",
          dateStr,
          exp.categoryName || "General",
          exp.description || "—",
          exp.paymentMethod || "CASH",
          Number(exp.amount || 0),
          exp.transactionReference || "—",
          exp.notes || "—",
          exp.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE EXPENSE",
          exp.deletedAt ? new Date(exp.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = exp.isDeleted;

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

          if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 4 || colNum === 6 || colNum === 8 || colNum === 10 || colNum === 11) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum === 7) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            cell.numFmt = "₹#,##0.00";
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 8 },  // S.No
        { width: 18 }, // Expense Ref
        { width: 16 }, // Payment Date
        { width: 22 }, // Category
        { width: 26 }, // Description
        { width: 16 }, // Payment Method
        { width: 18 }, // Amount
        { width: 18 }, // Bill / Ref #
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
      anchor.download = `Hotel_Radha_Palace_Expenses_${scopeTitle.replace(/\s+/g, "_")}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Expense report exported successfully (${exportItems.length} records)`);
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
      (item.expenseReference && item.expenseReference.toLowerCase().includes(q)) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.paymentMethod && item.paymentMethod.toLowerCase().includes(q)) ||
      (item.transactionReference && item.transactionReference.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses found to export");
      return;
    }

    try {
      const headers = ["Expense Reference", "Payment Date", "Category", "Description", "Payment Method", "Amount (INR)", "Bill / Ref #", "Additional Notes"];
      const rows = expenses.map((e) => [
        `"${e.expenseReference}"`,
        `"${new Date(e.paymentDate).toLocaleDateString()}"`,
        `"${e.category?.name || 'Uncategorized'}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${e.paymentMethod}"`,
        `"${Number(e.amount).toFixed(2)}"`,
        `"${(e.transactionReference || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `grand_horizon_expenses_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Expenses exported to CSV successfully!");
    } catch {
      toast.error("Failed to export expenses");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* 
      =======================================================================
      PAGE HEADER & ACTION BAR
      =======================================================================
      */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded tracking-wider">
              Financial Operations • Module 13
            </span>
            <Badge variant="outline" className="text-[10px] border-[#C4A06A] text-[#59283A] bg-white">
              Hotel Expense Ledger
            </Badge>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#C4A06A]" />
            Hotel Expense Management
          </h1>
          <p className="text-xs text-[#82747A] max-w-3xl mt-0.5">
            Maintain complete records of all hotel-related expenses: Electricity Bills, Water Bills, Grocery Expenses,
            Maintenance Expenses, Staff-Related Expenses, and Other Operational Expenses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="h-8 text-xs border-[#59283A]/30 text-[#59283A] hover:bg-[#59283A]/10 flex items-center gap-1.5 shadow-sm font-medium"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Expense History</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExportExcel("ALL")}
            className="h-8 text-xs border-[#C4A06A]/40 text-[#59283A] hover:bg-[#C4A06A]/10 flex items-center gap-1.5 shadow-sm font-medium"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4A06A]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            )}
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#59283A] flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#82747A]" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryModalOpen(true)}
            className="h-8 text-xs border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#59283A] flex items-center gap-1.5 shadow-sm"
          >
            <Tag className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Manage Categories</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 shadow-sm text-xs font-semibold"
          >
            <Plus className="w-4 h-4 text-[#C4A06A]" />
            <span>Record New Expense</span>
          </Button>
        </div>
      </div>

      {/* 
      =======================================================================
      KPI SUMMARY STRIP (Today, Month, YTD, Categories)
      =======================================================================
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Today&apos;s Expenses
            </CardTitle>
            <Receipt className="w-4 h-4 text-[#C4A06A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#59283A]">
              ₹{(stats?.todayAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">{stats?.todayCount || 0} disbursements recorded today</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              This Month&apos;s Expenses
            </CardTitle>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-emerald-700">
              ₹{(stats?.monthAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">{stats?.monthCount || 0} transactions this month</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Year-to-Date Total Outflow
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#59283A]">
              ₹{(stats?.yearAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">{stats?.yearCount || 0} total operating expense vouchers</p>
          </CardContent>
        </Card>

        <Card className="border-[#E8DDD8] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
              Active Categories
            </CardTitle>
            <Building className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#59283A]">
              {categories.length}
            </div>
            <p className="text-[11px] text-[#8E7079] mt-1">Classification budget heads</p>
          </CardContent>
        </Card>
      </div>

      {/* 
      =======================================================================
      6 CORE EXPENSE CATEGORIES QUICK SELECTOR STRIP
      =======================================================================
      */}
      <div className="bg-[#F5F0EA] p-3.5 rounded-xl border border-[#E8DDD8] shadow-xs space-y-2">
        <span className="text-[10px] font-bold text-[#82747A] uppercase tracking-wider block">
          Primary Hotel Expense Heads (Click to Filter):
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategoryId("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              categoryId === "ALL"
                ? "bg-[#59283A] text-white border-[#59283A] shadow-xs"
                : "bg-white text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8]"
            }`}
          >
            All Categories ({total})
          </button>

          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const isSelected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryId(cat.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? "bg-[#59283A] text-white border-[#59283A] shadow-xs"
                    : "bg-white text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#C4A06A]" : "text-[#82747A]"}`} />
                <span>{cat.name}</span>
                {cat._count?.expenses !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#F5F0EA] text-[#82747A]"}`}>
                    {cat._count.expenses}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 
      =======================================================================
      FILTER AND SEARCH TOOLBAR (Date Range, Payment Method, Search Query)
      =======================================================================
      */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
        {/* Date Range & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#59283A] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#C4A06A]" />
            Date:
          </span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36 border-[#E8DDD8]"
          />
          <span className="text-xs text-[#82747A]">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36 border-[#E8DDD8]"
          />

          <div className="flex items-center gap-1 border-l border-[#F5F0EA] pl-2">
            <button
              onClick={() => setPresetDates("today")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F5F0EA] hover:bg-[#F5F0EA] text-[#59283A]"
            >
              Today
            </button>
            <button
              onClick={() => setPresetDates("month")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F5F0EA] hover:bg-[#F5F0EA] text-[#59283A]"
            >
              This Month
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

        {/* Channel & Search Query */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#82747A]">Channel:</span>
          {["ALL", "CASH", "UPI", "BANK_TRANSFER"].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setPaymentMethod(ch);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                paymentMethod === ch
                  ? "bg-[#59283A] text-white border-[#59283A]"
                  : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border-[#E8DDD8]"
              }`}
            >
              {ch}
            </button>
          ))}

          <div className="relative w-64 ml-2">
            <Search className="w-3.5 h-3.5 text-[#82747A] absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search description, bill ref, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-8 text-xs border-[#E8DDD8]"
            />
          </div>
        </div>
      </div>

      {/* 
      =======================================================================
      EXPENSES DATA TABLE (With Complete Expense Information)
      =======================================================================
      */}
      <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-[#F5F0EA] border-b border-[#E8DDD8] py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                <span>Hotel Expense Ledger</span>
                <span className="text-xs font-normal text-[#82747A]">
                  ({total} operational expense entries found)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-[#82747A]">
                Categorized hotel outflows with verified audit vouchers and payment channels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-2">
              <LoadingSpinner text="Loading Hotel Operating Expenses..." subtext="Retrieving operational disbursements and categories..." />
              <span className="text-xs text-[#82747A]">Querying expense records...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
              <Receipt className="w-8 h-8 text-[#C4A06A] mx-auto opacity-60 mb-2" />
              <p className="font-semibold text-[#59283A]">No hotel expenses recorded matching criteria</p>
              <p className="text-[11px] text-[#8E7079] max-w-sm mx-auto">
                Click &quot;Record New Expense&quot; above to log electricity bills, water bills, grocery supplies, maintenance, or staff payouts.
              </p>
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="mt-2 bg-[#59283A] hover:bg-[#472130] text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                Record First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F0EA] text-[#7A4652] uppercase text-[10px] font-bold border-b border-[#E8DDD8] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Expense Ref</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Expense Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Bill / Ref #</th>
                    <th className="px-4 py-3">Additional Notes</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD8]">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#C4A06A]">
                        {exp.expenseReference}
                      </td>
                      <td className="px-4 py-3 text-[#7A4652] whitespace-nowrap font-medium">
                        {new Date(exp.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-[#F5F0EA] text-[#59283A] border-[#E8DDD8] flex items-center gap-1 w-fit"
                        >
                          {React.createElement(getCategoryIcon(exp.category?.name || ""), {
                            className: "w-3 h-3 text-[#C4A06A]",
                          })}
                          <span>{exp.category?.name || "Uncategorized"}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#59283A] max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-[#59283A]">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-700 text-sm">
                        ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#82747A]">
                        {exp.transactionReference || "-"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#82747A] max-w-xs truncate">
                        {exp.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(exp)}
                          className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A] hover:bg-[#EFE8E0]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="h-7 px-2 text-[#82747A] hover:text-amber-600 hover:bg-amber-50"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(exp)}
                          className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                          title="Delete Expense"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-[#E8DDD8] flex items-center justify-between text-xs text-[#82747A] bg-[#F5F0EA]/50">
              <span>
                Showing page <strong className="text-[#59283A]">{page}</strong> of <strong className="text-[#59283A]">{totalPages}</strong> ({total} total expenses)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-3 text-xs border-[#E8DDD8] hover:bg-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-3 text-xs border-[#E8DDD8] hover:bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 
      =======================================================================
      MODAL 1: RECORD NEW EXPENSE
      =======================================================================
      */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Hotel Operational Outflow
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Record Hotel Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Enter all expense details including category, description, amount, payment method, and notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-3.5 pt-2 text-xs">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Expense Category *</label>
              <select
                required
                value={formData.expenseCategoryId}
                onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Expense Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Electricity bill for November, Vegetables & dairy provisions..."
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Payment Method & Ref */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Bill / Transaction Ref #</label>
                <Input
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  placeholder="Invoice # or UTR Ref"
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Additional Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Vendor name, warranty, remarks, approval details..."
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#59283A] hover:bg-[#472130] text-white">
                {submitting ? "Recording..." : "Save Expense Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 
      =======================================================================
      MODAL 2: EDIT EXPENSE RECORD
      =======================================================================
      */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded w-fit">
              Update Expense Record
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Edit Expense: {selectedExpense?.expenseReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Modify category, description, amount, payment method, or notes for this record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateExpense} className="space-y-3.5 pt-2 text-xs">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Expense Category *</label>
              <select
                required
                value={formData.expenseCategoryId}
                onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Payment Method & Ref */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Bill / Transaction Ref #</label>
                <Input
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Additional Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#59283A] hover:bg-[#472130] text-white">
                {submitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 
      =======================================================================
      MODAL 3: VIEW EXPENSE DETAILS (Dossier)
      =======================================================================
      */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Official Expense Voucher
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 font-mono">
              {selectedExpense?.expenseReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Recorded on {selectedExpense ? new Date(selectedExpense.paymentDate).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#82747A] block">Category Head</span>
                <span className="font-semibold text-[#59283A] text-sm block">{selectedExpense.category?.name}</span>
                <p className="text-[#82747A] text-xs mt-1">{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                <div>
                  <span className="text-[#82747A] text-[10px] uppercase block font-semibold">Amount Paid</span>
                  <span className="font-mono font-bold text-rose-700 text-base">
                    ₹{Number(selectedExpense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[#82747A] text-[10px] uppercase block font-semibold">Payment Channel</span>
                  <span className="font-semibold text-[#59283A] bg-white px-2 py-0.5 rounded border border-[#E8DDD8] inline-block">
                    {selectedExpense.paymentMethod}
                  </span>
                </div>
                {selectedExpense.transactionReference && (
                  <div className="col-span-2 pt-1 border-t border-[#E8DDD8]">
                    <span className="text-[#82747A] text-[10px] uppercase block font-semibold">Bill / Reference Number</span>
                    <span className="font-mono text-[#59283A] font-semibold">{selectedExpense.transactionReference}</span>
                  </div>
                )}
              </div>

              {selectedExpense.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Additional Notes & Remarks:</span>
                  {selectedExpense.notes}
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

      {/* 
      =======================================================================
      MODAL 4: MANAGE & DELETE EXPENSE CATEGORIES
      =======================================================================
      */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#59283A] text-[#C4A06A] flex items-center justify-center shadow-sm">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
                  Manage Expense Categories
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Add new budget heads or search and remove existing categories.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1 space-y-5 pt-3 text-xs">
            {/* Top Section: Create Category Form */}
            <form onSubmit={handleCreateCategory} className="p-3.5 bg-[#FDFBF9] rounded-xl border border-[#E8DDD8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#59283A] flex items-center gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>Add New Category</span>
                </span>
                <span className="text-[10px] text-[#82747A]">Operating Budget Head</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A] text-[11px]">Category Name *</label>
                  <Input
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Generator Diesel"
                    className="h-8 text-xs border-[#E8DDD8] bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A] text-[11px]">Description (Optional)</label>
                  <Input
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="h-8 text-xs border-[#E8DDD8] bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-7 px-3 flex items-center gap-1 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-[#C4A06A]" />
                      <span>Create Category</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Bottom Section: Search & Delete Categories */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#59283A] text-xs">Existing Categories</span>
                  <Badge variant="outline" className="border-[#C4A06A] text-[#8B6A3D] text-[10px] py-0 px-1.5 h-4">
                    {categories.length}
                  </Badge>
                </div>
                <span className="text-[11px] text-[#82747A]">Search to select &amp; delete</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#82747A] absolute left-2.5 top-2.5" />
                <Input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search categories by name or description..."
                  className="h-8 pl-8 pr-7 text-xs border-[#E8DDD8] bg-white"
                />
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch("")}
                    className="absolute right-2 top-2 text-[#82747A] hover:text-[#59283A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categories Scrollable List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#82747A] bg-[#F5F0EA]/40 rounded-xl border border-dashed border-[#E8DDD8]">
                    No expense categories found matching &quot;{catSearch}&quot;.
                  </div>
                ) : (
                  filteredCategories.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-[#FDFBF9] hover:bg-[#F5F0EA]/70 transition-all rounded-lg border border-[#E8DDD8] flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-[#59283A]/10 text-[#59283A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#59283A] truncate">
                              {c.name}
                            </span>
                            {c._count?.expenses !== undefined && (
                              <span className="text-[10px] font-mono text-[#82747A] bg-white px-1.5 py-0.2 rounded border border-[#E8DDD8] flex-shrink-0">
                                {c._count.expenses} {c._count.expenses === 1 ? "expense" : "expenses"}
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <p className="text-[11px] text-[#82747A] truncate mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={deletingCatId === c.id}
                        onClick={() => handleDeleteCategory(c)}
                        className="h-7 px-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-transparent hover:border-rose-600 text-xs flex items-center gap-1 transition-all flex-shrink-0"
                        title={`Delete ${c.name}`}
                      >
                        {deletingCatId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E8DDD8] flex-shrink-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCategoryModalOpen(false);
                setCatSearch("");
              }}
              className="text-xs border-[#E8DDD8] text-[#59283A]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 
      =======================================================================
      MODAL 5: DELETE CONFIRMATION (Luxury Audit Safe)
      =======================================================================
      */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-rose-700">
              Confirm Delete Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] mt-1">
              Are you sure you want to delete expense record{" "}
              <strong className="text-[#59283A] font-semibold">
                {selectedExpense?.expenseReference}
              </strong>
              {selectedExpense?.category?.name && ` (${selectedExpense.category.name})`}
              {selectedExpense?.amount && ` for ₹${Number(selectedExpense.amount).toLocaleString("en-IN")}`}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This expense reference, category, description, and payment record will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Outflow Removal:</strong> The expense will be removed from active operational disbursement ledgers and monthly P&amp;L outflow totals.
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E8DDD8] gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedExpense(null);
              }}
              className="text-xs h-9 px-4 font-medium border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleDeleteExpense}
              className="text-xs h-9 px-4 font-semibold bg-[#B54C44] hover:bg-[#923832] text-white flex items-center justify-center gap-1.5 min-w-[130px] rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Yes, Delete Expense</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH EXPENSE HISTORY & ARCHIVE MODAL                                */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Hotel Expense &amp; Operational Audit Logs</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Hotel Expense History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete monthly operating expenses, utility bills, maintenance disbursements, and deleted expense archives.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Expenses</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <Receipt className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active Ledgers</div>
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
                placeholder="Search history by reference #, category, description, payment method, bill ref..."
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
                title="Download this month's complete expense records"
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
                <LoadingSpinner text="Loading expense history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No expense records or deletion activity found for {historyData?.monthName || "this month"}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryItems.map((item: any, idx: number) => {
                  const CatIcon = getCategoryIcon(item.categoryName || "");
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
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            item.isDeleted
                              ? "bg-[#B54C44]/10 text-[#B54C44]"
                              : "bg-[#59283A]/10 text-[#59283A]"
                          }`}
                        >
                          <CatIcon className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#59283A]">
                              {item.categoryName || "Uncategorized"}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F0EA] text-[#C4A06A] border border-[#E8DDD8]">
                              {item.expenseReference}
                            </span>
                            <span className="font-mono font-bold text-rose-700 text-sm">
                              ₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="text-xs text-[#82747A] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="text-[#59283A] font-medium">{item.description}</span>
                            <span>•</span>
                            <span>Payment: {item.paymentMethod}</span>
                            <span>•</span>
                            <span>
                              Date: {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString("en-IN") : "-"}
                            </span>
                            {item.transactionReference && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[11px]">Bill/Ref: {item.transactionReference}</span>
                              </>
                            )}
                          </div>

                          {item.notes && (
                            <div className="text-[11px] text-[#8E7079] mt-1 italic">
                              &quot;{item.notes}&quot;
                            </div>
                          )}
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
                              ACTIVE EXPENSE
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleOpenDelete({
                                  id: item.id,
                                  expenseReference: item.expenseReference,
                                  amount: item.amount,
                                  description: item.description,
                                  category: { name: item.categoryName } as any,
                                } as any);
                              }}
                              className="h-7 px-2 text-xs text-[#B54C44] hover:bg-rose-50 hover:text-rose-700"
                              title="Delete this expense record"
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
