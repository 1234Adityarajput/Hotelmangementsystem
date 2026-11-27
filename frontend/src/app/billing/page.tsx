"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Calculator,
  Plus,
  Search,
  Receipt,
  CreditCard,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Shirt,
  Bed,
  Car,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Eye,
  DollarSign,
  FileText,
  BadgePercent,
  RefreshCw,
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
import { paymentsService } from "@/services/payments.service";
import { itemsService } from "@/services/items.service";
import { settingsService, defaultReceiptDesign } from "@/services/settings.service";
import { ReceiptDocument } from "@/components/shared/receipt-document";
import { BillingComponentBreakdown, Item, ItemCategory, Invoice, Payment, ReceiptDesignConfig } from "@/types";
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

export default function AutomaticBillingPage() {
  const { isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<"folios" | "components" | "invoices" | "payments">("folios");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Folios Data
  const [folios, setFolios] = useState<BillingComponentBreakdown[]>([]);
  const [kpis, setKpis] = useState({
    totalActiveFolios: 0,
    totalLiveRoomCharges: 0,
    totalLiveAdditionalCharges: 0,
    totalPaymentsReceived: 0,
    totalRemainingBalance: 0,
  });

  // Catalog items & categories
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  // Invoices & Payments ledger
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Modals state
  const [selectedFolio, setSelectedFolio] = useState<BillingComponentBreakdown | null>(null);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [folioTaxRates, setFolioTaxRates] = useState<Record<string, number>>({});
  const [currentFolioTaxRate, setCurrentFolioTaxRate] = useState<number>(12);
  const [receiptDesign, setReceiptDesign] = useState<ReceiptDesignConfig>(defaultReceiptDesign);

  // Quick Charge Modal
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    bookingId: "",
    billingComponent: "Food & Beverage",
    itemId: "",
    itemName: "",
    unitPrice: 0,
    quantity: 1,
    notes: "",
  });

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    paymentType: "PARTIAL" as "ADVANCE" | "PARTIAL" | "FINAL",
    paymentMethod: "UPI" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    amount: 0,
    transactionReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    invoiceNumber?: string;
    guestName?: string;
    roomNumber?: string;
    amount?: number;
    type: "INVOICE" | "FOLIO" | "CHARGE";
  } | null>(null);
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

  const handleConfirmDelete = (target: {
    id: string;
    invoiceNumber?: string;
    guestName?: string;
    roomNumber?: string;
    amount?: number;
    type: "INVOICE" | "FOLIO" | "CHARGE";
  }) => {
    setItemToDelete(target);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await billingService.remove(itemToDelete.id);
      toast.success(res.message || "Record deleted and archived in history");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await fetchData();
      if (selectedFolio) {
        try {
          const updated = await billingService.getLiveBillingFolio(selectedFolio.bookingId);
          setSelectedFolio(updated);
        } catch (_) { }
      }
      if (historyModalOpen) {
        fetchHistory(historyMonth, historyYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete billing record");
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
      toast.error("Failed to load billing history");
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
      toast.info("Generating Excel report for Automatic Guest Billing & Folios...");

      let exportItems: any[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await billingService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const allInvoices = await billingService.findAll({ limit: 500 }).catch(() => ({ items: [] }));
        const folioItems = folios.map((f) => ({
          invoiceNumber: `FOLIO-${f.bookingNumber}`,
          bookingNumber: f.bookingNumber,
          guestName: f.guestName,
          guestMobile: f.guestMobile,
          roomNumber: f.roomNumber,
          roomType: f.roomType,
          checkInDate: f.checkInDate,
          expectedCheckOutDate: f.expectedCheckOutDate,
          numberOfNights: f.numberOfNights,
          roomRatePerNight: f.roomRatePerNight,
          roomCharges: f.roomCharges,
          foodAndBeverageCharges: f.foodAndBeverageCharges,
          laundryCharges: f.laundryCharges,
          roomServiceCharges: f.roomServiceCharges,
          extraBedCharges: f.extraBedCharges,
          servicesAndSundries: f.otherServicesCharges + f.additionalItemCharges,
          additionalCharges: f.totalAdditionalCharges,
          subtotal: f.subtotal,
          discountAmount: f.discountAmount,
          taxAmount: f.taxAmount,
          finalBill: f.finalBill,
          totalPaid: f.payments.totalPaymentsReceived,
          balanceAmount: Math.max(0, f.remainingBalance),
          invoiceStatus: f.remainingBalance <= 0 ? "SETTLED" : "ACTIVE_FOLIO",
          isDeleted: false,
          createdAt: f.checkInDate,
        }));

        const invItems = (allInvoices.items || []).map((inv: any) => ({
          invoiceNumber: inv.invoiceNumber,
          bookingNumber: inv.booking?.bookingNumber || "—",
          guestName: inv.booking?.primaryGuest?.fullName || "Guest",
          guestMobile: inv.booking?.primaryGuest?.mobileNumber || "—",
          roomNumber: inv.booking?.room?.roomNumber || "—",
          roomType: inv.booking?.room?.roomType?.name || "Standard",
          checkInDate: inv.booking?.checkInDate || inv.invoiceDate,
          expectedCheckOutDate: inv.booking?.expectedCheckOutDate || inv.invoiceDate,
          numberOfNights: inv.booking?.numberOfNights || 1,
          roomRatePerNight: Number(inv.booking?.roomRatePerNight || 0),
          roomCharges: Number(inv.roomCharges),
          foodAndBeverageCharges: 0,
          laundryCharges: 0,
          roomServiceCharges: 0,
          extraBedCharges: 0,
          servicesAndSundries: Number(inv.additionalCharges),
          additionalCharges: Number(inv.additionalCharges),
          subtotal: Number(inv.subtotal),
          discountAmount: Number(inv.discountAmount),
          taxAmount: Number(inv.taxAmount),
          finalBill: Number(inv.totalAmount),
          totalPaid: Number(inv.totalPaid),
          balanceAmount: Number(inv.balanceAmount),
          invoiceStatus: inv.invoiceStatus,
          isDeleted: false,
          createdAt: inv.createdAt,
        }));

        exportItems = [...folioItems, ...invItems];
        scopeTitle = "All_Billing_Records";
      }

      if (exportItems.length === 0) {
        toast.warning("No billing records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Billing Register");

      // Title Banner
      worksheet.mergeCells("A1:V1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — AUTOMATIC GUEST BILLING & FOLIO REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:V2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Records: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Invoice / Folio #",
        "Booking #",
        "Guest Full Name",
        "Mobile Number",
        "Room #",
        "Room Category",
        "Check-In Date",
        "Nights",
        "Room Rate (₹)",
        "Room Charges (₹)",
        "Additional Charges (₹)",
        "Subtotal (₹)",
        "Discount (₹)",
        "Taxes (₹)",
        "Final Bill (₹)",
        "Payments Received (₹)",
        "Balance Due (₹)",
        "Status",
        "Lifecycle",
        "Bill Date",
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

      exportItems.forEach((b, idx) => {
        const row = worksheet.addRow([
          idx + 1,
          b.invoiceNumber || "—",
          b.bookingNumber || "—",
          b.guestName || "—",
          b.guestMobile || "—",
          b.roomNumber ? `Room ${b.roomNumber}` : "—",
          b.roomType || "Standard Room",
          b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("en-IN") : "—",
          b.numberOfNights || 1,
          Number(b.roomRatePerNight || 0),
          Number(b.roomCharges || 0),
          Number(b.additionalCharges || 0),
          Number(b.subtotal || 0),
          Number(b.discountAmount || 0),
          Number(b.taxAmount || 0),
          Number(b.finalBill || 0),
          Number(b.totalPaid || 0),
          Number(b.balanceAmount || 0),
          b.invoiceStatus || "PENDING",
          b.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE RECORD",
          b.invoiceDate || b.createdAt ? new Date(b.invoiceDate || b.createdAt).toLocaleDateString("en-IN") : "—",
          b.deletedAt ? new Date(b.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = b.isDeleted;

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
            colNum === 5 ||
            colNum === 6 ||
            colNum === 8 ||
            colNum === 9 ||
            colNum === 19 ||
            colNum === 20 ||
            colNum === 21 ||
            colNum === 22
          ) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (
            colNum === 10 ||
            colNum === 11 ||
            colNum === 12 ||
            colNum === 13 ||
            colNum === 14 ||
            colNum === 15 ||
            colNum === 16 ||
            colNum === 17 ||
            colNum === 18
          ) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            cell.numFmt = "₹#,##0.00";
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 7 },
        { width: 18 },
        { width: 16 },
        { width: 22 },
        { width: 16 },
        { width: 14 },
        { width: 18 },
        { width: 14 },
        { width: 9 },
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
        { width: 16 },
        { width: 20 },
        { width: 14 },
        { width: 16 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hotel_Radha_Palace_Billing_${scopeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully (${exportItems.length} billing records)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to generate billing Excel report");
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

  // Fetch all live data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [folioRes, catItems, catList, invRes, payRes, designRes] = await Promise.all([
        billingService.getActiveFolios(search || undefined).catch((e) => {
          console.warn("Active folios fetch error:", e);
          return { folios: [], kpis: null };
        }),
        itemsService.findAllItems().catch(() => []),
        itemsService.findAllCategories().catch(() => []),
        billingService.findAll({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
        paymentsService.findAll({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
        settingsService.getReceiptDesign().catch(() => defaultReceiptDesign),
      ]);

      if (designRes) {
        setReceiptDesign(designRes);
      }

      setFolios(folioRes?.folios || []);
      setKpis(
        folioRes?.kpis || {
          totalActiveFolios: 0,
          totalLiveRoomCharges: 0,
          totalLiveAdditionalCharges: 0,
          totalPaymentsReceived: 0,
          totalRemainingBalance: 0,
        }
      );
      setCatalogItems(Array.isArray(catItems) ? catItems : (catItems as any)?.items || []);
      setCategories(Array.isArray(catList) ? catList : (catList as any)?.items || []);
      setInvoices(invRes?.items || (Array.isArray(invRes) ? invRes : []));
      setPayments(payRes?.items || (Array.isArray(payRes) ? payRes : []));
    } catch (err: any) {
      console.error("Failed to load real-time billing folios:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load real-time billing folios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Live KPI recalculation when GST rates are customized on active folios
  const liveKpis = useMemo(() => {
    let extraTaxDiff = 0;
    folios.forEach((f) => {
      if (folioTaxRates[f.bookingId] !== undefined) {
        const customRate = folioTaxRates[f.bookingId];
        const taxable = Math.max(0, Math.round((f.subtotal - f.discountAmount) * 100) / 100);
        const newTax = Math.round(taxable * (customRate / 100) * 100) / 100;
        extraTaxDiff += (newTax - f.taxAmount);
      }
    });

    return {
      ...kpis,
      totalRemainingBalance: Math.max(0, Math.round((kpis.totalRemainingBalance + extraTaxDiff) * 100) / 100),
    };
  }, [kpis, folios, folioTaxRates]);

  // Open Folio Dossier
  const handleOpenDossier = async (bookingId: string) => {
    try {
      const activeTax = folioTaxRates[bookingId];
      const folio = await billingService.getLiveBillingFolio(bookingId, activeTax);
      setSelectedFolio(folio);
      setCurrentFolioTaxRate(activeTax !== undefined ? activeTax : (folio.taxPercentage !== undefined ? Number(folio.taxPercentage) : 12));
      setDossierModalOpen(true);
    } catch (err) {
      toast.error("Error loading stay folio dossier");
    }
  };

  // Open Charge Modal
  const handleOpenChargeModal = (folio?: BillingComponentBreakdown) => {
    const targetBookingId = folio ? folio.bookingId : folios[0]?.bookingId || "";
    setChargeForm({
      bookingId: targetBookingId,
      billingComponent: "Food & Beverage",
      itemId: "",
      itemName: "",
      unitPrice: 250,
      quantity: 1,
      notes: "",
    });
    setChargeModalOpen(true);
  };

  // Handle Catalog Item Selection in Charge Modal
  const handleSelectCatalogItem = (itemId: string) => {
    if (!itemId) {
      setChargeForm((prev) => ({ ...prev, itemId: "", itemName: "", unitPrice: 0 }));
      return;
    }
    const item = catalogItems.find((i) => i.id === itemId);
    if (item) {
      setChargeForm((prev) => ({
        ...prev,
        itemId: item.id,
        itemName: item.name,
        unitPrice: Number(item.unitPrice),
      }));
    }
  };

  // Submit Quick Post Charge
  const handleSubmitCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeForm.bookingId) {
      toast.error("Please select a guest stay");
      return;
    }
    if (!chargeForm.itemName.trim()) {
      toast.error("Please enter an item or service description");
      return;
    }
    if (Number(chargeForm.unitPrice) < 0 || Number(chargeForm.quantity) <= 0) {
      toast.error("Please enter valid price and quantity");
      return;
    }

    try {
      setSubmitting(true);
      const res = await billingService.quickPostCharge({
        bookingId: chargeForm.bookingId,
        itemId: chargeForm.itemId || undefined,
        itemName: chargeForm.itemName.trim(),
        category: chargeForm.billingComponent,
        unitPrice: Number(chargeForm.unitPrice),
        quantity: Number(chargeForm.quantity),
        notes: chargeForm.notes || undefined,
      });

      toast.success(res.message || "Charge added and billing record updated!");
      setChargeModalOpen(false);
      await fetchData();

      // If dossier modal is open for this booking, refresh it
      if (selectedFolio && selectedFolio.bookingId === chargeForm.bookingId) {
        setSelectedFolio(res.updatedFolio);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post charge");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (folio?: BillingComponentBreakdown) => {
    const targetFolio = folio || folios[0];
    const defaultAmount = targetFolio ? Math.max(0, targetFolio.remainingBalance) : 1000;

    setPaymentForm({
      bookingId: targetFolio?.bookingId || "",
      paymentType: targetFolio && targetFolio.remainingBalance <= 0 ? "PARTIAL" : "FINAL",
      paymentMethod: "UPI",
      amount: defaultAmount,
      transactionReference: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: targetFolio ? `Settlement for Room ${targetFolio.roomNumber} - ${targetFolio.guestName}` : "",
    });
    setPaymentModalOpen(true);
  };

  // Submit Record Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bookingId) {
      toast.error("Please select a guest stay");
      return;
    }
    if (Number(paymentForm.amount) <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    try {
      setSubmitting(true);
      await paymentsService.recordPayment({
        bookingId: paymentForm.bookingId,
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod,
        amount: Number(paymentForm.amount),
        transactionReference: paymentForm.transactionReference || undefined,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes || undefined,
      });

      toast.success(`Payment of ₹${paymentForm.amount} recorded successfully!`);
      setPaymentModalOpen(false);
      await fetchData();

      // If dossier modal is open, refresh it
      if (selectedFolio && selectedFolio.bookingId === paymentForm.bookingId) {
        const updated = await billingService.getLiveBillingFolio(paymentForm.bookingId);
        setSelectedFolio(updated);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Generate / Settle Invoice from Folio
  const handleGenerateInvoice = async (bookingId: string, taxRateToUse?: number) => {
    try {
      const activeTax = taxRateToUse !== undefined
        ? taxRateToUse
        : (folioTaxRates[bookingId] !== undefined ? folioTaxRates[bookingId] : 12.0);

      const inv = await billingService.generateInvoice({
        bookingId,
        taxPercentage: activeTax,
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      toast.success(`GST Invoice ${inv.invoiceNumber} (${activeTax}% GST) generated and archived!`);
      await fetchData();
      if (selectedFolio && selectedFolio.bookingId === bookingId) {
        const updated = await billingService.getLiveBillingFolio(bookingId, activeTax);
        setSelectedFolio(updated);
        setCurrentFolioTaxRate(activeTax);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invoice already exists or could not be generated.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#F5F0EA] text-[#59283A] rounded-full border border-[#E8DDD8] tracking-wide uppercase">
              Module 7 • Financial Operations
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#32765B] font-medium bg-[#E7F1E9] px-2 py-0.5 rounded-full border border-[#C5DFD0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32765B] animate-pulse"></span>
              Live Automatic Calculation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#59283A] mt-1.5 tracking-tight">
            Automatic Guest Billing & Folios
          </h1>
          <p className="text-xs sm:text-sm text-[#82747A] mt-1 max-w-3xl">
            Real-time automated billing calculations based on stay duration, room rates, and dynamic itemized service charges. Record advance, partial, and final payments seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="h-9 px-3.5 text-xs font-semibold border-[#E8DDD8] text-[#59283A] bg-white hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Billing History</span>
          </Button>

          {!isManager && (
            <Link href="/receipt-designer">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold border-[#C4A06A] text-[#59283A] bg-white hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Palette className="w-3.5 h-3.5 text-[#C4A06A]" />
                <span>Customize Receipt</span>
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportExcel("ALL")}
            disabled={isExporting}
            className="h-9 px-3.5 text-xs font-semibold border-[#C4A06A]/60 text-[#59283A] bg-white hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </Button>

          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="border-[#E8DDD8] bg-white hover:bg-[#F5F0EA] text-[#59283A] text-xs h-9 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => handleOpenChargeModal()}
            className="bg-[#C4A06A] hover:bg-[#97734E] text-white text-xs h-9 px-3.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Post Item / Service
          </Button>

          <Button
            onClick={() => handleOpenPaymentModal()}
            className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9 px-3.5 shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Core Calculation Formula Banner */}
      <div className="bg-[#F5F0EA]/70 border border-[#E8DDD8] rounded-xl p-4 text-xs text-[#59283A] shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-[#59283A] mb-2">
          <Sparkles className="w-4 h-4 text-[#C4A06A]" />
          <span>Automatic Billing Calculation Logic & Exact Formulas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2 text-[11px]">
          <div className="bg-white p-2.5 rounded-lg border border-[#E8DDD8]">
            <span className="font-semibold text-[#82747A] block mb-0.5">1. Room Charges</span>
            <code className="text-[#59283A] font-mono text-[11px] font-semibold">
              Price Per Night × Nights
            </code>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#E8DDD8]">
            <span className="font-semibold text-[#82747A] block mb-0.5">2. Additional Charges</span>
            <code className="text-[#59283A] font-mono text-[11px] font-semibold">
              Sum(F&B + Laundry + Room Service + Extra Bed + Services + Sundries)
            </code>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#E8DDD8]">
            <span className="font-semibold text-[#82747A] block mb-0.5">3. Final Bill</span>
            <code className="text-[#59283A] font-mono text-[11px] font-semibold">
              Room Charges + Additional Charges + Taxes − Discount
            </code>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#E8DDD8]">
            <span className="font-semibold text-[#82747A] block mb-0.5">4. Remaining Balance</span>
            <code className="text-[#B54C44] font-mono text-[11px] font-semibold">
              Final Bill − Total Payments Received (Advance + Partial + Final)
            </code>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip (Executive Owner Only) */}
      {!isManager && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
              <span>In-House Folios</span>
              <Building2 className="w-3.5 h-3.5 text-[#C4A06A]" />
            </div>
            <div className="text-xl font-bold font-serif text-[#59283A]">
              {kpis.totalActiveFolios}
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Active checked-in stays</p>
          </Card>

          <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
              <span>Room Charges</span>
              <Bed className="w-3.5 h-3.5 text-[#C4A06A]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#59283A]">
              ₹{kpis.totalLiveRoomCharges.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Stay duration total</p>
          </Card>

          <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
              <span>Additional Charges</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[#C4A06A]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#59283A]">
              ₹{kpis.totalLiveAdditionalCharges.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">F&B, laundry & room items</p>
          </Card>

          <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
              <span>Payments Received</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#32765B]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#32765B]">
              ₹{kpis.totalPaymentsReceived.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Advance + Partial + Final</p>
          </Card>

          <Card className="border-[#E8DDD8] bg-white shadow-sm p-4 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
              <span>Balance Due</span>
              <AlertCircle className="w-3.5 h-3.5 text-[#B54C44]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#B54C44]">
              ₹{liveKpis.totalRemainingBalance.toLocaleString("en-IN")}
            </div>
            <p className="text-[10px] text-[#8E7079] mt-0.5">Unsettled live balances</p>
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E8DDD8] gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("folios")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "folios"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
            }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Active Guest Folios ({folios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("components")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "components"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
            }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Billing Components Matrix ({catalogItems.length} items)</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "invoices"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices Archive ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === "payments"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
            }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments Ledger ({payments.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE GUEST FOLIOS */}
      {/* ========================================================================= */}
      {activeTab === "folios" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search by Guest Name, Room # or Booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs border-[#E8DDD8]"
              />
            </div>
            <div className="text-xs text-[#82747A]">
              Showing <span className="font-semibold text-[#59283A]">{folios.length}</span> active stay folios
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <LoadingSpinner text="Computing Automatic Billings..." subtext="Aggregating room nights, consumed amenities, and payment folios..." />
            </div>
          ) : folios.length === 0 ? (
            <Card className="border-[#E8DDD8] p-12 text-center text-xs text-[#82747A] bg-white">
              <Bed className="w-8 h-8 mx-auto text-[#C4A06A]/40 mb-2" />
              <p className="font-semibold text-[#59283A] text-sm">No Active Stay Folios Found</p>
              <p className="text-[#8E7079] mt-1 max-w-md mx-auto">
                Check in a guest from Front Desk Stays to start tracking live automatic room charges, additional items, and payment settlements.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {folios.map((folio) => {
                const cardTaxRate = folioTaxRates[folio.bookingId] !== undefined ? folioTaxRates[folio.bookingId] : Number(folio.taxPercentage || 12);
                const cardTaxable = Math.max(0, Math.round((Number(folio.subtotal) - Number(folio.discountAmount || 0)) * 100) / 100);
                const cardTaxAmount = Math.round(cardTaxable * (cardTaxRate / 100) * 100) / 100;
                const cardFinalBill = Math.round((cardTaxable + cardTaxAmount) * 100) / 100;
                const cardPaid = Number(folio.payments.totalPaymentsReceived || 0);
                const cardBalance = Math.round((cardFinalBill - cardPaid) * 100) / 100;
                const isCardFullySettled = cardBalance <= 0;

                const cardUpdatedFolio: BillingComponentBreakdown = {
                  ...folio,
                  taxPercentage: cardTaxRate,
                  taxAmount: cardTaxAmount,
                  finalBill: cardFinalBill,
                  remainingBalance: cardBalance,
                  isFullySettled: isCardFullySettled,
                };

                return (
                  <Card
                    key={folio.bookingId}
                    className="border-[#E8DDD8] bg-white shadow-sm hover:border-[#C4A06A] transition-colors overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Top Row: Guest & Room Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E8DDD8]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F5F0EA] text-[#59283A] flex items-center justify-center font-bold text-sm font-mono border border-[#E8DDD8]">
                            {folio.roomNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#59283A]">
                                {folio.guestName}
                              </span>
                              <span className="text-[11px] font-mono text-[#8E7079]">
                                ({folio.bookingNumber})
                              </span>
                              {isCardFullySettled ? (
                                <Badge className="bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0] text-[10px] font-semibold">
                                  Fully Settled
                                </Badge>
                              ) : (
                                <Badge className="bg-[#F8E8E5] text-[#B54C44] border-[#F2D1CB] text-[10px] font-semibold">
                                  Due ₹{cardBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[#82747A] flex items-center gap-3 mt-0.5">
                              <span>{folio.roomType}</span>
                              <span>•</span>
                              <span>{folio.guestMobile}</span>
                              <span>•</span>
                              <span>{folio.numberOfNights} Nights ({folio.checkInDate} to {folio.expectedCheckOutDate})</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenChargeModal(cardUpdatedFolio)}
                            className="h-8 text-[11px] border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#59283A]"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Post Item
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPaymentModal(cardUpdatedFolio)}
                            className="h-8 text-[11px] border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#32765B]"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Record Pay
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleOpenDossier(folio.bookingId)}
                            className="h-8 text-[11px] bg-[#59283A] hover:bg-[#472130] text-white"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Folio
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConfirmDelete({
                              id: folio.bookingId,
                              invoiceNumber: `FOLIO-${folio.bookingNumber}`,
                              guestName: folio.guestName,
                              roomNumber: folio.roomNumber,
                              amount: cardFinalBill,
                              type: "FOLIO",
                            })}
                            className="h-8 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                            title="Delete / Cancel Stay Folio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Middle Row: The Exact 6 Billing Components Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 py-3 bg-[#F5F0EA]/60 -mx-4 sm:-mx-5 px-4 sm:px-5 border-b border-[#E8DDD8] text-[11px]">
                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Room Charges</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{folio.roomCharges.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9px] text-[#82747A] block">
                            ₹{folio.roomRatePerNight} × {folio.numberOfNights}n
                          </span>
                        </div>

                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Food & Beverage</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{folio.foodAndBeverageCharges.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Laundry</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{folio.laundryCharges.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Room Service</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{folio.roomServiceCharges.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Extra Bed & Linen</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{folio.extraBedCharges.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#8E7079] block text-[10px]">Services & Sundries</span>
                          <span className="font-mono font-semibold text-[#59283A]">
                            ₹{(folio.otherServicesCharges + folio.additionalItemCharges).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Totals, Payments and Remaining Balance Formula */}
                      <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4 flex-wrap text-[11px]">
                          <div>
                            <span className="text-[#8E7079]">Subtotal: </span>
                            <span className="font-mono font-semibold text-[#59283A]">
                              ₹{folio.subtotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {folio.discountAmount > 0 && (
                            <div>
                              <span className="text-[#8E7079]">Discount: </span>
                              <span className="font-mono text-[#32765B]">
                                -₹{folio.discountAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 bg-[#F5F0EA] px-2 py-1 rounded-lg border border-[#E8DDD8] flex-wrap sm:flex-nowrap">
                            <span className="text-[#8E7079] font-medium">GST Tax:</span>
                            {/* Preset Dropdown */}
                            <select
                              value={[0, 5, 12, 18, 28].includes(cardTaxRate) ? cardTaxRate : "manual"}
                              onChange={(e) => {
                                if (e.target.value !== "manual") {
                                  const newRate = Number(e.target.value);
                                  setFolioTaxRates((prev) => ({ ...prev, [folio.bookingId]: newRate }));
                                }
                              }}
                              className="text-[11px] font-bold bg-white border border-[#E8DDD8] rounded px-1.5 py-0.5 text-[#59283A] focus:outline-none focus:border-[#59283A] cursor-pointer"
                              title="Select standard GST slab"
                            >
                              <option value={0}>0% GST</option>
                              <option value={5}>5% GST</option>
                              <option value={12}>12% GST</option>
                              <option value={18}>18% GST</option>
                              <option value={28}>28% GST</option>
                              <option value="manual">Manual...</option>
                            </select>

                            {/* Manual Fill % Input */}
                            <div className="flex items-center bg-white border border-[#E8DDD8] rounded px-1.5 py-0.5 focus-within:border-[#59283A] shadow-2xs" title="Manually type GST %">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={cardTaxRate === 0 ? "" : cardTaxRate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    setFolioTaxRates((prev) => ({ ...prev, [folio.bookingId]: 0 }));
                                  } else {
                                    const val = Math.max(0, Math.min(100, Number(raw)));
                                    setFolioTaxRates((prev) => ({ ...prev, [folio.bookingId]: val }));
                                  }
                                }}
                                placeholder="0"
                                className="w-12 h-5 text-[11px] font-mono font-bold text-center text-[#59283A] focus:outline-none"
                              />
                              <span className="text-[10px] font-bold text-[#59283A] pr-0.5">%</span>
                            </div>

                            {/* Manual Fill ₹ Amount Input */}
                            <div className="flex items-center bg-white border border-[#E8DDD8] rounded px-1.5 py-0.5 focus-within:border-[#59283A] shadow-2xs" title="Or manually type direct GST amount in ₹">
                              <span className="text-[10px] text-[#82747A] font-semibold">+₹</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={cardTaxAmount === 0 ? "" : cardTaxAmount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    setFolioTaxRates((prev) => ({ ...prev, [folio.bookingId]: 0 }));
                                  } else {
                                    const amt = Math.max(0, Number(raw));
                                    const pct = cardTaxable > 0 ? Math.round((amt / cardTaxable) * 100 * 100) / 100 : 0;
                                    setFolioTaxRates((prev) => ({ ...prev, [folio.bookingId]: pct }));
                                  }
                                }}
                                placeholder="0"
                                className="w-16 h-5 text-[11px] font-mono font-bold text-right text-[#59283A] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[#82747A] font-semibold">Final Bill: </span>
                            <span className="font-mono font-bold text-[#59283A] text-sm">
                              ₹{cardFinalBill.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-[11px]">
                            <span className="text-[#8E7079]">Paid so far: </span>
                            <span className="font-mono font-semibold text-[#32765B]">
                              ₹{folio.payments.totalPaymentsReceived.toLocaleString("en-IN")}
                            </span>
                            <div className="text-[9px] text-[#8E7079]">
                              Adv: ₹{folio.payments.advancePayments} • Part: ₹{folio.payments.partialPayments} • Fin: ₹{folio.payments.finalPayments}
                            </div>
                          </div>

                          <div className="pl-3 border-l border-[#E8DDD8] text-right">
                            <span className="text-[10px] text-[#8E7079] block uppercase tracking-wider font-semibold">
                              Balance Due
                            </span>
                            <span className={`font-mono text-base font-bold ${cardBalance > 0 ? "text-[#B54C44]" : "text-[#32765B]"}`}>
                              ₹{Math.max(0, cardBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BILLING COMPONENTS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "components" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#E8DDD8] shadow-sm">
            <h3 className="font-serif font-bold text-base text-[#59283A]">
              Standardized Billing Components & Catalog Matrix
            </h3>
            <p className="text-xs text-[#82747A] mt-1">
              Every charge incurred by a guest is automatically routed into one of the 6 core hotel billing components. Click &quot;Add to Stay&quot; on any item to post it directly to an in-house guest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "1. Food & Beverage Charges",
                icon: UtensilsCrossed,
                desc: "Restaurant dining, breakfast buffets, appetizers, entrees, desserts & specialty coffees.",
                filter: (i: Item) =>
                  i.category?.name.includes("Food") ||
                  i.category?.name.includes("Beverage") ||
                  i.name.includes("Breakfast") ||
                  i.name.includes("Sandwich") ||
                  i.name.includes("Coffee"),
              },
              {
                title: "2. Laundry Charges",
                icon: Shirt,
                desc: "In-house garment pressing, steam wash, trouser pressing and formal suit dry-cleaning.",
                filter: (i: Item) =>
                  i.category?.name.includes("Laundry") ||
                  i.name.includes("Shirt") ||
                  i.name.includes("Dry Clean") ||
                  i.name.includes("Wash"),
              },
              {
                title: "3. Room Service Charges",
                icon: UtensilsCrossed,
                desc: "Dedicated in-room dining tray service delivery, late-night room orders and setups.",
                filter: (i: Item) =>
                  i.category?.name.includes("Room Service") ||
                  i.name.includes("Delivery") ||
                  i.name.includes("Table Setup"),
              },
              {
                title: "4. Extra Bed Charges",
                icon: Bed,
                desc: "Rollaway beds with orthopedic mattresses, sanitized baby cribs, plush pillows & duvets.",
                filter: (i: Item) =>
                  i.category?.name.includes("Extra Bed") ||
                  i.name.includes("Bed") ||
                  i.name.includes("Crib") ||
                  i.name.includes("Pillow"),
              },
              {
                title: "5. Other Hotel Services",
                icon: Car,
                desc: "Airport pick-up/drop sedans, chauffeured city taxis, aromatherapy spa & banquet facilities.",
                filter: (i: Item) =>
                  i.category?.name.includes("Travel") ||
                  i.category?.name.includes("Other") ||
                  i.name.includes("Airport") ||
                  i.name.includes("Cab") ||
                  i.name.includes("Spa"),
              },
              {
                title: "6. Additional Item Charges",
                icon: ShoppingBag,
                desc: "Late check-out allowances, sundry goods, luxury toiletry packs and incidental hotel items.",
                filter: (i: Item) =>
                  i.category?.name.includes("Additional") ||
                  i.category?.name.includes("Miscellaneous") ||
                  i.name.includes("Late Check-out") ||
                  i.name.includes("Kit"),
              },
            ].map((comp, idx) => {
              const itemsInComp = catalogItems.filter(comp.filter);
              const CompIcon = comp.icon;
              return (
                <Card key={idx} className="border-[#E8DDD8] bg-white shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-[#E8DDD8]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[#F5F0EA] text-[#59283A]">
                        <CompIcon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-[#59283A]">
                        {comp.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-[11px] text-[#82747A] mt-1">
                      {comp.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {itemsInComp.length === 0 ? (
                        <div className="text-[11px] text-[#8E7079] py-3 text-center">
                          Custom charges can be entered directly via &quot;Post Item&quot;
                        </div>
                      ) : (
                        itemsInComp.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-[#F5F0EA] transition-colors border border-transparent hover:border-[#E8DDD8] text-xs"
                          >
                            <div>
                              <div className="font-medium text-[#59283A]">{item.name}</div>
                              <div className="text-[10px] text-[#8E7079] font-mono">
                                ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setChargeForm({
                                  bookingId: folios[0]?.bookingId || "",
                                  billingComponent: comp.title.split(". ")[1] || "Food & Beverage",
                                  itemId: item.id,
                                  itemName: item.name,
                                  unitPrice: Number(item.unitPrice),
                                  quantity: 1,
                                  notes: "",
                                });
                                setChargeModalOpen(true);
                              }}
                              className="h-7 text-[10px] px-2 text-[#C4A06A] hover:text-[#97734E] hover:bg-[#F5F0EA]"
                            >
                              Add to Stay +
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICES ARCHIVE */}
      {/* ========================================================================= */}
      {activeTab === "invoices" && (
        <Card className="border-[#E8DDD8] bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#E8DDD8] bg-[#F5F0EA]/40 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-serif font-bold text-[#59283A]">
                  Digital Invoices & GST Bills Archive
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  All generated tax invoices with room charges, itemized service charges, GST snapshots, and settlement statuses.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8E7079]">
                No finalized invoices archived yet. Generate invoices from active stay folios or at checkout.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[10px] font-semibold border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Guest & Room</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Room Charges</th>
                      <th className="px-4 py-3">Additional Charges</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Total Paid</th>
                      <th className="px-4 py-3">Balance Due</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#C4A06A]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#59283A]">
                          <div>{inv.booking?.primaryGuest?.fullName || "Guest"}</div>
                          <div className="text-[10px] text-[#8E7079]">
                            Room {inv.booking?.room?.roomNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#82747A]">
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          ₹{Number(inv.roomCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          ₹{Number(inv.additionalCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#59283A]">
                          ₹{Number(inv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#32765B]">
                          ₹{Number(inv.totalPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {Number(inv.balanceAmount) > 0 ? (
                            <span className="text-[#B54C44]">
                              ₹{Number(inv.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-[#32765B]">₹0.00</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-[10px] ${inv.invoiceStatus === "PAID"
                                ? "bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0]"
                                : inv.invoiceStatus === "PARTIALLY_PAID"
                                  ? "bg-[#F6EDDC] text-[#A97832] border-[#E8D9BD]"
                                  : "bg-[#F8E8E5] text-[#B54C44] border-[#F2D1CB]"
                              }`}
                          >
                            {inv.invoiceStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDossier(inv.bookingId)}
                            className="h-7 text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A]"
                            title="View Folio Dossier"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                            Folio
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleConfirmDelete({
                                id: inv.id,
                                invoiceNumber: inv.invoiceNumber,
                                guestName: inv.booking?.primaryGuest?.fullName || "Guest",
                                roomNumber: inv.booking?.room?.roomNumber || "N/A",
                                amount: Number(inv.totalAmount),
                                type: "INVOICE",
                              })
                            }
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PAYMENTS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <Card className="border-[#E8DDD8] bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#E8DDD8] bg-[#F5F0EA]/40 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-serif font-bold text-[#59283A]">
                  Multi-Tier Payment Ledger
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  Complete transaction log of Advance Deposits, Partial Payments, and Final Checkout Settlements.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8E7079]">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[10px] font-semibold border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-4 py-3">Payment Ref</th>
                      <th className="px-4 py-3">Guest & Room</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Payment Tier</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Transaction Ref</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#C4A06A]">
                          {p.paymentReference}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#59283A]">
                          <div>{p.booking?.primaryGuest?.fullName || "Guest"}</div>
                          <div className="text-[10px] text-[#8E7079]">
                            Room {p.booking?.room?.roomNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#82747A]">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-[10px] font-medium ${p.paymentType === "ADVANCE"
                                ? "bg-[#E9EFF3] text-[#627D91] border-[#CCD9E2]"
                                : p.paymentType === "PARTIAL"
                                  ? "bg-[#F6EDDC] text-[#A97832] border-[#E8D9BD]"
                                  : "bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0]"
                              }`}
                          >
                            {p.paymentType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#59283A]">
                          {p.paymentMethod}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#32765B]">
                          ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-mono text-[#82747A]">
                          {p.transactionReference || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0] text-[10px]">
                            {p.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LIVE STAY FOLIO DOSSIER & PRINTABLE BILL */}
      {/* ========================================================================= */}
      <Dialog open={dossierModalOpen} onOpenChange={setDossierModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-[#E8DDD8] p-6 sm:p-8">
          {selectedFolio && (() => {
            const liveTaxRate = Number(currentFolioTaxRate !== undefined ? currentFolioTaxRate : (selectedFolio.taxPercentage || 12));
            const liveTaxable = Math.max(0, Math.round((Number(selectedFolio.subtotal) - Number(selectedFolio.discountAmount || 0)) * 100) / 100);
            const liveTaxAmount = Math.round(liveTaxable * (liveTaxRate / 100) * 100) / 100;
            const liveFinalBill = Math.round((liveTaxable + liveTaxAmount) * 100) / 100;
            const livePaid = Number(selectedFolio.payments.totalPaymentsReceived || 0);
            const liveRemainingBalance = Math.round((liveFinalBill - livePaid) * 100) / 100;
            const isLiveFullySettled = liveRemainingBalance <= 0;

            const liveUpdatedFolio: BillingComponentBreakdown = {
              ...selectedFolio,
              taxPercentage: liveTaxRate,
              taxAmount: liveTaxAmount,
              finalBill: liveFinalBill,
              remainingBalance: liveRemainingBalance,
              isFullySettled: isLiveFullySettled,
            };

            return (
              <div className="space-y-4 printable-folio">
                {/* Live GST Tax Configurator Bar & Designer Shortcut */}
                <div className="bg-[#F5F0EA] p-3 rounded-xl border border-[#E8DDD8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs non-printable">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#59283A] text-xs">GST Tax Rate:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={currentFolioTaxRate === 0 ? "" : currentFolioTaxRate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setCurrentFolioTaxRate(0);
                            if (selectedFolio) {
                              setFolioTaxRates((prev) => ({ ...prev, [selectedFolio.bookingId]: 0 }));
                            }
                          } else {
                            const val = Math.max(0, Math.min(100, Number(raw)));
                            setCurrentFolioTaxRate(val);
                            if (selectedFolio) {
                              setFolioTaxRates((prev) => ({ ...prev, [selectedFolio.bookingId]: val }));
                            }
                          }
                        }}
                        placeholder="0"
                        className="w-16 h-7 text-xs font-mono font-bold text-right border-[#E8DDD8] focus:border-[#59283A] bg-white"
                      />
                      <span className="text-xs font-bold text-[#59283A]">%</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setCurrentFolioTaxRate(rate);
                            if (selectedFolio) {
                              setFolioTaxRates((prev) => ({ ...prev, [selectedFolio.bookingId]: rate }));
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${Number(currentFolioTaxRate) === rate
                              ? "bg-[#59283A] text-white shadow-xs"
                              : "bg-white text-[#8E7079] hover:bg-[#E8DDD8] hover:text-[#59283A] border border-[#E8DDD8]"
                            }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-[#82747A] font-mono ml-1">
                      Tax: ₹{liveTaxAmount.toFixed(2)} | Final Bill: ₹{liveFinalBill.toFixed(2)}
                    </span>
                  </div>

                  {!isManager && (
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
                  )}
                </div>

                {/* Unified Custom Receipt Document Component */}
                <ReceiptDocument
                  config={receiptDesign}
                  type="FOLIO"
                  folioData={liveUpdatedFolio}
                  onPrint={() => window.print()}
                  hidePrintButton={true}
                />

                {/* Modal Footer with Actions */}
                <div className="pt-4 border-t border-[#E8DDD8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 non-printable">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#59283A] text-xs h-9"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print Stay Folio Bill
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDossierModalOpen(false);
                        handleOpenChargeModal(selectedFolio);
                      }}
                      className="border-[#E8DDD8] text-xs h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Charge
                    </Button>

                    <Button
                      onClick={() => {
                        setDossierModalOpen(false);
                        handleOpenPaymentModal(liveUpdatedFolio);
                      }}
                      className="bg-[#32765B] hover:bg-[#286049] text-white text-xs h-9"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Record Settlement
                    </Button>

                    {!selectedFolio.existingInvoice && (
                      <Button
                        onClick={() => handleGenerateInvoice(selectedFolio.bookingId, liveTaxRate)}
                        className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
                      >
                        <Receipt className="w-3.5 h-3.5 mr-1.5" />
                        Generate Invoice ({liveTaxRate}% GST)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK POST ITEM / SERVICE CHARGE */}
      {/* ========================================================================= */}
      <Dialog open={chargeModalOpen} onOpenChange={setChargeModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              Post Item or Service Charge
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Add F&B, laundry, room service or extra bed charges to an active guest stay. The guest&apos;s billing record will automatically recalculate immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCharge} className="space-y-4 text-xs">
            {/* Select Guest Stay */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select Guest Stay *</label>
              <select
                value={chargeForm.bookingId}
                onChange={(e) => setChargeForm({ ...chargeForm, bookingId: e.target.value })}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
                required
              >
                <option value="">-- Choose In-House Guest --</option>
                {folios.map((f) => (
                  <option key={f.bookingId} value={f.bookingId}>
                    Room {f.roomNumber} — {f.guestName} ({f.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Billing Component */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Billing Component Category *</label>
              <select
                value={chargeForm.billingComponent}
                onChange={(e) => setChargeForm({ ...chargeForm, billingComponent: e.target.value })}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                <option value="Food & Beverage">Food and Beverage Charges</option>
                <option value="Laundry">Laundry Charges</option>
                <option value="Room Service">Room Service Charges</option>
                <option value="Extra Bed">Extra Bed Charges</option>
                <option value="Other Hotel Services">Other Hotel Services</option>
                <option value="Additional Items">Additional Item Charges</option>
              </select>
            </div>

            {/* Select from catalog (optional) */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Select from Catalog (Optional)</label>
              <select
                value={chargeForm.itemId}
                onChange={(e) => handleSelectCatalogItem(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                <option value="">-- Or enter custom service below --</option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (₹{Number(item.unitPrice)})
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Item or Service Description *</label>
              <Input
                type="text"
                placeholder="e.g. Club Sandwich & Juice, Extra Rollaway Bed, Shirt Press"
                value={chargeForm.itemName}
                onChange={(e) => setChargeForm({ ...chargeForm, itemName: e.target.value })}
                className="h-9 text-xs border-[#E8DDD8]"
                required
              />
            </div>

            {/* Unit Price & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Unit Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={chargeForm.unitPrice}
                  onChange={(e) => setChargeForm({ ...chargeForm, unitPrice: Number(e.target.value) })}
                  className="h-9 text-xs font-mono border-[#E8DDD8]"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Quantity *</label>
                <Input
                  type="number"
                  min="1"
                  value={chargeForm.quantity}
                  onChange={(e) => setChargeForm({ ...chargeForm, quantity: Number(e.target.value) })}
                  className="h-9 text-xs font-mono border-[#E8DDD8]"
                  required
                />
              </div>
            </div>

            {/* Calculated Total preview */}
            <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8] flex justify-between items-center text-xs">
              <span className="text-[#82747A]">Total Charge to Post:</span>
              <span className="font-mono font-bold text-sm text-[#59283A]">
                ₹{(Number(chargeForm.unitPrice) * Number(chargeForm.quantity)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Special Notes / Room Order Details</label>
              <Input
                type="text"
                placeholder="e.g. Delivered to room, extra ketchup requested"
                value={chargeForm.notes}
                onChange={(e) => setChargeForm({ ...chargeForm, notes: e.target.value })}
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChargeModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
              >
                {submitting ? "Posting..." : "Post Charge to Folio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYMENT (ADVANCE / PARTIAL / FINAL) */}
      {/* ========================================================================= */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              Record Guest Stay Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Log Advance Deposits, Partial Installments, or Final Checkout Settlements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            {/* Select Stay */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select Guest Stay *</label>
              <select
                value={paymentForm.bookingId}
                onChange={(e) => {
                  const bId = e.target.value;
                  const f = folios.find((item) => item.bookingId === bId);
                  setPaymentForm({
                    ...paymentForm,
                    bookingId: bId,
                    amount: f ? Math.max(0, f.remainingBalance) : paymentForm.amount,
                  });
                }}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
                required
              >
                <option value="">-- Choose In-House Guest --</option>
                {folios.map((f) => (
                  <option key={f.bookingId} value={f.bookingId}>
                    Room {f.roomNumber} — {f.guestName} (Due: ₹{Math.max(0, f.remainingBalance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Tier (Advance, Partial, Final) */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Payment Tier / Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ADVANCE", label: "Advance Deposit" },
                  { id: "PARTIAL", label: "Partial Payment" },
                  { id: "FINAL", label: "Final Settlement" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentType: tier.id as any,
                      })
                    }
                    className={`py-2 px-1 text-center rounded-lg border text-[11px] font-semibold transition-colors ${paymentForm.paymentType === tier.id
                        ? "bg-[#59283A] text-white border-[#59283A]"
                        : "bg-white text-[#82747A] border-[#E8DDD8] hover:bg-[#F5F0EA]"
                      }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash at Front Desk</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="OTHER">Credit / Debit Card (via POS)</option>
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Amount to Settle (₹) *</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="h-9 text-xs font-mono font-bold text-[#32765B] border-[#E8DDD8]"
                required
              />
            </div>

            {/* Transaction Reference */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Transaction Reference / UTR #</label>
              <Input
                type="text"
                placeholder="e.g. UPI Ref / Card Last 4 digits / Cheque #"
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Payment Notes</label>
              <Input
                type="text"
                placeholder="e.g. Settled at checkout, front-desk counter 1"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#32765B] hover:bg-[#286049] text-white text-xs h-9"
              >
                {submitting ? "Processing..." : "Confirm & Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL (AUDIT ARCHIVED)                       */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="text-center sm:text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-[#F8E8E5] border border-[#F2D1CB] text-[#B54C44] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
              Delete Billing Record from Register?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] mt-1">
              Are you sure you want to delete{" "}
              <strong className="text-[#59283A] font-semibold">
                {itemToDelete?.invoiceNumber || "this billing record"}
              </strong>
              {itemToDelete?.guestName && ` for ${itemToDelete.guestName}`}
              {itemToDelete?.amount ? ` (₹${itemToDelete.amount.toLocaleString("en-IN")})` : ""}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This billing record&apos;s complete invoice number, room charges, additional itemized services, payments, and guest dossier will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Database Removal:</strong> The record will be safely removed from your active invoices and folio registers.
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
                setItemToDelete(null);
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
                  <span>Yes, Delete Record</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: FULL MONTH BILLING HISTORY & ARCHIVE MODAL                       */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Billing Activity &amp; Invoices</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Billing History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month guest bills, itemized folios, settlements, and deleted invoices.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Billing Records</div>
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
                title="Download this month's complete billing records"
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
                <LoadingSpinner size="md" text="Loading billing history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No billing or deletion activity found for {historyData?.monthName || "this month"}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryItems.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${item.isDeleted
                        ? "border-[#B54C44]/30 bg-[#F8E8E5]/20 hover:border-[#B54C44]"
                        : "border-[#E8DDD8] hover:border-[#C4A06A]"
                      }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${item.isDeleted
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
                              className={`text-[9px] font-semibold ${item.invoiceStatus === "PAID" || item.invoiceStatus === "SETTLED"
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
                              Created: {new Date(item.createdAt || item.invoiceDate).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.bookingId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDossier(item.bookingId)}
                          className="h-7 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                          <span>Dossier</span>
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
              Showing {filteredHistoryItems.length} of {historyData?.totalCount || 0} billing records for {historyData?.monthName || "selected month"}.
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
