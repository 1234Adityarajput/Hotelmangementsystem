"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ReceiptDesignConfig } from "@/types";
import { settingsService, defaultReceiptDesign } from "@/services/settings.service";
import { ReceiptDocument } from "@/components/shared/receipt-document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Palette,
  RotateCcw,
  Save,
  Printer,
  Sparkles,
  Building2,
  FileText,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Receipt,
  Layout,
  Type,
  Eye,
  Lock,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { compressImage, readFileAsDataUrl } from "@/services/upload.service";

// Predefined Luxury Color Palettes
const COLOR_PRESETS = [
  {
    name: "Royal Maroon & Gold",
    theme: "#59283A",
    accent: "#C4A06A",
    bgClass: "bg-[#59283A]",
  },
  {
    name: "Heritage Gold & Bronze",
    theme: "#7A5C1E",
    accent: "#D4AF37",
    bgClass: "bg-[#7A5C1E]",
  },
  {
    name: "Emerald Forest",
    theme: "#1E5D42",
    accent: "#6EE7B7",
    bgClass: "bg-[#1E5D42]",
  },
  {
    name: "Royal Navy & Ice",
    theme: "#1E3A8A",
    accent: "#93C5FD",
    bgClass: "bg-[#1E3A8A]",
  },
  {
    name: "Charcoal Executive",
    theme: "#1F2937",
    accent: "#9CA3AF",
    bgClass: "bg-[#1F2937]",
  },
  {
    name: "Ruby Crimson",
    theme: "#881337",
    accent: "#FDA4AF",
    bgClass: "bg-[#881337]",
  },
];

// Sample preview folio data for real-time visualization
const SAMPLE_FOLIO_DATA = {
  bookingId: "sample-1",
  bookingNumber: "BKG-2026-108",
  guestName: "Vikramaditya Sharma",
  guestMobile: "+91 98234 56789",
  roomNumber: "204",
  roomType: "Executive Heritage Suite",
  checkInDate: "27-11-2026",
  expectedCheckOutDate: "30-11-2026",
  actualCheckInAt: null,
  actualCheckOutAt: null,
  numberOfNights: 3,
  roomRatePerNight: 3500,
  roomCharges: 10500,
  itemizedCharges: [
    {
      id: "it-1",
      name: "Continental Breakfast Buffet (2 Guests)",
      category: "Food & Beverage",
      billingComponent: "FOOD_AND_BEVERAGE",
      date: "28-11-2026",
      time: "08:30 AM",
      unitPrice: 450,
      quantity: 2,
      totalAmount: 900,
    },
    {
      id: "it-2",
      name: "Express Laundry & Dry Cleaning",
      category: "Laundry",
      billingComponent: "LAUNDRY",
      date: "28-11-2026",
      time: "04:15 PM",
      unitPrice: 350,
      quantity: 1,
      totalAmount: 350,
    },
    {
      id: "it-3",
      name: "In-Room Gourmet Dinner",
      category: "Room Service",
      billingComponent: "ROOM_SERVICE",
      date: "29-11-2026",
      time: "09:00 PM",
      unitPrice: 850,
      quantity: 1,
      totalAmount: 850,
    },
  ],
  foodAndBeverageCharges: 900,
  laundryCharges: 350,
  roomServiceCharges: 850,
  extraBedCharges: 0,
  otherServicesCharges: 0,
  additionalItemCharges: 0,
  totalAdditionalCharges: 2100,
  subtotal: 12600,
  discountAmount: 600,
  taxPercentage: 12,
  taxAmount: 1440,
  finalBill: 13440,
  payments: {
    advanceAmount: 4000,
    totalPaymentsReceived: 4000,
    paymentHistory: [
      {
        id: "p-1",
        paymentReference: "PAY-001",
        amount: 4000,
        paymentMethod: "UPI",
        paymentType: "ADVANCE",
        paymentDate: "2026-11-27",
        transactionReference: "UPI-REF-981240192",
      },
    ],
  },
  remainingBalance: 9440,
  isFullySettled: false,
};

