"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Clock,
  Printer,
  Download,
  IndianRupee,
  AlertCircle,
  ArrowRight,
  Eye,
  RefreshCw,
  Wallet,
  Banknote,
  QrCode,
  ShieldCheck,
  Check,
  DoorOpen,
  User,
  Sparkles,
} from "lucide-react";
import { paymentsService, PaymentStats, PendingPaymentItem } from "@/services/payments.service";
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
  const [activeTab, setActiveTab] = useState<"history" | "pending" | "advance" | "channels">("history");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Statistics & Pending Payments
  const [stats, setStats] = useState<PaymentStats>({
    totalCollected: 0,
    totalCount: 0,
    todayCollected: 0,
    todayCount: 0,
    monthCollected: 0,
    monthCount: 0,
    advanceCollected: 0,
    advanceCount: 0,
    partialCollected: 0,
    partialCount: 0,
    finalCollected: 0,
    finalCount: 0,
    cashCollected: 0,
    cashCount: 0,
    upiCollected: 0,
    upiCount: 0,
    bankCollected: 0,
    bankCount: 0,
    otherCollected: 0,
    otherCount: 0,
    pendingBalanceTotal: 0,
    pendingBalanceCount: 0,
  });

  const [pendingPayments, setPendingPayments] = useState<PendingPaymentItem[]>([]);
  const [totalPendingOutstanding, setTotalPendingOutstanding] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);

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

  // Digital Payment Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch Payments Ledger & Stats
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [res, statsData] = await Promise.all([
        paymentsService.findAll({
          method: methodFilter !== "ALL" ? methodFilter : undefined,
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: 25,
        }).catch(() => ({ items: [], total: 0, page: 1, limit: 25, totalPages: 1 })),
        paymentsService.getStats().catch(() => null),
      ]);

      setPayments(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to load payment ledger:", err);
      toast.error("Failed to load payment ledger");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pending Payments
  const fetchPendingPayments = async () => {
    try {
      setLoadingPending(true);
      const res = await paymentsService.getPendingPayments();
      setPendingPayments(res.items || []);
      setTotalPendingOutstanding(res.totalOutstanding || 0);
    } catch (err) {
      console.error("Failed to load pending payments:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter, typeFilter, search, startDate, endDate]);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingPayments();
    }
  }, [activeTab]);

  // Open Record Modal
  const handleOpenRecord = async (prefillBookingId?: string, prefillAmount?: number, prefillType?: "ADVANCE" | "PARTIAL" | "FINAL") => {
    try {
      const [bRes, iRes] = await Promise.all([
        bookingsService.findAll({ limit: 50 }).catch(() => ({ items: [] })),
        billingService.findAll({ status: "PARTIALLY_PAID" as any, limit: 50 }).catch(() => ({ items: [] })),
      ]);
      const activeBookings = (bRes.items || []).filter((b: any) => b.bookingStatus === "CHECKED_IN" || b.bookingStatus === "RESERVED");
      setBookings(activeBookings.length > 0 ? activeBookings : bRes.items || []);
      setInvoices(iRes.items || []);

      const targetBookingId = prefillBookingId || activeBookings[0]?.id || bRes.items[0]?.id || "";
      setPaymentForm({
        bookingId: targetBookingId,
        invoiceId: "",
        paymentType: prefillType || "PARTIAL",
        paymentMethod: "UPI",
        amount: prefillAmount && prefillAmount > 0 ? prefillAmount : 1000,
        transactionReference: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setRecordModalOpen(true);
    } catch (err) {
      toast.error("Error loading payment form prerequisites");
    }
  };

  // Submit Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bookingId) {
      toast.error("Please select a guest booking");
      return;
    }
    if (Number(paymentForm.amount) <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    try {
      setSubmitting(true);
      const created = await paymentsService.recordPayment({
        bookingId: paymentForm.bookingId,
        invoiceId: paymentForm.invoiceId || undefined,
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod,
        amount: Number(paymentForm.amount),
        transactionReference: paymentForm.transactionReference.trim() || undefined,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes.trim() || undefined,
      });

      toast.success(`Payment of ₹${Number(paymentForm.amount).toLocaleString("en-IN")} recorded successfully!`);
      setRecordModalOpen(false);
      await fetchPayments();
      if (activeTab === "pending") {
        await fetchPendingPayments();
      }

      // Automatically open receipt for the newly recorded payment
      setSelectedPayment(created);
      setReceiptModalOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Digital Receipt
  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptModalOpen(true);
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.info("No payment records to export");
      return;
    }

    const headers = [
      "Payment Reference",
      "Date",
      "Guest Name",
      "Mobile Number",
      "Room Number",
      "Payment Type",
      "Payment Method",
      "Amount (INR)",
      "Transaction / UTR Reference",
      "Invoice Number",
      "Status",
      "Cashier Notes",
    ];

    const rows = payments.map((p) => [
      `"${p.paymentReference}"`,
      `"${new Date(p.paymentDate).toISOString().split("T")[0]}"`,
      `"${p.booking?.primaryGuest?.fullName || ""}"`,
      `"${p.booking?.primaryGuest?.mobileNumber || ""}"`,
      `"Room ${p.booking?.room?.roomNumber || ""}"`,
      `"${p.paymentType}"`,
      `"${p.paymentMethod}"`,
      p.amount,
      `"${p.transactionReference || ""}"`,
      `"${p.invoice?.invoiceNumber || ""}"`,
      `"${p.paymentStatus}"`,
      `"${(p.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hotel_payment_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment ledger exported successfully!");
  };

  // Quick Date presets
  const applyDatePreset = (preset: "today" | "month" | "clear") => {
    if (preset === "clear") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "month") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#F5F0EA] text-[#59283A] rounded-full border border-[#E8DDD8] tracking-wide uppercase">
              Module 14 • Financial Operations
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#32765B] font-medium bg-[#E7F1E9] px-2 py-0.5 rounded-full border border-[#C5DFD0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32765B] animate-pulse"></span>
              Live Multi-Channel Settlement Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#59283A] mt-1.5 tracking-tight">
            Payment Management & Cashier Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#82747A] mt-1 max-w-3xl">
            Maintain complete records of all guest transactions: advance deposits, partial payments, final checkout settlements, cash/UPI receipts, and pending balances.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={loading}
            className="border-[#E8DDD8] bg-white hover:bg-[#F5F0EA] text-[#59283A] text-xs h-9 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-[#E8DDD8] bg-white hover:bg-[#F5F0EA] text-[#59283A] text-xs h-9 px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#C4A06A]" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenRecord()}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 text-xs h-9 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C4A06A]" />
            <span>Record Payment</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#82747A] text-xs mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Total Collections</span>
              <Wallet className="w-4 h-4 text-[#C4A06A]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#59283A]">
              ₹{stats.totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#82747A] mt-0.5">{stats.totalCount} completed transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#82747A] text-xs mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Today&apos;s Inflow</span>
              <Calendar className="w-4 h-4 text-[#32765B]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#32765B]">
              ₹{stats.todayCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#82747A] mt-0.5">{stats.todayCount} settlements today</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#82747A] text-xs mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">UPI / QR Digital</span>
              <QrCode className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#59283A]">
              ₹{stats.upiCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#82747A] mt-0.5">{stats.upiCount} instant UPI receipts</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#82747A] text-xs mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider">Cash Counter</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#59283A]">
              ₹{stats.cashCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#82747A] mt-0.5">{stats.cashCount} cash transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[#82747A] text-xs mb-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-[#B54C44]">Pending Balances</span>
              <AlertCircle className="w-4 h-4 text-[#B54C44]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#B54C44]">
              ₹{stats.pendingBalanceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#82747A] mt-0.5">
              {stats.pendingBalanceCount > 0 ? `${stats.pendingBalanceCount} folios due` : "All settled"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module 14 Feature Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab("history");
            setTypeFilter("ALL");
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "history" && typeFilter === "ALL"
              ? "bg-[#59283A] text-white shadow-sm"
              : "bg-[#F5F0EA] text-[#82747A] hover:text-[#59283A] border border-[#E8DDD8]"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Payment History & Ledger ({total})</span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "pending"
              ? "bg-[#59283A] text-white shadow-sm"
              : "bg-[#F5F0EA] text-[#82747A] hover:text-[#59283A] border border-[#E8DDD8]"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#B54C44]" />
          <span>Pending Payments & Unsettled Folios</span>
          {stats.pendingBalanceCount > 0 && (
            <span className="bg-[#B54C44] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {stats.pendingBalanceCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("advance");
            setTypeFilter("ADVANCE");
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "advance" || typeFilter === "ADVANCE"
              ? "bg-[#59283A] text-white shadow-sm"
              : "bg-[#F5F0EA] text-[#82747A] hover:text-[#59283A] border border-[#E8DDD8]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#32765B]" />
          <span>Advance Payments ({stats.advanceCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("channels")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "channels"
              ? "bg-[#59283A] text-white shadow-sm"
              : "bg-[#F5F0EA] text-[#82747A] hover:text-[#59283A] border border-[#E8DDD8]"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Settlement Channels Breakdown</span>
        </button>
      </div>

      {/* Multi-Dimensional Filter Bar (Visible in History & Advance Tabs) */}
      {(activeTab === "history" || activeTab === "advance") && (
        <div className="bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search by Payment Reference #, Guest Name, Room #, UTR / Cheque..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8] text-[#59283A] placeholder:text-[#8E7079]"
              />
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-[#F5F0EA] px-2 py-0.5 rounded border border-[#E8DDD8]">
                <Calendar className="w-3 h-3 text-[#C4A06A]" />
                <span className="text-[10px] font-semibold text-[#82747A]">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-[#59283A] outline-none h-6"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#F5F0EA] px-2 py-0.5 rounded border border-[#E8DDD8]">
                <span className="text-[10px] font-semibold text-[#82747A]">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs text-[#59283A] outline-none h-6"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyDatePreset("today")}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-[#F5F0EA] hover:bg-[#F5F0EA] text-[#59283A] border border-[#E8DDD8]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset("month")}
                  className="px-2 py-1 text-[10px] font-medium rounded bg-[#F5F0EA] hover:bg-[#F5F0EA] text-[#59283A] border border-[#E8DDD8]"
                >
                  This Month
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => applyDatePreset("clear")}
                    className="px-2 py-1 text-[10px] font-medium rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills for Type & Method */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#E8DDD8] text-xs">
            {/* Payment Type */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-semibold text-[#82747A] mr-1">Type:</span>
              {[
                { label: "All Types", val: "ALL" },
                { label: "Advance Payments", val: "ADVANCE" },
                { label: "Partial Payments", val: "PARTIAL" },
                { label: "Final Payments", val: "FINAL" },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => {
                    setTypeFilter(t.val);
                    setPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    typeFilter === t.val
                      ? "bg-[#59283A] text-white"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Payment Method / Channel */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-semibold text-[#82747A] mr-1">Channel:</span>
              {[
                { label: "All", val: "ALL" },
                { label: "UPI", val: "UPI" },
                { label: "Cash", val: "CASH" },
                { label: "Bank Transfer", val: "BANK_TRANSFER" },
                { label: "Other / Card", val: "OTHER" },
              ].map((m) => (
                <button
                  key={m.val}
                  onClick={() => {
                    setMethodFilter(m.val);
                    setPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    methodFilter === m.val
                      ? "bg-[#C4A06A] text-white"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 & 3: PAYMENT LEDGER TABLE */}
      {(activeTab === "history" || activeTab === "advance") && (
        <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col justify-center items-center gap-3">
                <LoadingSpinner text="Loading Payment Collections Ledger..." subtext="Retrieving Cash, UPI, and Bank settlements..." />
                <p className="text-xs text-[#82747A]">Loading payment transactions...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-[#C4A06A] mx-auto opacity-50" />
                <p className="text-sm font-medium text-[#59283A]">No payments matching the selected filters.</p>
                <Button
                  onClick={() => handleOpenRecord()}
                  className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Record New Payment
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-4 py-3.5">Reference & UTR</th>
                      <th className="px-4 py-3.5">Guest & Room</th>
                      <th className="px-4 py-3.5">Transaction Date</th>
                      <th className="px-4 py-3.5">Payment Type</th>
                      <th className="px-4 py-3.5">Channel / Method</th>
                      <th className="px-4 py-3.5">Amount (₹)</th>
                      <th className="px-4 py-3.5">Linked Bill / Stay</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Receipt Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        {/* Reference */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-[#59283A]">{p.paymentReference}</div>
                          {p.transactionReference && (
                            <div className="text-[10px] text-[#8E7079] font-mono mt-0.5">
                              Ref: {p.transactionReference}
                            </div>
                          )}
                        </td>

                        {/* Guest & Room */}
                        <td className="px-4 py-3.5 font-medium text-[#59283A]">
                          <div className="font-semibold text-[#59283A]">
                            {p.booking?.primaryGuest?.fullName || "Walk-In Guest"}
                          </div>
                          <div className="text-[10px] text-[#82747A] flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-[#59283A]">Room {p.booking?.room?.roomNumber}</span>
                            <span>•</span>
                            <span>{p.booking?.primaryGuest?.mobileNumber}</span>
                          </div>
                        </td>

                        {/* Transaction Date */}
                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div className="font-medium text-[#59283A]">
                            {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-[#8E7079]">
                            {new Date(p.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </td>

                        {/* Payment Type */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              p.paymentType === "ADVANCE"
                                ? "bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0]"
                                : p.paymentType === "PARTIAL"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-[#F5F0EA] text-[#59283A] border-[#E8DDD8]"
                            }`}
                          >
                            {p.paymentType === "ADVANCE"
                              ? "Advance Payment"
                              : p.paymentType === "PARTIAL"
                              ? "Partial Payment"
                              : "Final Payment"}
                          </Badge>
                        </td>

                        {/* Channel / Method */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold flex items-center gap-1 w-fit ${
                              p.paymentMethod === "UPI"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : p.paymentMethod === "CASH"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : p.paymentMethod === "BANK_TRANSFER"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {p.paymentMethod === "UPI" && <QrCode className="w-2.5 h-2.5" />}
                            {p.paymentMethod === "CASH" && <Banknote className="w-2.5 h-2.5" />}
                            {p.paymentMethod === "BANK_TRANSFER" && <CreditCard className="w-2.5 h-2.5" />}
                            <span>{p.paymentMethod}</span>
                          </Badge>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 font-mono font-bold text-[#59283A] text-sm">
                          ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Linked Bill / Stay */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-[#82747A]">
                          {p.invoice ? (
                            <span className="text-[#C4A06A] font-semibold block">{p.invoice.invoiceNumber}</span>
                          ) : (
                            <span className="block">{p.booking?.bookingNumber}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0] font-bold"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 inline" />
                            {p.paymentStatus}
                          </Badge>
                        </td>

                        {/* Receipt Voucher Button */}
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleViewReceipt(p)}
                            className="h-7 text-xs bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1 ml-auto"
                          >
                            <Receipt className="w-3 h-3 text-[#C4A06A]" />
                            <span>Receipt</span>
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
              <div className="flex items-center justify-between p-3 border-t border-[#E8DDD8] text-xs text-[#82747A]">
                <div>
                  Showing page {page} of {totalPages} ({total} total transactions)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs border-[#E8DDD8]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 text-xs border-[#E8DDD8]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PENDING PAYMENTS & OUTSTANDING BALANCES */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <div className="bg-[#F5F0EA]/70 border border-[#E8DDD8] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 font-semibold text-[#59283A]">
                <AlertCircle className="w-4 h-4 text-[#B54C44]" />
                <span className="text-sm">Pending Payments & Outstanding Folios Tracking</span>
              </div>
              <p className="text-[#82747A] mt-0.5">
                Stays and checkout invoices with unsettled balances. Front desk cashier can record advance, partial or final settlement directly.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#82747A] block">Total Unsettled Dues</span>
              <span className="text-xl font-bold font-serif text-[#B54C44]">
                ₹{totalPendingOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {loadingPending ? (
                <div className="p-16 flex flex-col justify-center items-center gap-3">
                  <LoadingSpinner text="Loading Payment Collections Ledger..." subtext="Retrieving Cash, UPI, and Bank settlements..." />
                  <p className="text-xs text-[#82747A]">Scanning live folios and invoices for outstanding balances...</p>
                </div>
              ) : pendingPayments.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#32765B] mx-auto opacity-70" />
                  <h4 className="font-serif font-bold text-base text-[#59283A]">All Payments Settled!</h4>
                  <p className="text-xs text-[#82747A]">
                    There are currently no active folios or invoices with outstanding balances.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                      <tr>
                        <th className="px-4 py-3.5">Record Reference</th>
                        <th className="px-4 py-3.5">Guest Information</th>
                        <th className="px-4 py-3.5">Room</th>
                        <th className="px-4 py-3.5">Total Bill Amount</th>
                        <th className="px-4 py-3.5">Amount Paid</th>
                        <th className="px-4 py-3.5">Pending Balance Due</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Settlement Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {pendingPayments.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                          <td className="px-4 py-3.5 font-mono">
                            <span className="font-bold text-[#59283A] block">{item.referenceNumber}</span>
                            <span className="text-[10px] text-[#8E7079] uppercase">
                              {item.recordType === "INVOICE" ? "Finalized Invoice" : "Active Stay Folio"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-[#59283A]">
                            <div className="font-semibold text-[#59283A]">{item.guestName}</div>
                            <div className="text-[10px] text-[#82747A] font-mono">{item.mobileNumber}</div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[#59283A]">
                            Room {item.roomNumber}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[#59283A]">
                            ₹{Number(item.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-medium text-[#32765B]">
                            ₹{Number(item.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-[#B54C44] text-sm">
                            ₹{Number(item.balanceDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            >
                              Pending Payment
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleOpenRecord(item.bookingId, item.balanceDue, "FINAL")}
                              className="h-7 text-xs bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1 ml-auto"
                            >
                              <CreditCard className="w-3 h-3 text-[#C4A06A]" />
                              <span>Collect Payment</span>
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

      {/* TAB 4: SETTLEMENT CHANNELS BREAKDOWN */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-[#E8DDD8] shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#82747A]">UPI / QR Codes</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#59283A]">
                ₹{stats.upiCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">{stats.upiCount} successful transactions</p>
            </div>
            <div className="text-[11px] text-[#82747A] pt-2 border-t border-[#E8DDD8]">
              Supports PhonePe, Google Pay, Paytm, BHIM and dynamic hotel counter QR.
            </div>
          </Card>

          <Card className="bg-white border-[#E8DDD8] shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#82747A]">Cash Drawer</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#59283A]">
                ₹{stats.cashCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">{stats.cashCount} cash transactions</p>
            </div>
            <div className="text-[11px] text-[#82747A] pt-2 border-t border-[#E8DDD8]">
              Physical currency received at front desk and recorded into the Daily Cash Book.
            </div>
          </Card>

          <Card className="bg-white border-[#E8DDD8] shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#82747A]">Bank Transfer & Card</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#59283A]">
                ₹{stats.bankCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">{stats.bankCount} bank settlements</p>
            </div>
            <div className="text-[11px] text-[#82747A] pt-2 border-t border-[#E8DDD8]">
              Credit/Debit card POS machine swipes, IMPS, NEFT and corporate bank transfers.
            </div>
          </Card>

          <Card className="bg-white border-[#E8DDD8] shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#82747A]">Other / Travel Portal</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#59283A]">
                ₹{stats.otherCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">{stats.otherCount} settlements</p>
            </div>
            <div className="text-[11px] text-[#82747A] pt-2 border-t border-[#E8DDD8]">
              OTA voucher payouts, travel agent reconciliations, and custom voucher settlements.
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECORD PAYMENT MODAL                                                      */}
      {/* ========================================================================= */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Front Office Cashier Counter
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Record Guest Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Log advance deposit, partial payment or final checkout settlement into the accounting ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-3 pt-2 text-xs">
            {/* Booking / Stay Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select Stay / Guest *</label>
              <select
                required
                value={paymentForm.bookingId}
                onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    Room {b.room?.roomNumber} — {b.primaryGuest?.fullName} ({b.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type & Method */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Type *</label>
                <select
                  value={paymentForm.paymentType}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="ADVANCE">Advance Deposit</option>
                  <option value="PARTIAL">Partial Payment</option>
                  <option value="FINAL">Final Settlement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Channel *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Card</option>
                  <option value="OTHER">Other / Travel Portal</option>
                </select>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono font-bold bg-[#F5F0EA] border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Transaction Date</label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Transaction Reference / UTR */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Transaction UTR / Reference # (Optional)</label>
              <Input
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="UPI UTR, Cheque No, Bank Ref, Card Auth..."
                className="h-8 text-xs font-mono bg-white border-[#E8DDD8]"
              />
            </div>

            {/* Cashier Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Cashier Notes (Optional)</label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Front desk remarks, payee info..."
                className="h-8 text-xs bg-white border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
              >
                {submitting ? <LoadingSpinner className="w-3.5 h-3.5 mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A06A]" />}
                <span>Record & Generate Receipt</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIGITAL PAYMENT RECEIPT VOUCHER MODAL (PRINTABLE)                        */}
      {/* ========================================================================= */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          {selectedPayment && (
            <div className="space-y-4 text-xs">
              {/* Receipt Header (Printed) */}
              <div className="text-center pb-3 border-b border-[#E8DDD8]">
                <div className="flex items-center justify-center gap-1 text-[#C4A06A] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#82747A]">
                    Grand Horizon Boutique OS
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold text-[#59283A]">Official Payment Receipt Voucher</h2>
                <p className="text-[10px] text-[#8E7079]">Luxury Hotel & Stay Collections • Cashier Desk</p>
                <div className="mt-2 inline-block px-2.5 py-0.5 bg-[#F5F0EA] rounded border border-[#E8DDD8] font-mono text-[11px] font-bold text-[#59283A]">
                  {selectedPayment.paymentReference}
                </div>
              </div>

              {/* Guest & Stay Details */}
              <div className="bg-[#F5F0EA] p-3 rounded-lg border border-[#E8DDD8] space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#82747A]">Primary Guest:</span>
                  <span className="font-bold text-[#59283A]">{selectedPayment.booking?.primaryGuest?.fullName || "Guest"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#82747A]">Mobile Number:</span>
                  <span className="font-mono text-[#59283A]">{selectedPayment.booking?.primaryGuest?.mobileNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#82747A]">Allocated Room:</span>
                  <span className="font-bold text-[#59283A]">Room {selectedPayment.booking?.room?.roomNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#82747A]">Booking Reference:</span>
                  <span className="font-mono text-[#59283A]">{selectedPayment.booking?.bookingNumber}</span>
                </div>
                {selectedPayment.invoice && (
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">Associated Invoice:</span>
                    <span className="font-mono font-bold text-[#C4A06A]">{selectedPayment.invoice.invoiceNumber}</span>
                  </div>
                )}
              </div>

              {/* Transaction Summary */}
              <div className="border border-[#E8DDD8] rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#82747A]">Payment Type:</span>
                  <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] text-[#59283A] border-[#E8DDD8] font-bold">
                    {selectedPayment.paymentType}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#82747A]">Settlement Channel:</span>
                  <span className="font-semibold text-[#59283A] flex items-center gap-1">
                    {selectedPayment.paymentMethod === "UPI" && <QrCode className="w-3 h-3 text-purple-600" />}
                    {selectedPayment.paymentMethod === "CASH" && <Banknote className="w-3 h-3 text-emerald-600" />}
                    {selectedPayment.paymentMethod === "BANK_TRANSFER" && <CreditCard className="w-3 h-3 text-blue-600" />}
                    {selectedPayment.paymentMethod}
                  </span>
                </div>
                {selectedPayment.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-[#82747A]">UTR / Transaction Ref:</span>
                    <span className="font-mono font-semibold text-[#59283A]">{selectedPayment.transactionReference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#82747A]">Transaction Date:</span>
                  <span className="text-[#59283A] font-medium">
                    {new Date(selectedPayment.paymentDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E8DDD8] flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#59283A]">Amount Received:</span>
                  <span className="font-mono text-xl font-bold text-[#32765B]">
                    ₹{Number(selectedPayment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="text-[11px] text-[#82747A] italic bg-[#F5F0EA] p-2 rounded border border-[#E8DDD8]">
                  Notes: {selectedPayment.notes}
                </div>
              )}

              {/* Verified Stamp */}
              <div className="p-2.5 rounded-lg border border-[#C5DFD0] bg-[#E7F1E9] text-center text-[#32765B]">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PAID & VERIFIED • HOTEL FRONT DESK</span>
                </div>
                <div className="text-[10px] text-[#32765B]/80 mt-0.5">
                  Computer Generated Payment Receipt • No Signature Required
                </div>
              </div>

              {/* Footer Controls */}
              <DialogFooter className="pt-2 border-t border-[#E8DDD8] flex items-center justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptModalOpen(false)}
                  className="h-8 text-xs border-[#E8DDD8]"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintReceipt}
                  className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 h-8 text-xs shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>Print Receipt</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
