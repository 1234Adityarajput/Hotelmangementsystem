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
} from "lucide-react";
import { advancesService, AdvanceStats } from "@/services/advances.service";
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Staff Advance & Loan Ledger
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Track employee salary advances, disbursement references, recoveries, and linked monthly payroll balances.
          </p>
        </div>
        <Button
          onClick={handleOpenIssue}
          className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Disburse New Advance</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
              Total Advances Disbursed
            </CardTitle>
            <CreditCard className="w-4 h-4 text-[#B08A60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#362A22] font-mono">
              ₹{(stats?.totalIssued || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">Cumulative principal issued</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
              Total Recovered
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              ₹{(stats?.totalRecovered || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">Direct cash & payroll deductions</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
              Outstanding Balance
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              ₹{(stats?.totalOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">Remaining to be recovered</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase">
              Pending Ledgers
            </CardTitle>
            <Clock className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#362A22]">
              {(stats?.statusCounts?.PENDING || 0) + (stats?.statusCounts?.PARTIALLY_REPAID || 0)}
            </div>
            <p className="text-[11px] text-[#948779] mt-1">
              {stats?.statusCounts?.PARTIALLY_REPAID || 0} Partial • {stats?.statusCounts?.REPAID || 0} Repaid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E3D9CA] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#79695B] mr-1">Status:</span>
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
                  : "bg-[#F7F4EE] text-[#79695B] hover:bg-slate-100 border border-[#E3D9CA]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#79695B]">Employee:</span>
          <select
            value={selectedStaffFilter}
            onChange={(e) => {
              setSelectedStaffFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-[#E3D9CA] rounded-lg px-2.5 py-1.5 bg-[#F7F4EE] text-[#5D493D]"
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
      <Card className="border-[#E3D9CA] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-[#B08A60]" />
            </div>
          ) : advances.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#948779]">
              No staff advance records found. Click &quot;Disburse New Advance&quot; to issue an advance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
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
                <tbody className="divide-y divide-[#EAE3D8]">
                  {advances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-[#F7F4EE]/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-[#B08A60]">
                        {adv.advanceReference}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        <div>{adv.staff?.fullName}</div>
                        <div className="text-[11px] text-[#948779] font-mono">
                          {adv.staff?.employeeCode} • {adv.staff?.department}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        <div>{new Date(adv.advanceDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#948779]">{adv.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#362A22]">
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
                          className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                          title="View Ledger Details"
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

      {/* Issue Advance Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              Disburse Salary Advance
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Issue an advance payment to a staff member. This will be tracked in the ledger and can be deducted during payroll.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Select Employee *</label>
              <select
                required
                value={issueForm.staffId}
                onChange={(e) => setIssueForm({ ...issueForm, staffId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
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
                <label className="font-semibold text-[#5D493D]">Advance Amount (₹) *</label>
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
                <label className="font-semibold text-[#5D493D]">Disbursement Date *</label>
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
              <label className="font-semibold text-[#5D493D]">Payment Method *</label>
              <select
                value={issueForm.paymentMethod}
                onChange={(e) => setIssueForm({ ...issueForm, paymentMethod: e.target.value as any })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI / QR CODE</option>
                <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Reason / Notes</label>
              <Input
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                placeholder="Medical emergency, festival advance..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
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
            <DialogTitle className="text-base font-bold text-[#362A22]">
              Record Advance Repayment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B] font-mono">
              Ref: {selectedAdvance?.advanceReference} • Employee: {selectedAdvance?.staff?.fullName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRepaySubmit} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-[#F7F4EE] rounded-xl space-y-1">
              <div className="flex justify-between text-[#79695B]">
                <span>Original Advance Amount:</span>
                <span className="font-mono font-semibold">₹{Number(selectedAdvance?.amount || 0)}</span>
              </div>
              <div className="flex justify-between text-[#79695B]">
                <span>Total Already Recovered:</span>
                <span className="font-mono text-emerald-600 font-semibold">₹{Number(selectedAdvance?.recoveredAmount || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#362A22] border-t border-[#E3D9CA] pt-1 mt-1">
                <span>Max Outstanding Balance:</span>
                <span className="font-mono text-amber-600">₹{Number(selectedAdvance?.balanceAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Repayment Amount (₹) *</label>
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
              <label className="font-semibold text-[#5D493D]">Recovery Notes</label>
              <Input
                value={repayForm.notes}
                onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                placeholder="Cash handed over to reception..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
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
            <DialogTitle className="text-base font-bold text-[#362A22] font-mono">
              {selectedAdvance?.advanceReference}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Disbursed on {selectedAdvance ? new Date(selectedAdvance.advanceDate).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedAdvance && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#F7F4EE] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#948779] block">Employee Information</span>
                <span className="font-semibold text-[#362A22] block text-sm">{selectedAdvance.staff?.fullName}</span>
                <span className="text-[#79695B] block font-mono">{selectedAdvance.staff?.employeeCode} • {selectedAdvance.staff?.department}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F4EE] rounded-xl">
                <div>
                  <span className="text-[#948779] text-[10px] uppercase block font-semibold">Principal Amount</span>
                  <span className="font-mono font-semibold text-[#362A22] text-sm">₹{Number(selectedAdvance.amount)}</span>
                </div>
                <div>
                  <span className="text-[#948779] text-[10px] uppercase block font-semibold">Status</span>
                  <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">
                    {selectedAdvance.repaymentStatus}
                  </Badge>
                </div>
                <div>
                  <span className="text-[#948779] text-[10px] uppercase block font-semibold">Recovered Amount</span>
                  <span className="font-mono font-semibold text-emerald-600">₹{Number(selectedAdvance.recoveredAmount)}</span>
                </div>
                <div>
                  <span className="text-[#948779] text-[10px] uppercase block font-semibold">Balance Pending</span>
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

          <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
            <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