// Sample preview invoice data
const SAMPLE_INVOICE_DATA = {
  id: "inv-sample",
  invoiceNumber: "INV-2026-089",
  invoiceDate: new Date().toISOString(),
  bookingNumber: "BKG-2026-108",
  guestName: "Vikramaditya Sharma",
  roomNumber: "204",
  roomType: "Executive Heritage Suite",
  roomCharges: 10500,
  subtotal: 12600,
  discountAmount: 600,
  taxPercentage: 12,
  taxAmount: 1440,
  totalAmount: 13440,
  totalPaid: 13440,
  balanceAmount: 0,
  paymentStatus: "PAID",
  booking: {
    bookingNumber: "BKG-2026-108",
    numberOfNights: 3,
    roomRatePerNight: 3500,
    checkInDate: "2026-11-27",
    expectedCheckOutDate: "2026-11-30",
    primaryGuest: {
      fullName: "Vikramaditya Sharma",
      mobileNumber: "+91 98234 56789",
      city: "New Delhi",
      country: "India",
    },
    room: {
      roomNumber: "204",
      roomType: {
        name: "Executive Heritage Suite",
      },
    },
    bookingItems: [
      {
        id: "bi-1",
        itemNameSnapshot: "Continental Breakfast Buffet (2 Guests)",
        quantity: 2,
        unitPrice: 450,
        totalAmount: 900,
      },
      {
        id: "bi-2",
        itemNameSnapshot: "Express Laundry & Dry Cleaning",
        quantity: 1,
        unitPrice: 350,
        totalAmount: 350,
      },
      {
        id: "bi-3",
        itemNameSnapshot: "In-Room Gourmet Dinner",
        quantity: 1,
        unitPrice: 850,
        totalAmount: 850,
      },
    ],
  },
};

