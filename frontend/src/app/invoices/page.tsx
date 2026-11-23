"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  CreditCard,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { billingService } from "@/services/billing.service";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { Invoice, Booking } from "@/types";
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

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get("bookingId");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Generate Invoice Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [generateForm, setGenerateForm] = useState({
    bookingId: initialBookingId || "",
    discountType: "NONE" as "NONE" | "PERCENTAGE" | "FIXED",
    discountValue: 0,
    taxPercentage: 12.0,
    invoiceDate: new Date().toISOString().split("T")[0],
  });

  // Invoice view / print modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Quick Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentMethod: "UPI" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    paymentType: "FINAL" as "ADVANCE" | "PARTIAL" | "FINAL",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await billingService.findAll({
        status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setInvoices(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, search]);

  useEffect(() => {
    if (initialBookingId) {
      handleOpenGenerate(initialBookingId);
    }
  }, [initialBookingId]);

  const handleOpenGenerate = async (preselectedBookingId?: string) => {
    try {
      const bRes = await bookingsService.findAll({ limit: 50 });
      // Show bookings that are checked in or reserved
      setBookings(bRes.items);
      const targetId = preselectedBookingId || bRes.items[0]?.id || "";
      setGenerateForm({
        bookingId: targetId,
        discountType: "NONE",
        discountValue: 0,
        taxPercentage: 12.0,
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      setGenerateModalOpen(true);
    } catch (err) {
      toast.error("Error loading eligible bookings");
    }
  };

  const handleConfirmGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateForm.bookingId) {
      toast.error("Please select a booking to bill");
      return;
    }

    try {
      setSubmitting(true);
      const inv = await billingService.generateInvoice({
        bookingId: generateForm.bookingId,
        discountType: generateForm.discountType !== "NONE" ? generateForm.discountType : undefined,
        discountValue: generateForm.discountValue ? Number(generateForm.discountValue) : undefined,
        taxPercentage: Number(generateForm.taxPercentage),
        invoiceDate: generateForm.invoiceDate,
      });
      toast.success(`Invoice ${inv.invoiceNumber} generated successfully`);
      setGenerateModalOpen(false);
      fetchInvoices();
      handleViewInvoice(inv.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const inv = await billingService.findOne(id);
      setSelectedInvoice(inv);
      setViewModalOpen(true);
    } catch (err) {
      toast.error("Failed to load invoice details");
    }
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayForm({
      amount: Number(inv.balanceAmount),
      paymentMethod: "UPI",
      paymentType: Number(inv.balanceAmount) === Number(inv.totalAmount) ? "FINAL" : "PARTIAL",
      notes: `Settlement for Invoice ${inv.invoiceNumber}`,
    });
    setPayModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setSubmitting(true);
      await paymentsService.recordPayment({
        bookingId: selectedInvoice.bookingId,
        invoiceId: selectedInvoice.id,
        paymentType: payForm.paymentType as any,
        paymentMethod: payForm.paymentMethod,
        amount: Number(payForm.amount),
        notes: payForm.notes,
      });
      toast.success("Payment recorded and invoice balance updated.");
      setPayModalOpen(false);
      fetchInvoices();
      // refresh open invoice
      const updated = await billingService.findOne(selectedInvoice.id);
      setSelectedInvoice(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
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
            Billing & Invoices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate GST-compliant checkout bills, manage tax and discount snapshots, and record payment settlements.
          </p>
        </div>
        <Button
          onClick={() => handleOpenGenerate()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
          {["ALL", "FINALIZED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
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

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search invoice # or guest..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No invoices generated yet. Click &quot;Generate Invoice&quot; to bill a stay.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Guest & Room</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Tax</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{inv.booking?.primaryGuest?.fullName}</div>
                      <div className="text-[10px] text-slate-400">Room {inv.booking?.room?.roomNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(inv.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      ₹{Number(inv.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({Number(inv.taxPercentage)}%)
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{Number(inv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-rose-600">
                          ₹{Number(inv.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-600">₹0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          inv.invoiceStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inv.invoiceStatus === "PARTIALLY_PAID"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : inv.invoiceStatus === "FINALIZED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {inv.invoiceStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(inv.id)}
                        className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                        title="View / Print Bill"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {Number(inv.balanceAmount) > 0 && inv.invoiceStatus !== "CANCELLED" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPay(inv)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Generate Checkout Invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Compiles room charges and extra orders with GST tax snapshot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmGenerate} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Select Stay Booking *</label>
              <select
                required
                value={generateForm.bookingId}
                onChange={(e) => setGenerateForm({ ...generateForm, bookingId: e.target.value })}
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
                <label className="font-semibold text-slate-700">Discount Type</label>
                <select
                  value={generateForm.discountType}
                  onChange={(e) => setGenerateForm({ ...generateForm, discountType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                >
                  <option value="NONE">No Discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              {generateForm.discountType !== "NONE" && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Discount Value</label>
                  <Input
                    type="number"
                    min="0"
                    max={generateForm.discountType === "PERCENTAGE" ? 100 : 50000}
                    value={generateForm.discountValue}
                    onChange={(e) => setGenerateForm({ ...generateForm, discountValue: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">GST Tax %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={generateForm.taxPercentage}
                  onChange={(e) => setGenerateForm({ ...generateForm, taxPercentage: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Invoice Date</label>
                <Input
                  type="date"
                  value={generateForm.invoiceDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, invoiceDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Calculating..." : "Generate Final Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Printable Invoice Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <div className="space-y-6 pt-2 text-xs">
              {/* Hotel Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Grand Horizon Hotel & Suites</h3>
                    <p className="text-[11px] text-slate-500">100 Beach Road, Civil Lines • GSTIN: 27AAAAA0000A1Z5</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs font-bold font-mono bg-slate-50">
                    {selectedInvoice.invoiceNumber}
                  </Badge>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Guest & Stay Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Billed To</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.booking?.primaryGuest?.fullName}</span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    {selectedInvoice.booking?.primaryGuest?.mobileNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedInvoice.booking?.primaryGuest?.city}, {selectedInvoice.booking?.primaryGuest?.country}
                  </span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stay Information</span>
                  <span className="font-bold text-slate-900">
                    Room {selectedInvoice.booking?.room?.roomNumber} ({selectedInvoice.booking?.room?.roomType?.name})
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Duration: {selectedInvoice.booking?.numberOfNights} Nights
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Booking Ref: {selectedInvoice.booking?.bookingNumber}
                  </span>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Charges Breakdown</span>
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-center">Qty / Nights</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        Room Accommodation (Room {selectedInvoice.booking?.room?.roomNumber})
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {selectedInvoice.booking?.numberOfNights} Nights
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ₹{Number(selectedInvoice.booking?.roomRatePerNight)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{Number(selectedInvoice.roomCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {selectedInvoice.booking?.bookingItems?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 text-slate-700">
                          {item.itemNameSnapshot}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹{Number(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          ₹{Number(item.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Grid */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 font-mono text-xs max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedInvoice.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{Number(selectedInvoice.discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax ({Number(selectedInvoice.taxPercentage)}%):</span>
                  <span>₹{Number(selectedInvoice.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>₹{Number(selectedInvoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Paid / Advance:</span>
                  <span>₹{Number(selectedInvoice.totalPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-rose-600 pt-1 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span>₹{Number(selectedInvoice.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs">
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print Bill
                </Button>
                {Number(selectedInvoice.balanceAmount) > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewModalOpen(false);
                      handleOpenPay(selectedInvoice);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" /> Settle Balance Due
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Settlement Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Bill Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Posting payment to invoice {selectedInvoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-mono font-semibold">₹{Number(selectedInvoice?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Outstanding Balance:</span>
                <span className="font-mono">₹{Number(selectedInvoice?.balanceAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Payment Amount (₹) *</label>
              <Input
                type="number"
                required
                min="1"
                max={Number(selectedInvoice?.balanceAmount || 0)}
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Card / Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Type</label>
                <select
                  value={payForm.paymentType}
                  onChange={(e) => setPayForm({ ...payForm, paymentType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
                >
                  <option value="FINAL">Final Settlement</option>
                  <option value="PARTIAL">Partial Payment</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Reference</label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Transaction ID / receipt notes..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {submitting ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
