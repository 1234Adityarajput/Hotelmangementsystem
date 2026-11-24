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
} from "lucide-react";
import { expensesService, ExpenseStats } from "@/services/expenses.service";
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
      setCategoryModalOpen(false);
      setCatName("");
      setCatDesc("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

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
      await expensesService.delete(selectedExpense.id);
      toast.success("Expense deleted successfully!");
      setDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E3D9CA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded tracking-wider">
              Financial Operations • Module 13
            </span>
            <Badge variant="outline" className="text-[10px] border-[#B08A60] text-[#362A22] bg-white">
              Hotel Expense Ledger
            </Badge>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#362A22] mt-1 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#B08A60]" />
            Hotel Expense Management
          </h1>
          <p className="text-xs text-[#79695B] max-w-3xl mt-0.5">
            Maintain complete records of all hotel-related expenses: Electricity Bills, Water Bills, Grocery Expenses,
            Maintenance Expenses, Staff-Related Expenses, and Other Operational Expenses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs border-[#E3D9CA] hover:bg-[#F7F4EE] text-[#362A22] flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryModalOpen(true)}
            className="h-8 text-xs border-[#E3D9CA] hover:bg-[#F7F4EE] text-[#362A22] flex items-center gap-1.5 shadow-sm"
          >
            <Tag className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Manage Categories</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4 text-[#B08A60]" />
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
        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Today&apos;s Expenses
            </CardTitle>
            <Receipt className="w-4 h-4 text-[#B08A60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#362A22]">
              ₹{(stats?.todayAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">{stats?.todayCount || 0} disbursements recorded today</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              This Month&apos;s Expenses
            </CardTitle>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-emerald-700">
              ₹{(stats?.monthAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">{stats?.monthCount || 0} transactions this month</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Year-to-Date Total Outflow
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#362A22]">
              ₹{(stats?.yearAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">{stats?.yearCount || 0} total operating expense vouchers</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Active Categories
            </CardTitle>
            <Building className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-[#362A22]">
              {categories.length}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">Classification budget heads</p>
          </CardContent>
        </Card>
      </div>

      {/* 
      =======================================================================
      6 CORE EXPENSE CATEGORIES QUICK SELECTOR STRIP
      =======================================================================
      */}
      <div className="bg-[#F7F4EE] p-3.5 rounded-xl border border-[#E3D9CA] shadow-xs space-y-2">
        <span className="text-[10px] font-bold text-[#79695B] uppercase tracking-wider block">
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
                ? "bg-[#362A22] text-white border-[#362A22] shadow-xs"
                : "bg-white text-[#5D493D] hover:bg-[#EEE7DA] border-[#E3D9CA]"
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
                    ? "bg-[#362A22] text-white border-[#362A22] shadow-xs"
                    : "bg-white text-[#5D493D] hover:bg-[#EEE7DA] border-[#E3D9CA]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#B08A60]" : "text-[#79695B]"}`} />
                <span>{cat.name}</span>
                {cat._count?.expenses !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#EEE7DA] text-[#79695B]"}`}>
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm">
        {/* Date Range & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#362A22] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#B08A60]" />
            Date:
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

          <div className="flex items-center gap-1 border-l border-[#EEE7DA] pl-2">
            <button
              onClick={() => setPresetDates("today")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F7F4EE] hover:bg-[#EEE7DA] text-[#362A22]"
            >
              Today
            </button>
            <button
              onClick={() => setPresetDates("month")}
              className="text-[10px] font-semibold px-2 py-1 rounded bg-[#F7F4EE] hover:bg-[#EEE7DA] text-[#362A22]"
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
          <span className="text-xs font-semibold text-[#79695B]">Channel:</span>
          {["ALL", "CASH", "UPI", "BANK_TRANSFER"].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setPaymentMethod(ch);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors border ${
                paymentMethod === ch
                  ? "bg-[#362A22] text-white border-[#362A22]"
                  : "bg-[#F7F4EE] text-[#79695B] hover:bg-[#EEE7DA] border-[#E3D9CA]"
              }`}
            >
              {ch}
            </button>
          ))}

          <div className="relative w-64 ml-2">
            <Search className="w-3.5 h-3.5 text-[#79695B] absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Search description, bill ref, notes..."
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
      EXPENSES DATA TABLE (With Complete Expense Information)
      =======================================================================
      */}
      <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-[#F7F4EE] border-b border-[#E3D9CA] py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#362A22] flex items-center gap-2">
                <span>Hotel Expense Ledger</span>
                <span className="text-xs font-normal text-[#79695B]">
                  ({total} operational expense entries found)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-[#79695B]">
                Categorized hotel outflows with verified audit vouchers and payment channels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-2">
              <LoadingSpinner className="w-7 h-7 text-[#B08A60]" />
              <span className="text-xs text-[#79695B]">Querying expense records...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
              <Receipt className="w-8 h-8 text-[#B08A60] mx-auto opacity-60 mb-2" />
              <p className="font-semibold text-[#362A22]">No hotel expenses recorded matching criteria</p>
              <p className="text-[11px] text-[#948779] max-w-sm mx-auto">
                Click &quot;Record New Expense&quot; above to log electricity bills, water bills, grocery supplies, maintenance, or staff payouts.
              </p>
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="mt-2 bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                Record First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#5D493D] uppercase text-[10px] font-bold border-b border-[#E3D9CA] tracking-wider">
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
                <tbody className="divide-y divide-[#EAE3D8]">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#B08A60]">
                        {exp.expenseReference}
                      </td>
                      <td className="px-4 py-3 text-[#5D493D] whitespace-nowrap font-medium">
                        {new Date(exp.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-[#EEE7DA] text-[#362A22] border-[#E3D9CA] flex items-center gap-1 w-fit"
                        >
                          {React.createElement(getCategoryIcon(exp.category?.name || ""), {
                            className: "w-3 h-3 text-[#B08A60]",
                          })}
                          <span>{exp.category?.name || "Uncategorized"}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22] max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-[#362A22]">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-700 text-sm">
                        ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#79695B]">
                        {exp.transactionReference || "-"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#79695B] max-w-xs truncate">
                        {exp.notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(exp)}
                          className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="h-7 px-2 text-[#79695B] hover:text-amber-600 hover:bg-amber-50"
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
            <div className="p-3.5 border-t border-[#EAE3D8] flex items-center justify-between text-xs text-[#79695B] bg-[#F7F4EE]/50">
              <span>
                Showing page <strong className="text-[#362A22]">{page}</strong> of <strong className="text-[#362A22]">{totalPages}</strong> ({total} total expenses)
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

      {/* 
      =======================================================================
      MODAL 1: RECORD NEW EXPENSE
      =======================================================================
      */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded w-fit">
              Hotel Operational Outflow
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
              Record Hotel Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Enter all expense details including category, description, amount, payment method, and notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-3.5 pt-2 text-xs">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Expense Category *</label>
              <select
                required
                value={formData.expenseCategoryId}
                onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
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
              <label className="font-semibold text-[#362A22]">Expense Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Electricity bill for November, Vegetables & dairy provisions..."
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Payment Method & Ref */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Bill / Transaction Ref #</label>
                <Input
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  placeholder="Invoice # or UTR Ref"
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Additional Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Vendor name, warranty, remarks, approval details..."
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
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
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded w-fit">
              Update Expense Record
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
              Edit Expense: {selectedExpense?.expenseReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Modify category, description, amount, payment method, or notes for this record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateExpense} className="space-y-3.5 pt-2 text-xs">
            {/* Category Select */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Expense Category *</label>
              <select
                required
                value={formData.expenseCategoryId}
                onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
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
              <label className="font-semibold text-[#362A22]">Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Payment Method & Ref */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Bill / Transaction Ref #</label>
                <Input
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Additional Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
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
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded w-fit">
              Official Expense Voucher
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1 font-mono">
              {selectedExpense?.expenseReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Recorded on {selectedExpense ? new Date(selectedExpense.paymentDate).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#79695B] block">Category Head</span>
                <span className="font-semibold text-[#362A22] text-sm block">{selectedExpense.category?.name}</span>
                <p className="text-[#79695B] text-xs mt-1">{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA]">
                <div>
                  <span className="text-[#79695B] text-[10px] uppercase block font-semibold">Amount Paid</span>
                  <span className="font-mono font-bold text-rose-700 text-base">
                    ₹{Number(selectedExpense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[#79695B] text-[10px] uppercase block font-semibold">Payment Channel</span>
                  <span className="font-semibold text-[#362A22] bg-white px-2 py-0.5 rounded border border-[#E3D9CA] inline-block">
                    {selectedExpense.paymentMethod}
                  </span>
                </div>
                {selectedExpense.transactionReference && (
                  <div className="col-span-2 pt-1 border-t border-[#EAE3D8]">
                    <span className="text-[#79695B] text-[10px] uppercase block font-semibold">Bill / Reference Number</span>
                    <span className="font-mono text-[#362A22] font-semibold">{selectedExpense.transactionReference}</span>
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

          <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
            <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 
      =======================================================================
      MODAL 4: CREATE EXPENSE CATEGORY
      =======================================================================
      */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22]">
              Create Expense Category
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Add a new budget head for categorizing hotel operating expenses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Category Name *</label>
              <Input
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Laundry Chemicals, Generator Diesel, Signage..."
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Description</label>
              <Input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief description of expenditures under this category..."
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
                {submitting ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 
      =======================================================================
      MODAL 5: DELETE CONFIRMATION
      =======================================================================
      */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <DialogTitle className="text-xl font-serif font-bold text-rose-700">
              Confirm Delete Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Are you sure you want to delete expense record <strong className="text-[#362A22]">{selectedExpense?.expenseReference}</strong> (₹{Number(selectedExpense?.amount || 0).toLocaleString()})?
              This action will remove the record from financial accounts.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={submitting} onClick={handleDeleteExpense}>
              {submitting ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
