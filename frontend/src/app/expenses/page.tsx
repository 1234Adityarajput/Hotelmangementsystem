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
  }, [search, categoryId, paymentMethod, page]);

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
    try {
      setSubmitting(true);
      await expensesService.createCategory({ name: catName, description: catDesc });
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Hotel Expense Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record operational overheads, utility bills, maintenance expenses, and track category-wise cash outflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Manage Categories</span>
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Today&apos;s Expenses
            </CardTitle>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ₹{(stats?.todayAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{stats?.todayCount || 0} disbursements recorded today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              This Month&apos;s Expenses
            </CardTitle>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{(stats?.monthAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{stats?.monthCount || 0} transactions this month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Year-to-Date Expenses
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              ₹{(stats?.yearAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total operating outflows this year</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Active Categories
            </CardTitle>
            <Building className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {categories.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Expense classification heads</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 ml-2">Channel:</span>
          {["ALL", "CASH", "UPI", "BANK_TRANSFER"].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setPaymentMethod(ch);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                paymentMethod === ch
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search description, reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No expenses recorded matching the criteria. Click &quot;Record New Expense&quot; to log an expense.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Expense Ref</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Payment Channel</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                        {exp.expenseReference}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(exp.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">
                          {exp.category?.name || "Uncategorized"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                        <div>{exp.description}</div>
                        {exp.transactionReference && (
                          <div className="text-[10px] text-slate-400 font-mono">Ref: {exp.transactionReference}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {exp.paymentMethod}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ₹{Number(exp.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(exp)}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="h-7 px-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
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
        </CardContent>
      </Card>

      {/* Record Expense Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Operational Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log an outflow payment under the appropriate hotel operational category.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Expense Category *</label>
              <select
                required
                value={formData.expenseCategoryId}
                onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Electricity bill for November, Laundry chemicals..."
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="10"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Channel *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Bill / Ref #</label>
                <Input
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  placeholder="Receipt # or Transaction ID"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Vendor name, warranty details..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Expense Category
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a new budget head for categorizing hotel operating expenses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category Name *</label>
              <Input
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Utilities, Housekeeping Consumables, Marketing"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description</label>
              <Input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Brief description of what goes into this category..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Expense Record
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              Ref: {selectedExpense?.expenseReference}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateExpense} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description *</label>
              <Input
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0.01"
                  step="10"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Remarks</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 font-mono">
              {selectedExpense?.expenseReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Paid on {selectedExpense ? new Date(selectedExpense.paymentDate).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-900 block text-sm">{selectedExpense.category?.name}</span>
                <p className="text-slate-600 text-xs mt-1">{selectedExpense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">Amount Paid</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ₹{Number(selectedExpense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">Channel</span>
                  <span className="font-semibold text-slate-800">{selectedExpense.paymentMethod}</span>
                </div>
                {selectedExpense.transactionReference && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Bill / Reference</span>
                    <span className="font-mono text-slate-800">{selectedExpense.transactionReference}</span>
                  </div>
                )}
              </div>

              {selectedExpense.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  {selectedExpense.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirm Delete Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete expense record {selectedExpense?.expenseReference} (₹{selectedExpense?.amount})?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
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
