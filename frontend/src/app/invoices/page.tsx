"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
  Download,
  History,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Palette,
} from "lucide-react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { useAuth } from "@/providers/auth-provider";
import { billingService } from "@/services/billing.service";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { settingsService, defaultReceiptDesign } from "@/services/settings.service";
import { ReceiptDocument } from "@/components/shared/receipt-document";
import { Invoice, Booking, ReceiptDesignConfig } from "@/types";
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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get("bookingId");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [receiptDesign, setReceiptDesign] = useState<ReceiptDesignConfig>(defaultReceiptDesign);

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

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleConfirmDelete = (inv: Invoice) => {
    setInvoiceToDelete(inv);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      setIsDeleting(true);
      const res = await billingService.remove(invoiceToDelete.id);
      toast.success(res.message || `Invoice ${invoiceToDelete.invoiceNumber} deleted and archived`);
      setDeleteModalOpen(false);
      setInvoiceToDelete(null);
      await fetchInvoices();
      if (historyModalOpen) {
        fetchHistory(historyMonth, historyYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete invoice");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHistory = async (m?: number, y?: number) => {
    try {
      setHistoryLoading(true);
      const res = await billingService.getHistory({
        month: m || historyMonth,
        year: y || historyYear,
      });
      setHistoryData(res);
    } catch (err: any) {
      toast.error("Failed to load invoice history");
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
      toast.info("Generating Excel report for Invoices & Billing...");

      let exportItems: any[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await billingService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const allInvoices = await billingService.findAll({ limit: 1000 }).catch(() => ({ items: [] }));
        exportItems = allInvoices.items || [];
        scopeTitle = "All_Invoices";
      }

      if (exportItems.length === 0) {
        toast.warning("No invoices found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Invoices Register");

      // Title Banner
      worksheet.mergeCells("A1:R1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — DIGITAL INVOICES & GST BILLING REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:R2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Records: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Invoice #",
        "Booking #",
        "Guest Name",
        "Mobile Number",
        "Room #",
        "Invoice Date",
        "Room Charges (₹)",
        "Additional Charges (₹)",
        "Subtotal (₹)",
        "Discount (₹)",
        "Tax Amount (₹)",
        "Total Amount (₹)",
        "Total Paid (₹)",
        "Balance Due (₹)",
        "Status",
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

      exportItems.forEach((inv: any, idx: number) => {
        const guestName = inv.guestName || inv.booking?.primaryGuest?.fullName || "Guest";
        const mobile = inv.guestMobile || inv.booking?.primaryGuest?.mobileNumber || "—";
        const roomNum = inv.roomNumber || inv.booking?.room?.roomNumber || "—";
        const bkgNum = inv.bookingNumber || inv.booking?.bookingNumber || "—";
        const dateStr = inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—";
        const totalAmt = Number(inv.totalAmount || inv.finalBill || 0);
        const paidAmt = Number(inv.totalPaid || 0);
        const balAmt = Number(inv.balanceAmount || Math.max(0, totalAmt - paidAmt));

        const row = worksheet.addRow([
          idx + 1,
          inv.invoiceNumber || "—",
          bkgNum,
          guestName,
          mobile,
          roomNum ? `Room ${roomNum}` : "—",
          dateStr,
          Number(inv.roomCharges || 0),
          Number(inv.additionalCharges || 0),
          Number(inv.subtotal || 0),
          Number(inv.discountAmount || 0),
          Number(inv.taxAmount || 0),
          totalAmt,
          paidAmt,
          balAmt,
          inv.invoiceStatus || (balAmt <= 0 ? "PAID" : "PARTIALLY_PAID"),
          inv.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE INVOICE",
          inv.deletedAt ? new Date(inv.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = inv.isDeleted;

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

          if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 5 || colNum === 6 || colNum === 7 || colNum === 16 || colNum === 17 || colNum === 18) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum >= 8 && colNum <= 15) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            cell.numFmt = "₹#,##0.00";
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 6 },
        { width: 18 },
        { width: 18 },
        { width: 22 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 18 },
        { width: 22 },
        { width: 16 },
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hotel_Radha_Palace_Invoices_${scopeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully (${exportItems.length} invoice records)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to generate invoices Excel report");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredHistoryItems = (historyData?.items || []).filter((item: any) => {
    if (historyFilter === "ACTIVE" && item.isDeleted) return false;
    if (historyFilter === "DELETED" && !item.isDeleted) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      item.invoiceNumber?.toLowerCase().includes(q) ||
      item.bookingNumber?.toLowerCase().includes(q) ||
      item.guestName?.toLowerCase().includes(q) ||
      item.guestMobile?.includes(q) ||
      item.roomNumber?.toLowerCase().includes(q)
    );
  });

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
    settingsService.getReceiptDesign().then((res) => {
      if (res) setReceiptDesign(res);
    }).catch(() => {});
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#59283A]">
            Billing & Invoices
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
            Generate GST-compliant checkout bills, manage tax and discount snapshots, and record payment settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="border-[#E8DDD8] bg-white text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs text-xs h-9 px-3"
            title="Review full month invoice history and deleted records"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Invoice History</span>
          </Button>

          {user?.role === "OWNER" && (
            <Link
              href="/receipt-designer"
              className="border border-[#C4A06A] bg-white hover:bg-[#F5F0EA] text-[#59283A] flex items-center gap-1.5 shadow-xs text-xs px-3 h-9 rounded-md font-semibold transition-colors"
              title="Customize Receipt & Invoice Design"
            >
              <Palette className="w-3.5 h-3.5 text-[#C4A06A]" />
              <span>Customize Invoice</span>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportExcel("ALL")}
            disabled={isExporting}
            className="border-[#E8DDD8] bg-white text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs text-xs h-9 px-3"
            title="Export all invoice records to Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Export</span>
          </Button>

          <a
            href="/billing"
            className="border border-[#E8DDD8] bg-[#F5F0EA] hover:bg-[#E8DDD8] text-[#59283A] flex items-center gap-1.5 shadow-sm text-xs px-3 h-9 rounded-md font-medium transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Automatic Guest Folios</span>
          </a>
          <Button
            onClick={() => handleOpenGenerate()}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 shadow-sm text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[#82747A] mr-1">Status:</span>
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
                  : "bg-[#F5F0EA] text-[#82747A] hover:bg-slate-100 border border-[#E8DDD8]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-2.5 top-2.5" />
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
      <Card className="border-[#E8DDD8] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner text="Loading Billing Invoices & Folios..." subtext="Retrieving tax invoices, GST breakdowns, and balances..." />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E7079]">
              No invoices generated yet. Click &quot;Generate Invoice&quot; to bill a stay.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
              <tbody className="divide-y divide-[#E8DDD8]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-[#C4A06A]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#59283A]">
                      <div>{inv.booking?.primaryGuest?.fullName}</div>
                      <div className="text-[10px] text-[#8E7079]">Room {inv.booking?.room?.roomNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-[#82747A]">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ₹{Number(inv.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#82747A]">
                      ₹{Number(inv.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({Number(inv.taxPercentage)}%)
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#59283A]">
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
                            : "bg-slate-100 text-[#7A4652] border-slate-300"
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
                        className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A]"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmDelete(inv)}
                        className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Generate Checkout Invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Compiles room charges and extra orders with GST tax snapshot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmGenerate} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Select Stay Booking *</label>
              <select
                required
                value={generateForm.bookingId}
                onChange={(e) => setGenerateForm({ ...generateForm, bookingId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
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
                <label className="font-semibold text-[#7A4652]">Discount Type</label>
                <select
                  value={generateForm.discountType}
                  onChange={(e) => setGenerateForm({ ...generateForm, discountType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                >
                  <option value="NONE">No Discount</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              {generateForm.discountType !== "NONE" && (
                <div className="space-y-1">
                  <label className="font-semibold text-[#7A4652]">Discount Value</label>
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
                <label className="font-semibold text-[#7A4652]">GST Tax %</label>
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
                <label className="font-semibold text-[#7A4652]">Invoice Date</label>
                <Input
                  type="date"
                  value={generateForm.invoiceDate}
                  onChange={(e) => setGenerateForm({ ...generateForm, invoiceDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#59283A] hover:bg-[#472130] text-white">
                {submitting ? "Calculating..." : "Generate Final Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Printable Invoice Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Designer Quick Link for Owner */}
              {user?.role === "OWNER" && (
                <div className="flex justify-between items-center bg-[#F5F0EA] p-2.5 rounded-xl border border-[#E8DDD8] non-printable text-xs">
                  <span className="text-[#82747A]">
                    Using customized template for <strong>{receiptDesign.hotelName}</strong> ({receiptDesign.invoiceTitle})
                  </span>
                  <Link href="/receipt-designer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] font-semibold border-[#C4A06A] text-[#59283A] bg-white hover:bg-[#F5F0EA] flex items-center gap-1 shadow-xs"
                    >
                      <Palette className="w-3 h-3 text-[#C4A06A]" />
                      <span>Receipt Designer</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Custom Unified Receipt Document */}
              <ReceiptDocument
                config={receiptDesign}
                type="INVOICE"
                invoiceData={selectedInvoice}
                onPrint={() => window.print()}
                hidePrintButton={false}
              />

              {/* Settlement Footer Actions */}
              {Number(selectedInvoice.balanceAmount) > 0 && (
                <div className="pt-3 border-t border-[#E8DDD8] flex items-center justify-end non-printable">
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewModalOpen(false);
                      handleOpenPay(selectedInvoice);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Settle Balance Due (₹{Number(selectedInvoice.balanceAmount).toFixed(2)})
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Settlement Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Record Bill Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Posting payment to invoice {selectedInvoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-[#F5F0EA] rounded-xl space-y-1">
              <div className="flex justify-between text-[#82747A]">
                <span>Invoice Total:</span>
                <span className="font-mono font-semibold">₹{Number(selectedInvoice?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Outstanding Balance:</span>
                <span className="font-mono">₹{Number(selectedInvoice?.balanceAmount || 0)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Payment Amount (₹) *</label>
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
                <label className="font-semibold text-[#7A4652]">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Card / Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Payment Type</label>
                <select
                  value={payForm.paymentType}
                  onChange={(e) => setPayForm({ ...payForm, paymentType: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                >
                  <option value="FINAL">Final Settlement</option>
                  <option value="PARTIAL">Partial Payment</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Notes / Reference</label>
              <Input
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Transaction ID / receipt notes..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
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
              Delete Invoice from System?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] mt-1">
              Are you sure you want to delete invoice{" "}
              <strong className="text-[#59283A] font-semibold">
                {invoiceToDelete?.invoiceNumber}
              </strong>
              {invoiceToDelete?.booking?.primaryGuest?.fullName && ` for ${invoiceToDelete.booking.primaryGuest.fullName}`}
              {invoiceToDelete?.totalAmount ? ` (₹${Number(invoiceToDelete.totalAmount).toLocaleString("en-IN")})` : ""}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This invoice&apos;s complete GST calculations, room charges, payments, and guest dossier will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Database Removal:</strong> The record will be removed from your active invoice tables and registers.
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
                setInvoiceToDelete(null);
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
                  <span>Yes, Delete Invoice</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH INVOICE HISTORY & ARCHIVE MODAL                                */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Invoices &amp; Billing History</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Invoice History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month digital invoices, tax breakdowns, payments, and deleted invoice records.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Invoices</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <Receipt className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active / Settled</div>
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
                placeholder="Search history by invoice #, booking #, guest, room..."
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
                title="Download this month's complete invoice records"
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
                <LoadingSpinner size="md" text="Loading invoice history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No invoices or deletion activity found for {historyData?.monthName || "this month"}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryItems.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      item.isDeleted
                        ? "border-[#B54C44]/30 bg-[#F8E8E5]/20 hover:border-[#B54C44]"
                        : "border-[#E8DDD8] hover:border-[#C4A06A]"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.isDeleted
                            ? "bg-[#F8E8E5] text-[#B54C44]"
                            : "bg-[#E7F1E9] text-[#32765B]"
                        }`}
                      >
                        {item.isDeleted ? <Trash2 className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#59283A] font-mono">{item.invoiceNumber || item.bookingNumber}</span>
                          <span className="font-semibold text-xs text-[#59283A]">
                            {item.guestName || "Guest"}
                          </span>
                          {item.guestMobile && (
                            <span className="text-[11px] text-[#8E7079] font-mono">
                              {item.guestMobile}
                            </span>
                          )}
                          <span className="text-[11px] bg-[#F5F0EA] text-[#59283A] px-2 py-0.5 rounded font-medium">
                            Room {item.roomNumber || "N/A"} ({item.roomType || "Standard"})
                          </span>
                          {item.isDeleted ? (
                            <Badge className="text-[9px] bg-[#F8E8E5] text-[#B54C44] border-[#B54C44]/30">
                              Deleted / Archived
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-semibold ${
                                item.invoiceStatus === "PAID" || item.invoiceStatus === "SETTLED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.invoiceStatus === "PARTIALLY_PAID"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {item.invoiceStatus || "ACTIVE"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#82747A] mt-1 flex-wrap">
                          <span>
                            Room Chg: <strong className="font-mono">₹{Number(item.roomCharges || 0).toLocaleString("en-IN")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Extra: <strong className="font-mono">₹{Number(item.additionalCharges || 0).toLocaleString("en-IN")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Total: <strong className="font-mono text-[#59283A]">₹{Number(item.finalBill || item.totalAmount || 0).toLocaleString("en-IN")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Paid: <strong className="font-mono text-[#32765B]">₹{Number(item.totalPaid || 0).toLocaleString("en-IN")}</strong>
                          </span>
                          <span>•</span>
                          {item.isDeleted ? (
                            <span className="text-[#B54C44] font-medium">
                              Archived: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-IN") : "Recorded"}
                            </span>
                          ) : (
                            <span>
                              Date: {new Date(item.invoiceDate || item.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!item.isDeleted && item.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(item.id)}
                          className="h-7 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                          <span>View Bill</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t border-[#E8DDD8] bg-white flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-[#82747A]">
              Showing {filteredHistoryItems.length} of {historyData?.totalCount || 0} invoice records for {historyData?.monthName || "selected month"}.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHistoryModalOpen(false)}
              className="text-xs border-[#E8DDD8] text-[#59283A]"
            >
              Close Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
