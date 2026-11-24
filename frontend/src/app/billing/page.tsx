"use client";

import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { billingService } from "@/services/billing.service";
import { paymentsService } from "@/services/payments.service";
import { itemsService } from "@/services/items.service";
import { BillingComponentBreakdown, Item, ItemCategory, Invoice, Payment } from "@/types";
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

  // Fetch all live data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [folioRes, catItems, catList, invRes, payRes] = await Promise.all([
        billingService.getActiveFolios(search || undefined).catch((e) => {
          console.warn("Active folios fetch error:", e);
          return { folios: [], kpis: null };
        }),
        itemsService.findAllItems().catch(() => []),
        itemsService.findAllCategories().catch(() => []),
        billingService.findAll({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
        paymentsService.findAll({ limit: 50 }).catch(() => ({ items: [], total: 0 })),
      ]);

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

  // Open Folio Dossier
  const handleOpenDossier = async (bookingId: string) => {
    try {
      const folio = await billingService.getLiveBillingFolio(bookingId);
      setSelectedFolio(folio);
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
  const handleGenerateInvoice = async (bookingId: string) => {
    try {
      const inv = await billingService.generateInvoice({
        bookingId,
        taxPercentage: 12.0,
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      toast.success(`GST Invoice ${inv.invoiceNumber} generated and archived!`);
      await fetchData();
      if (selectedFolio && selectedFolio.bookingId === bookingId) {
        const updated = await billingService.getLiveBillingFolio(bookingId);
        setSelectedFolio(updated);
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

      {/* KPI Metrics Strip */}
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
            ₹{kpis.totalRemainingBalance.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] text-[#8E7079] mt-0.5">Unsettled live balances</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E8DDD8] gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("folios")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "folios"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Active Guest Folios ({folios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("components")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "components"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Billing Components Matrix ({catalogItems.length} items)</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "invoices"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices Archive ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "payments"
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
              <LoadingSpinner className="w-7 h-7 text-[#C4A06A]" />
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
              {folios.map((folio) => (
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
                            {folio.isFullySettled ? (
                              <Badge className="bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0] text-[10px] font-semibold">
                                Fully Settled
                              </Badge>
                            ) : (
                              <Badge className="bg-[#F8E8E5] text-[#B54C44] border-[#F2D1CB] text-[10px] font-semibold">
                                Due ₹{folio.remainingBalance.toLocaleString("en-IN")}
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
                          onClick={() => handleOpenChargeModal(folio)}
                          className="h-8 text-[11px] border-[#E8DDD8] hover:bg-[#F5F0EA] text-[#59283A]"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Post Item
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPaymentModal(folio)}
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
                        <div>
                          <span className="text-[#8E7079]">Taxes ({folio.taxPercentage}%): </span>
                          <span className="font-mono text-[#82747A]">
                            +₹{folio.taxAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#82747A] font-semibold">Final Bill: </span>
                          <span className="font-mono font-bold text-[#59283A] text-sm">
                            ₹{folio.finalBill.toLocaleString("en-IN")}
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
                          <span className={`font-mono text-base font-bold ${folio.remainingBalance > 0 ? "text-[#B54C44]" : "text-[#32765B]"}`}>
                            ₹{Math.max(0, folio.remainingBalance).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
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
                            className={`text-[10px] ${
                              inv.invoiceStatus === "PAID"
                                ? "bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0]"
                                : inv.invoiceStatus === "PARTIALLY_PAID"
                                ? "bg-[#F6EDDC] text-[#A97832] border-[#E8D9BD]"
                                : "bg-[#F8E8E5] text-[#B54C44] border-[#F2D1CB]"
                            }`}
                          >
                            {inv.invoiceStatus}
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
                            className={`text-[10px] font-medium ${
                              p.paymentType === "ADVANCE"
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
          {selectedFolio && (
            <div className="space-y-6 printable-folio">
              {/* Hotel Luxury Letterhead */}
              <div className="border-b-2 border-[#59283A] pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-[#59283A]">
                    Grand Horizon Hotel
                  </h2>
                  <p className="text-xs text-[#82747A] mt-0.5">
                    Boutique Luxury Hospitality Management • Official Stay Folio
                  </p>
                  <p className="text-[11px] text-[#8E7079] mt-0.5">
                    GSTIN: 07AAAAA0000A1Z5 • 108 Heritage Boulevard, New Delhi, India
                  </p>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-semibold text-[#82747A] uppercase tracking-wider">
                    Folio Reference
                  </div>
                  <div className="text-lg font-mono font-bold text-[#C4A06A]">
                    {selectedFolio.bookingNumber}
                  </div>
                  <div className="text-[11px] text-[#8E7079] mt-0.5">
                    Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </div>
                </div>
              </div>

              {/* Guest & Stay Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F5F0EA] border border-[#E8DDD8] text-xs">
                <div>
                  <span className="text-[#8E7079] block text-[10px]">Guest Name</span>
                  <span className="font-bold text-[#59283A]">{selectedFolio.guestName}</span>
                  <span className="text-[10px] text-[#82747A] block">{selectedFolio.guestMobile}</span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px]">Room Allocated</span>
                  <span className="font-bold text-[#59283A]">Room {selectedFolio.roomNumber}</span>
                  <span className="text-[10px] text-[#82747A] block">{selectedFolio.roomType}</span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px]">Stay Duration</span>
                  <span className="font-bold text-[#59283A]">{selectedFolio.numberOfNights} Nights</span>
                  <span className="text-[10px] text-[#82747A] block">
                    {selectedFolio.checkInDate} to {selectedFolio.expectedCheckOutDate}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px]">Folio Status</span>
                  {selectedFolio.isFullySettled ? (
                    <span className="font-bold text-[#32765B] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled
                    </span>
                  ) : (
                    <span className="font-bold text-[#B54C44] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Balance Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Component 1: Room Charges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#59283A] flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5 text-[#C4A06A]" />
                    <span>Component 1: Room Stay Charges</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-[#59283A]">
                    ₹{selectedFolio.roomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white border border-[#E8DDD8] rounded-lg p-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-medium text-[#59283A]">
                      {selectedFolio.roomType} — Room {selectedFolio.roomNumber}
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Daily Room Tariff: ₹{selectedFolio.roomRatePerNight} × {selectedFolio.numberOfNights} Nights
                    </span>
                  </div>
                  <span className="font-mono font-semibold">
                    ₹{selectedFolio.roomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Component 2: Additional Services & Items Ledger */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#59283A] flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#C4A06A]" />
                    <span>Component 2: Additional Items & Services ({selectedFolio.itemizedCharges.length})</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-[#59283A]">
                    ₹{selectedFolio.totalAdditionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {selectedFolio.itemizedCharges.length === 0 ? (
                  <div className="p-4 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8] text-xs text-[#8E7079] text-center">
                    No additional room service, food, laundry, or extra bed charges posted yet.
                  </div>
                ) : (
                  <div className="border border-[#E8DDD8] rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F5F0EA] text-[#82747A] text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2">Item / Service Description</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Date & Time</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DDD8]">
                        {selectedFolio.itemizedCharges.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F5F0EA]/50">
                            <td className="px-3 py-2 font-medium text-[#59283A]">
                              {item.name}
                              {item.notes && <span className="text-[10px] text-[#8E7079] block">{item.notes}</span>}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-[9px] border-[#E8DDD8] text-[#82747A]">
                                {item.billingComponent}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-[#82747A] font-mono text-[10px]">
                              {item.date} {item.time && `• ${item.time}`}
                            </td>
                            <td className="px-3 py-2 font-mono text-right">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 font-mono text-center">{item.quantity}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-right text-[#59283A]">
                              ₹{item.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Exact Formula Breakdown Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Component Breakdown Summary */}
                <div className="bg-[#F5F0EA] p-4 rounded-xl border border-[#E8DDD8] space-y-2 text-xs">
                  <div className="font-bold text-[#59283A] text-xs uppercase tracking-wider pb-1 border-b border-[#E8DDD8]">
                    Component Breakdown Summary
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Room Charges:</span>
                    <span className="font-mono font-semibold text-[#59283A]">
                      ₹{selectedFolio.roomCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Food & Beverage Charges:</span>
                    <span className="font-mono text-[#59283A]">
                      ₹{selectedFolio.foodAndBeverageCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Laundry Charges:</span>
                    <span className="font-mono text-[#59283A]">
                      ₹{selectedFolio.laundryCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Room Service Charges:</span>
                    <span className="font-mono text-[#59283A]">
                      ₹{selectedFolio.roomServiceCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Extra Bed Charges:</span>
                    <span className="font-mono text-[#59283A]">
                      ₹{selectedFolio.extraBedCharges.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#82747A]">
                    <span>• Other Hotel Services & Sundries:</span>
                    <span className="font-mono text-[#59283A]">
                      ₹{(selectedFolio.otherServicesCharges + selectedFolio.additionalItemCharges).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E8DDD8] flex justify-between font-bold text-[#59283A]">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedFolio.subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Right: Tax, Final Bill & Balance Box */}
                <div className="bg-[#F5F0EA]/50 p-4 rounded-xl border border-[#E8DDD8] space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="font-bold text-[#59283A] text-xs uppercase tracking-wider pb-1 border-b border-[#E8DDD8]">
                      Final Bill Calculation
                    </div>
                    <div className="flex justify-between text-[#82747A]">
                      <span>Subtotal:</span>
                      <span className="font-mono">₹{selectedFolio.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedFolio.discountAmount > 0 && (
                      <div className="flex justify-between text-[#32765B]">
                        <span>Discount:</span>
                        <span className="font-mono">-₹{selectedFolio.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#82747A]">
                      <span>Applicable Taxes ({selectedFolio.taxPercentage}% GST):</span>
                      <span className="font-mono">+₹{selectedFolio.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#E8DDD8] flex justify-between text-base font-bold text-[#59283A]">
                      <span>Final Bill:</span>
                      <span className="font-mono">₹{selectedFolio.finalBill.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t-2 border-[#59283A] space-y-1">
                    <div className="flex justify-between text-xs text-[#32765B]">
                      <span>Total Payments Received:</span>
                      <span className="font-mono font-bold">
                        -₹{selectedFolio.payments.totalPaymentsReceived.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#59283A]">
                      <span>Remaining Balance:</span>
                      <span
                        className={`font-mono text-lg ${
                          selectedFolio.remainingBalance > 0 ? "text-[#B54C44]" : "text-[#32765B]"
                        }`}
                      >
                        ₹{Math.max(0, selectedFolio.remainingBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Timeline */}
              {selectedFolio.payments.paymentList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#59283A] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#32765B]" />
                    <span>Payments Received Timeline</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedFolio.payments.paymentList.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg border border-[#E8DDD8] bg-white text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[#E7F1E9] text-[#32765B] border-[#C5DFD0] text-[9px]">
                            {p.type}
                          </Badge>
                          <span className="font-mono font-bold text-[#32765B]">
                            ₹{p.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#82747A] flex justify-between">
                          <span>Via {p.method}</span>
                          <span className="font-mono">{p.date}</span>
                        </div>
                        <div className="text-[9px] font-mono text-[#8E7079] truncate">
                          {p.reference}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      handleOpenPaymentModal(selectedFolio);
                    }}
                    className="bg-[#32765B] hover:bg-[#286049] text-white text-xs h-9"
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    Record Settlement
                  </Button>

                  {!selectedFolio.existingInvoice && (
                    <Button
                      onClick={() => handleGenerateInvoice(selectedFolio.bookingId)}
                      className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1.5" />
                      Generate Invoice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
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
                    className={`py-2 px-1 text-center rounded-lg border text-[11px] font-semibold transition-colors ${
                      paymentForm.paymentType === tier.id
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
    </div>
  );
}