export default function ReceiptDesignerPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const [config, setConfig] = useState<ReceiptDesignConfig>(defaultReceiptDesign);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"THEME" | "HOTEL" | "TITLES" | "TOGGLES" | "POLICIES">("THEME");
  const [previewDocType, setPreviewDocType] = useState<"FOLIO" | "INVOICE">("FOLIO");
  const [previewBillingMode, setPreviewBillingMode] = useState<"WITH_GST" | "WITHOUT_GST">("WITH_GST");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchDesign() {
      try {
        setLoading(true);
        const data = await settingsService.getReceiptDesign();
        if (data) {
          setConfig(data);
        }
      } catch (err: any) {
        console.error("Failed to load receipt design:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDesign();
  }, []);

  const handleUpdate = (field: keyof ReceiptDesignConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPalette = (theme: string, accent: string) => {
    setConfig((prev) => ({
      ...prev,
      themeColor: theme,
      accentColor: accent,
    }));
    toast.info("Applied color palette to receipt theme");
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 10MB.");
      return;
    }

    try {
      setUploadingLogo(true);
      let dataUrl: string;
      if (file.type === "image/svg+xml") {
        dataUrl = await readFileAsDataUrl(file);
      } else {
        // High quality crisp compression for receipt letterhead emblems (~100-300KB)
        dataUrl = await compressImage(file, 800, 0.9);
      }

      setConfig((prev) => ({
        ...prev,
        logoUrl: dataUrl,
        showLogo: true,
      }));

      toast.success("Logo uploaded successfully! Preview updated.", {
        description: "Click 'Save & Publish Design' or 'Save Now' to persist.",
      });
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      toast.error("Failed to process image: " + (err.message || "Unknown error"));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetLogoToDefault = () => {
    setConfig((prev) => ({
      ...prev,
      logoUrl: "/radha-krishna-logo.jpg",
      showLogo: true,
    }));
    toast.info("Logo reset to default Radha Krishna emblem");
  };

  const handleReset = () => {
    if (confirm("Reset receipt design back to default settings? Any unsaved changes will be lost.")) {
      setConfig(defaultReceiptDesign);
      toast.info("Reset to default configuration");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updateReceiptDesign(config);
      toast.success("Receipt & Invoice Design Saved Successfully!", {
        description: "Both Automatic Billing Folios and Tax Invoices will now use this customized design.",
      });
    } catch (err: any) {
      toast.error("Failed to save receipt design: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // If user is not Owner, render access restriction card
  if (!isOwner && !loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#59283A]">
          Owner Privileges Required
        </h2>
        <p className="text-sm text-[#82747A] leading-relaxed">
          The <strong>Receipt & Invoice Designer</strong> module is an administrative studio exclusive to the Hotel Owner account.
          Managers have read-only access to generate and print receipts based on the Owner&apos;s configured branding.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/billing">
            <Button variant="outline" className="border-[#C4A06A] text-[#59283A]">
              Return to Automatic Billing
            </Button>
          </Link>
          <Link href="/invoices">
            <Button className="bg-[#59283A] text-white">
              Go to Invoices
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8DDD8] pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#59283A] text-[#C4A06A] flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-[#59283A]">
                Receipt & Invoice Designer
              </h1>
              <p className="text-xs text-[#82747A] mt-0.5">
                Owner Module: Customize layout, colors, letterhead, and tax formats for Automatic Billing Folios and Tax Invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Default
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA]"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Test
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || loading}
            onClick={handleSave}
            className="bg-[#59283A] hover:bg-[#431D2B] text-white text-xs font-semibold shadow-md"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Saving..." : "Save & Publish Design"}
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Left Control Panel (5 cols) | Right Live Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: DESIGN CONTROLS & STUDIO PANEL                               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4 print:hidden">
          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
            <button
              onClick={() => setActiveTab("THEME")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "THEME"
                  ? "bg-white text-[#59283A] shadow-sm"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme</span>
            </button>
            <button
              onClick={() => setActiveTab("HOTEL")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "HOTEL"
                  ? "bg-white text-[#59283A] shadow-sm"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hotel Info</span>
            </button>
            <button
              onClick={() => setActiveTab("TITLES")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "TITLES"
                  ? "bg-white text-[#59283A] shadow-sm"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Titles</span>
            </button>
            <button
              onClick={() => setActiveTab("TOGGLES")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "TOGGLES"
                  ? "bg-white text-[#59283A] shadow-sm"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sections</span>
            </button>
            <button
              onClick={() => setActiveTab("POLICIES")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "POLICIES"
                  ? "bg-white text-[#59283A] shadow-sm"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Policies</span>
            </button>
          </div>

          {/* Tab 1: Theme & Colors */}
          {activeTab === "THEME" && (
            <div className="bg-white rounded-xl border border-[#E8DDD8] p-5 space-y-5 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#C4A06A]" />
                  <span>Curated Luxury Color Schemes</span>
                </h3>
                <p className="text-xs text-[#82747A] mt-0.5">
                  Choose a signature luxury palette or enter custom hex color codes.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPalette(preset.theme, preset.accent)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                        config.themeColor.toLowerCase() === preset.theme.toLowerCase()
                          ? "border-[#59283A] ring-2 ring-[#59283A]/20 bg-[#F5F0EA]/60"
                          : "border-[#E8DDD8] hover:bg-[#F5F0EA]/40"
                      }`}
                    >
                      <div className="flex -space-x-1">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                          style={{ backgroundColor: preset.theme }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="font-medium text-[#59283A] truncate text-[11px]">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Hex Inputs */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E8DDD8]">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#59283A]">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate("themeColor", e.target.value)}
                      className="w-8 h-8 rounded border border-[#E8DDD8] cursor-pointer p-0.5"
                    />
                    <Input
                      value={config.themeColor}
                      onChange={(e) => handleUpdate("themeColor", e.target.value)}
                      placeholder="#59283A"
                      className="font-mono text-xs uppercase h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#59283A]">
                    Accent Highlight Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor || "#C4A06A"}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdate("accentColor", e.target.value)}
                      className="w-8 h-8 rounded border border-[#E8DDD8] cursor-pointer p-0.5"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={(e) => handleUpdate("accentColor", e.target.value)}
                      placeholder="#C4A06A"
                      className="font-mono text-xs uppercase h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Header Style Selector */}
              <div className="space-y-2 pt-3 border-t border-[#E8DDD8]">
                <label className="text-xs font-semibold text-[#59283A] flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>Letterhead Layout Structure</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate("headerStyle", "MODERN_SPLIT")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      config.headerStyle === "MODERN_SPLIT"
                        ? "border-[#59283A] bg-[#59283A] text-white shadow-sm"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    <span className="block text-xs font-bold">Modern Split</span>
                    <span className="block text-[10px] opacity-80 mt-0.5">Left & Right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate("headerStyle", "CLASSIC_CENTERED")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      config.headerStyle === "CLASSIC_CENTERED"
                        ? "border-[#59283A] bg-[#59283A] text-white shadow-sm"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    <span className="block text-xs font-bold">Classic Centered</span>
                    <span className="block text-[10px] opacity-80 mt-0.5">Centered Crest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate("headerStyle", "MINIMAL_EXECUTIVE")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      config.headerStyle === "MINIMAL_EXECUTIVE"
                        ? "border-[#59283A] bg-[#59283A] text-white shadow-sm"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    <span className="block text-xs font-bold">Executive</span>
                    <span className="block text-[10px] opacity-80 mt-0.5">Sleek & Compact</span>
                  </button>
                </div>
              </div>

              {/* Typography Font Family */}
              <div className="space-y-2 pt-3 border-t border-[#E8DDD8]">
                <label className="text-xs font-semibold text-[#59283A] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>Typography Family</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate("fontFamily", "SERIF")}
                    className={`p-2 rounded-lg border text-center font-serif text-xs font-bold transition-all ${
                      config.fontFamily === "SERIF"
                        ? "border-[#59283A] bg-[#59283A] text-white"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    Luxury Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate("fontFamily", "SANS")}
                    className={`p-2 rounded-lg border text-center font-sans text-xs font-bold transition-all ${
                      config.fontFamily === "SANS"
                        ? "border-[#59283A] bg-[#59283A] text-white"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    Modern Sans
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate("fontFamily", "MONO")}
                    className={`p-2 rounded-lg border text-center font-mono text-xs font-bold transition-all ${
                      config.fontFamily === "MONO"
                        ? "border-[#59283A] bg-[#59283A] text-white"
                        : "border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                    }`}
                  >
                    Ledger Mono
                  </button>
                </div>
              </div>

              {/* Accent Border Option */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8DDD8]">
                <div>
                  <span className="text-xs font-semibold text-[#59283A] block">
                    Accent Top Border
                  </span>
                  <span className="text-[11px] text-[#82747A] block">
                    Render a solid luxury accent bar across the document header
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showBorderAccent}
                  onChange={(e) => handleUpdate("showBorderAccent", e.target.checked)}
                  className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Hotel Identity & Tax IDs */}
          {activeTab === "HOTEL" && (
            <div className="bg-white rounded-xl border border-[#E8DDD8] p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C4A06A]" />
                <span>Hotel Branding & Contact Info</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#59283A]">Hotel Name *</label>
                <Input
                  value={config.hotelName}
                  onChange={(e) => handleUpdate("hotelName", e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#59283A]">Tagline / Subtitle</label>
                <Input
                  value={config.tagline}
                  onChange={(e) => handleUpdate("tagline", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#59283A]">Official Address</label>
                <textarea
                  value={config.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate("address", e.target.value)}
                  className="w-full text-xs rounded-md border border-[#E8DDD8] p-2 bg-white focus:outline-none focus:border-[#59283A] resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">Phone / Mobile</label>
                  <Input
                    value={config.phone}
                    onChange={(e) => handleUpdate("phone", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">Official Email</label>
                  <Input
                    value={config.email}
                    onChange={(e) => handleUpdate("email", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">GSTIN (Tax ID)</label>
                  <Input
                    value={config.gstin}
                    onChange={(e) => handleUpdate("gstin", e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">PAN Number</label>
                  <Input
                    value={config.panNumber}
                    onChange={(e) => handleUpdate("panNumber", e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">State & State Code</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      value={config.state}
                      onChange={(e) => handleUpdate("state", e.target.value)}
                      placeholder="Delhi"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={config.stateCode}
                      onChange={(e) => handleUpdate("stateCode", e.target.value)}
                      placeholder="07"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">FSSAI License #</label>
                  <Input
                    value={config.fssaiNumber}
                    onChange={(e) => handleUpdate("fssaiNumber", e.target.value)}
                    placeholder="10019011000123"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Logo Settings & Image Uploader */}
              <div className="pt-3 border-t border-[#E8DDD8] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#59283A] block">
                      Display Logo on Document
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Include hotel crest / emblem on official receipts and invoices
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showLogo}
                    onChange={(e) => handleUpdate("showLogo", e.target.checked)}
                    className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                  />
                </div>

                {config.showLogo && (
                  <div className="space-y-3 bg-[#FDFBF9] p-3.5 rounded-xl border border-[#E8DDD8]">
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />

                    {/* Logo Preview & Information Card */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-xl overflow-hidden border-2 shadow-sm flex-shrink-0 relative flex items-center justify-center bg-white"
                        style={{
                          borderColor: config.accentColor || "#C4A06A",
                          backgroundColor: config.themeColor || "#59283A",
                        }}
                      >
                        {config.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={config.logoUrl}
                            alt="Hotel Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#59283A] truncate">
                            {config.logoUrl?.startsWith("data:")
                              ? "Custom Uploaded Logo"
                              : config.logoUrl === "/radha-krishna-logo.jpg"
                              ? "Default Royal Palace Crest"
                              : "Custom Logo Path / URL"}
                          </span>
                          {config.logoUrl?.startsWith("data:") && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded">
                              Uploaded
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#82747A] mt-0.5">
                          PNG, JPG, SVG, WebP supported (max 10MB)
                        </p>
                      </div>
                    </div>

                    {/* Upload button & Reset button */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#59283A] hover:bg-[#431D2B] text-white text-xs font-semibold h-8 px-3 shadow-sm flex items-center gap-1.5"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Optimizing & Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#C4A06A]" />
                            <span>Upload Image from Device</span>
                          </>
                        )}
                      </Button>

                      {config.logoUrl !== "/radha-krishna-logo.jpg" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetLogoToDefault}
                          className="text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A] hover:bg-white h-8 px-2.5"
                          title="Reset to default Radha Krishna emblem"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Default Logo
                        </Button>
                      )}
                    </div>

                    {/* Fallback Text Input */}
                    <div className="space-y-1 pt-2 border-t border-[#E8DDD8]/70">
                      <label className="text-[11px] text-[#82747A] block">
                        Or specify Image URL / Local Path
                      </label>
                      <Input
                        value={config.logoUrl}
                        onChange={(e) => handleUpdate("logoUrl", e.target.value)}
                        placeholder="/radha-krishna-logo.jpg"
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Titles & Numbering */}
          {activeTab === "TITLES" && (
            <div className="bg-white rounded-xl border border-[#E8DDD8] p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C4A06A]" />
                <span>Document Titles & References</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#59283A]">
                  Stay Folio Document Title (Automatic Billing)
                </label>
                <Input
                  value={config.folioTitle}
                  onChange={(e) => handleUpdate("folioTitle", e.target.value)}
                  placeholder="OFFICIAL GUEST STAY FOLIO & BILL"
                  className="h-8 text-xs font-semibold uppercase"
                />
                <span className="text-[11px] text-[#82747A] block">
                  Displayed as the primary document header in Automatic Billing Stay Folios.
                </span>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-[#59283A]">
                  Official Tax Invoice Title (Invoices Section)
                </label>
                <Input
                  value={config.invoiceTitle}
                  onChange={(e) => handleUpdate("invoiceTitle", e.target.value)}
                  placeholder="TAX INVOICE & GST BILL"
                  className="h-8 text-xs font-semibold uppercase"
                />
                <span className="text-[11px] text-[#82747A] block">
                  Displayed on GST Tax Invoices generated from the Invoices ledger.
                </span>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-[#59283A]">
                  Receipt Number Prefix
                </label>
                <Input
                  value={config.receiptNumberPrefix}
                  onChange={(e) => handleUpdate("receiptNumberPrefix", e.target.value)}
                  placeholder="HRP"
                  className="h-8 text-xs font-mono uppercase w-32"
                />
                <span className="text-[11px] text-[#82747A] block">
                  Prefix placed before reference numbers (e.g., HRP-BKG-101).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">Default Check-In</label>
                  <Input
                    value={config.checkInTime}
                    onChange={(e) => handleUpdate("checkInTime", e.target.value)}
                    placeholder="12:00 PM"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#59283A]">Default Check-Out</label>
                  <Input
                    value={config.checkOutTime}
                    onChange={(e) => handleUpdate("checkOutTime", e.target.value)}
                    placeholder="11:00 AM"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Section & Content Toggles */}
          {activeTab === "TOGGLES" && (
            <div className="bg-white rounded-xl border border-[#E8DDD8] p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C4A06A]" />
                <span>Document Content & Section Toggles</span>
              </h3>

              <div className="space-y-3 divide-y divide-[#E8DDD8]">
                {/* CGST / SGST breakdown */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs font-semibold text-[#59283A] block">
                      CGST & SGST Split Table
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Splits total GST into half Central GST and half State GST (Indian tax norm)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showGstBreakdown}
                    onChange={(e) => handleUpdate("showGstBreakdown", e.target.checked)}
                    className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                  />
                </div>

                {/* Itemized Services */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs font-semibold text-[#59283A] block">
                      Itemized Services & Sundries
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Show detailed breakdown of food, room service, laundry, extra bed
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showItemizedServices}
                    onChange={(e) => handleUpdate("showItemizedServices", e.target.checked)}
                    className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                  />
                </div>

                {/* Check In / Out Timings */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs font-semibold text-[#59283A] block">
                      Check-In & Check-Out Timings
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Display standard arrival & departure policy timings on bill header
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showCheckInOutTimings}
                    onChange={(e) => handleUpdate("showCheckInOutTimings", e.target.checked)}
                    className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                  />
                </div>

                {/* Authorized Signatory Block */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="text-xs font-semibold text-[#59283A] block">
                      Authorized Signatory Block
                    </span>
                    <span className="text-[11px] text-[#82747A] block">
                      Include official stamp placeholder and manager signature line
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.showSignatory}
                    onChange={(e) => handleUpdate("showSignatory", e.target.checked)}
                    className="w-4 h-4 rounded text-[#59283A] cursor-pointer"
                  />
                </div>
              </div>

              {config.showSignatory && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8DDD8]">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#59283A]">Signatory Title</label>
                    <Input
                      value={config.signatoryTitle}
                      onChange={(e) => handleUpdate("signatoryTitle", e.target.value)}
                      placeholder="Authorized Signatory"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#59283A]">Department</label>
                    <Input
                      value={config.signatoryDepartment}
                      onChange={(e) => handleUpdate("signatoryDepartment", e.target.value)}
                      placeholder="Front Office & Accounts"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Policies, Terms & Thank You Note */}
          {activeTab === "POLICIES" && (
            <div className="bg-white rounded-xl border border-[#E8DDD8] p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#59283A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C4A06A]" />
                <span>Terms, Conditions & Disclaimers</span>
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#59283A]">
                  Terms & Conditions (Point-wise)
                </label>
                <textarea
                  value={config.termsAndConditions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate("termsAndConditions", e.target.value)}
                  className="w-full text-xs leading-relaxed rounded-md border border-[#E8DDD8] p-2 bg-white focus:outline-none focus:border-[#59283A] resize-none font-sans"
                  rows={5}
                />
                <span className="text-[11px] text-[#82747A] block">
                  Printed in the legal notes section at the bottom of the bill.
                </span>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-[#59283A]">
                  Thank You Closing Message
                </label>
                <Input
                  value={config.thankYouMessage}
                  onChange={(e) => handleUpdate("thankYouMessage", e.target.value)}
                  placeholder="Thank you for choosing Hotel Radha Palace!"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-[#59283A]">
                  Electronic Generation Notice / Note
                </label>
                <Input
                  value={config.customNotes}
                  onChange={(e) => handleUpdate("customNotes", e.target.value)}
                  placeholder="Computer generated bill. No signature required if electronically verified."
                  className="h-8 text-xs text-slate-500"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Reminder */}
          <div className="p-4 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#59283A] block">
                Ready to publish changes?
              </span>
              <span className="text-[11px] text-[#82747A] block">
                Saved designs instantly apply to both Automatic Billing and Invoices.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[#59283A] hover:bg-[#431D2B] text-white text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {saving ? "Saving..." : "Save Now"}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE INTERACTIVE DOCUMENT PREVIEW                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 sticky top-6 space-y-3 print:col-span-12 print:static print:w-full print:p-0">
          {/* Preview Document Switcher & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm print:hidden">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#C4A06A]" />
              <span className="text-xs font-bold text-[#59283A]">Live Visual Preview:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Folio vs Invoice */}
              <div className="flex items-center gap-1 p-1 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                <button
                  type="button"
                  onClick={() => setPreviewDocType("FOLIO")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    previewDocType === "FOLIO"
                      ? "bg-[#59283A] text-white shadow-sm"
                      : "text-[#82747A] hover:text-[#59283A]"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Stay Folio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocType("INVOICE")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    previewDocType === "INVOICE"
                      ? "bg-[#59283A] text-white shadow-sm"
                      : "text-[#82747A] hover:text-[#59283A]"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
              </div>

              {/* With GST vs Without GST */}
              <div className="flex items-center gap-1 p-1 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                <button
                  type="button"
                  onClick={() => setPreviewBillingMode("WITH_GST")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    previewBillingMode === "WITH_GST"
                      ? "bg-[#59283A] text-white shadow-sm"
                      : "text-[#82747A] hover:text-[#59283A]"
                  }`}
                >
                  <span>🧾 With GST</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBillingMode("WITHOUT_GST")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    previewBillingMode === "WITHOUT_GST"
                      ? "bg-[#32765B] text-white shadow-sm"
                      : "text-[#82747A] hover:text-[#59283A]"
                  }`}
                >
                  <span>📄 Without GST</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Document Component in Live Preview Mode */}
          <div className="overflow-hidden border border-[#E8DDD8] rounded-2xl shadow-xl bg-slate-100 p-2 sm:p-4 print:p-0 print:m-0 print:border-none print:shadow-none print:bg-white print:overflow-visible">
            <ReceiptDocument
              config={config}
              type={previewDocType}
              folioData={previewDocType === "FOLIO" ? (SAMPLE_FOLIO_DATA as any) : null}
              invoiceData={previewDocType === "INVOICE" ? SAMPLE_INVOICE_DATA : null}
              billingMode={previewBillingMode}
              hidePrintButton={false}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
