"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";
import { paymentsService } from "@/services/payments.service";
import { bookingsService } from "@/services/bookings.service";
import { billingService } from "@/services/billing.service";
import { Payment, Booking, Invoice } from "@/types";
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // New Payment Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    invoiceId: "",
    paymentType: "PARTIAL" as "ADVANCE" | "PARTIAL" | "FINAL" | "REFUND",
    paymentMethod: "UPI" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    amount: 1000,
    transactionReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentsService.findAll({
        method: methodFilter !== "ALL" ? (methodFilter as any) : undefined,
        page,
        limit: 20,
      });
      setPayments(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error("Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter]);

  const handleOpenRecord = async () => {
    try {
      const [bRes, iRes] = await Promise.all([
        bookingsService.findAll({ limit: 50 }),
        billingService.findAll({ status: "PARTIALLY_PAID" as any, limit: 50 }),
      ]);
      setBookings(bRes.items);
      setInvoices(iRes.items);

      if (bRes.items.length > 0) {
        setPaymentForm((prev) => ({
          ...prev,
          bookingId: bRes.items[0].id,
          amount: 1000,
        }));
      }
      setRecordModalOpen(true);
    } catch (err) {
      toast.error("Error loading payment form prerequisites");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bookingId) {
      toast.error("Please select a booking");
      return;
    }
    if (Number(paymentForm.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setSubmitting(true);
      await paymentsService.recordPayment({
        bookingId: paymentForm.bookingId,
        invoiceId: paymentForm.invoiceId || undefined,
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod,
        amount: Number(paymentForm.amount),
        transactionReference: paymentForm.transactionReference,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes,
      });
      toast.success("Payment transaction recorded successfully");
      setRecordModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Payment Processing & Financial Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log advance deposits, partial payments, final checkout settlements via Cash, UPI, Bank Transfer or Card.
          </p>
        </div>
        <Button
          onClick={handleOpenRecord}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Recorded</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                ₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Transactions</span>
              <span className="text-xl font-bold text-slate-900 font-mono">{total} Entries</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Settlement Channels</span>
              <span className="text-xs font-semibold text-slate-700 block mt-1">UPI • Cash • Bank • Card</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Method:</span>
          {["ALL", "UPI", "CASH", "BANK_TRANSFER", "OTHER"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMethodFilter(m);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                methodFilter === m
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No payments found. Click &quot;Record New Payment&quot; to log a settlement.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Reference #</th>
                  <th className="px-4 py-3">Guest & Room</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                      {p.paymentReference}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{p.booking?.primaryGuest?.fullName}</div>
                      <div className="text-[10px] text-slate-400">Room {p.booking?.room?.roomNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50">
                        {p.paymentType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          p.paymentMethod === "UPI"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : p.paymentMethod === "CASH"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {p.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {p.invoice?.invoiceNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {p.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Customer Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Posts transaction to accounting ledger and updates invoice balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Booking *</label>
              <select
                required
                value={paymentForm.bookingId}
                onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    Room {b.room?.roomNumber} — {b.primaryGuest?.fullName} ({b.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Type</label>
                <select
                  value={paymentForm.paymentType}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                >
                  <option value="ADVANCE">Advance Deposit</option>
                  <option value="PARTIAL">Partial Payment</option>
                  <option value="FINAL">Final Settlement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Card / Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Date</label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transaction Reference / UTR</label>
              <Input
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="UPI Ref, Cheque No, Transaction ID..."
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes</label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Front desk receipt notes..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
