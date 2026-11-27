"use client";

import React from "react";
import Image from "next/image";
import { ReceiptDesignConfig, BillingComponentBreakdown } from "@/types";
import {
  Bed,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Printer,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReceiptDocumentProps {
  config: ReceiptDesignConfig;
  type: "FOLIO" | "INVOICE";
  folioData?: BillingComponentBreakdown | null;
  invoiceData?: any | null;
  onPrint?: () => void;
  hidePrintButton?: boolean;
  className?: string;
}

export function ReceiptDocument({
  config,
  type,
  folioData,
  invoiceData,
  onPrint,
  hidePrintButton = false,
  className = "",
}: ReceiptDocumentProps) {
  // Normalize data between Folio and Invoice
  const isFolio = type === "FOLIO";

  const guestName = isFolio
    ? folioData?.guestName || "Guest Name"
    : invoiceData?.booking?.primaryGuest?.fullName || invoiceData?.guestName || "Guest Name";

  const guestMobile = isFolio
    ? folioData?.guestMobile || ""
    : invoiceData?.booking?.primaryGuest?.mobileNumber || invoiceData?.guestMobile || "";

  const guestCity = isFolio
    ? ""
    : invoiceData?.booking?.primaryGuest?.city
    ? `${invoiceData?.booking?.primaryGuest?.city}, ${invoiceData?.booking?.primaryGuest?.country || "India"}`
    : "";

  const roomNumber = isFolio
    ? folioData?.roomNumber || "101"
    : invoiceData?.booking?.room?.roomNumber || invoiceData?.roomNumber || "101";

  const roomType = isFolio
    ? folioData?.roomType || "Deluxe Room"
    : invoiceData?.booking?.room?.roomType?.name || invoiceData?.roomType || "Deluxe Room";

  const referenceNumber = isFolio
    ? `${config.receiptNumberPrefix ? `${config.receiptNumberPrefix}-` : ""}${folioData?.bookingNumber || "FOL-001"}`
    : invoiceData?.invoiceNumber || `${config.receiptNumberPrefix ? `${config.receiptNumberPrefix}-` : ""}INV-001`;

  const bookingRef = isFolio
    ? folioData?.bookingNumber || "BKG-001"
    : invoiceData?.booking?.bookingNumber || "BKG-001";

  const checkInDate = isFolio
    ? folioData?.checkInDate || "2026-11-27"
    : invoiceData?.booking?.checkInDate
    ? new Date(invoiceData.booking.checkInDate).toLocaleDateString("en-IN")
    : "2026-11-27";

  const checkOutDate = isFolio
    ? folioData?.expectedCheckOutDate || "2026-11-28"
    : invoiceData?.booking?.expectedCheckOutDate
    ? new Date(invoiceData.booking.expectedCheckOutDate).toLocaleDateString("en-IN")
    : "2026-11-28";

  const numberOfNights = isFolio
    ? folioData?.numberOfNights || 1
    : invoiceData?.booking?.numberOfNights || 1;

  const roomRatePerNight = isFolio
    ? folioData?.roomRatePerNight || 1200
    : Number(invoiceData?.booking?.roomRatePerNight || invoiceData?.roomCharges || 1200) / (numberOfNights || 1);

  const roomCharges = isFolio
    ? folioData?.roomCharges || 1200
    : Number(invoiceData?.roomCharges || 1200);

  const subtotal = isFolio
    ? folioData?.subtotal || 1200
    : Number(invoiceData?.subtotal || 1200);

  const discountAmount = isFolio
    ? folioData?.discountAmount || 0
    : Number(invoiceData?.discountAmount || 0);

  const taxPercentage = isFolio
    ? Number(folioData?.taxPercentage !== undefined ? folioData.taxPercentage : 12)
    : Number(invoiceData?.taxPercentage !== undefined ? invoiceData.taxPercentage : 12);

  const taxAmount = isFolio
    ? folioData?.taxAmount !== undefined
      ? folioData.taxAmount
      : Math.round((subtotal - discountAmount) * (taxPercentage / 100) * 100) / 100
    : Number(invoiceData?.taxAmount || 0);

  const totalAmount = isFolio
    ? folioData?.finalBill || Math.round((subtotal - discountAmount + taxAmount) * 100) / 100
    : Number(invoiceData?.totalAmount || 0);

  const totalPaid = isFolio
    ? Number(folioData?.payments?.totalPaymentsReceived || 0)
    : Number(invoiceData?.totalPaid || 0);

  const balanceAmount = isFolio
    ? folioData?.remainingBalance !== undefined
      ? folioData.remainingBalance
      : Math.max(0, Math.round((totalAmount - totalPaid) * 100) / 100)
    : Number(invoiceData?.balanceAmount || 0);

  const isFullySettled = balanceAmount <= 0;

  // Split Tax Calculation for CGST & SGST (Indian GST Standard)
  const halfTaxRate = Math.round((taxPercentage / 2) * 100) / 100;
  const halfTaxAmount = Math.round((taxAmount / 2) * 100) / 100;

  // Dynamic Font Class
  const fontClass =
    config.fontFamily === "SERIF"
      ? "font-serif"
      : config.fontFamily === "MONO"
      ? "font-mono"
      : "font-sans";

  const docTitle = isFolio ? config.folioTitle : config.invoiceTitle;

  return (
    <div
      className={`relative bg-white text-slate-800 p-6 sm:p-8 rounded-xl shadow-lg border print:border-none print:shadow-none print:p-0 ${
        config.showBorderAccent ? "border-t-8" : "border-[#E8DDD8]"
      } ${className}`}
      style={{
        borderTopColor: config.showBorderAccent ? config.themeColor : undefined,
      }}
    >
      {/* Print Trigger Bar */}
      {!hidePrintButton && onPrint && (
        <div className="flex justify-end items-center gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden">
          <Button
            onClick={onPrint}
            size="sm"
            className="text-white text-xs font-medium shadow-sm transition-all"
            style={{ backgroundColor: config.themeColor }}
          >
            <Printer className="w-4 h-4 mr-1.5" /> Print / Save as PDF
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LUXURY LETTERHEAD / HEADER SECTION                                     */}
      {/* ========================================================================= */}
      {config.headerStyle === "MODERN_SPLIT" && (
        <div
          className="pb-6 mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2"
          style={{ borderColor: config.themeColor }}
        >
          <div className="flex items-start gap-4">
            {config.showLogo && (
              <div
                className="w-16 h-16 rounded-xl overflow-hidden shadow-md relative flex-shrink-0 border-2"
                style={{
                  borderColor: config.accentColor || "#C4A06A",
                  backgroundColor: config.themeColor,
                }}
              >
                <Image
                  src={config.logoUrl || "/radha-krishna-logo.jpg"}
                  alt={config.hotelName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1
                className={`text-2xl font-bold tracking-tight ${fontClass}`}
                style={{ color: config.themeColor }}
              >
                {config.hotelName}
              </h1>
              {config.tagline && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {config.tagline}
                </p>
              )}
              <p className="text-[11px] text-slate-600 mt-1 max-w-md leading-relaxed">
                {config.address}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1 font-mono">
                {config.phone && <span>Tel: {config.phone}</span>}
                {config.email && <span>Email: {config.email}</span>}
                {config.gstin && <span>GSTIN: {config.gstin}</span>}
                {config.panNumber && <span>PAN: {config.panNumber}</span>}
                {config.state && <span>State: {config.state} ({config.stateCode})</span>}
              </div>
            </div>
          </div>

          <div className="sm:text-right flex-shrink-0">
            <span
              className="inline-block px-3 py-1 text-xs font-bold tracking-wider rounded-md text-white uppercase shadow-sm"
              style={{ backgroundColor: config.themeColor }}
            >
              {docTitle}
            </span>
            <div className="mt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Reference / Bill #
              </span>
              <span
                className="text-lg font-mono font-bold"
                style={{ color: config.accentColor || config.themeColor }}
              >
                {referenceNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Issue Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Booking Ref: {bookingRef}
            </div>
          </div>
        </div>
      )}

      {config.headerStyle === "CLASSIC_CENTERED" && (
        <div className="text-center pb-6 mb-6 border-b-2" style={{ borderColor: config.themeColor }}>
          {config.showLogo && (
            <div
              className="w-16 h-16 rounded-xl overflow-hidden shadow-md mx-auto mb-2 relative border-2"
              style={{
                borderColor: config.accentColor || "#C4A06A",
                backgroundColor: config.themeColor,
              }}
            >
              <Image
                src={config.logoUrl || "/radha-krishna-logo.jpg"}
                alt={config.hotelName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight uppercase ${fontClass}`}
            style={{ color: config.themeColor }}
          >
            {config.hotelName}
          </h1>
          {config.tagline && (
            <p className="text-xs text-slate-500 italic mt-0.5">{config.tagline}</p>
          )}
          <p className="text-xs text-slate-600 mt-1">{config.address}</p>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1 font-mono">
            {config.phone && <span>Tel: {config.phone}</span>}
            {config.email && <span>Email: {config.email}</span>}
            {config.gstin && <span>GSTIN: {config.gstin}</span>}
            {config.panNumber && <span>PAN: {config.panNumber}</span>}
          </div>

          <div
            className="mt-4 py-1.5 px-4 rounded-lg inline-flex items-center gap-4 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: config.themeColor }}
          >
            <span className="tracking-widest uppercase">{docTitle}</span>
            <span className="font-mono text-[11px] opacity-90">• {referenceNumber} •</span>
            <span className="text-[10px] font-mono opacity-85">
              {new Date().toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {config.headerStyle === "MINIMAL_EXECUTIVE" && (
        <div className="pb-5 mb-5 border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.showLogo && (
              <div
                className="w-12 h-12 rounded-lg overflow-hidden relative border"
                style={{ borderColor: config.themeColor }}
              >
                <Image
                  src={config.logoUrl || "/radha-krishna-logo.jpg"}
                  alt={config.hotelName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {config.hotelName}
              </h1>
              <p className="text-[10px] text-slate-500">
                GSTIN: {config.gstin} • {config.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-900 block">
              {docTitle}
            </span>
            <span className="text-xs font-mono font-bold text-slate-600">
              {referenceNumber}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GUEST & STAY PROFILE GRID                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Guest Details
          </span>
          <span className="font-bold text-slate-900 text-sm block mt-0.5">
            {guestName}
          </span>
          {guestMobile && (
            <span className="text-[11px] text-slate-500 font-mono block">
              {guestMobile}
            </span>
          )}
          {guestCity && (
            <span className="text-[10px] text-slate-500 block truncate">
              {guestCity}
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Room Accommodated
          </span>
          <span
            className="font-bold text-sm block mt-0.5"
            style={{ color: config.themeColor }}
          >
            Room {roomNumber}
          </span>
          <span className="text-[11px] text-slate-600 block">{roomType}</span>
          <span className="text-[10px] text-slate-400 font-mono block">
            Rate: ₹{roomRatePerNight.toLocaleString("en-IN")}/night
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Stay Period
          </span>
          <span className="font-bold text-slate-900 text-xs block mt-0.5">
            {numberOfNights} {numberOfNights === 1 ? "Night" : "Nights"}
          </span>
          <span className="text-[11px] text-slate-600 block">
            {checkInDate} → {checkOutDate}
          </span>
          {config.showCheckInOutTimings && (
            <span className="text-[10px] text-slate-400 block font-mono">
              In: {config.checkInTime} | Out: {config.checkOutTime}
            </span>
          )}
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Settlement Status
          </span>
          <div className="mt-1">
            {isFullySettled ? (
              <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled / Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Due: ₹{balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHARGES & TARIFF BREAKDOWN TABLE                                       */}
      {/* ========================================================================= */}
      <div className="space-y-4 mb-6">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr
                className="text-white text-[10px] uppercase font-bold tracking-wider"
                style={{ backgroundColor: config.themeColor }}
              >
                <th className="py-2.5 px-3">Description / Item Particulars</th>
                <th className="py-2.5 px-3 text-center">Nights / Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Taxable Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {/* Room stay row */}
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Bed className="w-3.5 h-3.5" style={{ color: config.accentColor || config.themeColor }} />
                    <span>Room Accommodation — Room {roomNumber}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block ml-5">
                    {roomType} ({checkInDate} to {checkOutDate})
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-700">
                  {numberOfNights}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  ₹{roomRatePerNight.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{roomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Itemized Services (if Folio) */}
              {isFolio &&
                config.showItemizedServices &&
                folioData?.itemizedCharges &&
                folioData.itemizedCharges.length > 0 &&
                folioData.itemizedCharges.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3 h-3 text-slate-400" />
                        <span>{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-semibold ml-1">
                          {item.billingComponent}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4.5 font-mono">
                        {item.date} {item.time && `• ${item.time}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}

              {/* Itemized Services (if Invoice) */}
              {!isFolio &&
                config.showItemizedServices &&
                invoiceData?.booking?.bookingItems &&
                invoiceData.booking.bookingItems.length > 0 &&
                invoiceData.booking.bookingItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3 h-3 text-slate-400" />
                        <span>{item.itemNameSnapshot}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ₹{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      ₹{Number(item.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOTALS & TAX BREAKDOWN SECTION                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Box: Component Breakdown Summary / Stay Particulars */}
        <div className="space-y-3">
          {/* Component Summary (Folio) */}
          {isFolio && folioData && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b pb-1">
                Charges Breakdown Summary
              </span>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Room Tariff Charges:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₹{folioData.roomCharges.toFixed(2)}
                </span>
              </div>
              {folioData.totalAdditionalCharges > 0 && (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Items & Additional Services:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{folioData.totalAdditionalCharges.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-200">
                <span>Total Stay Duration:</span>
                <span className="font-mono">{numberOfNights} Nights</span>
              </div>
            </div>
          )}

          {/* Stay Particulars (Invoice) */}
          {!isFolio && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b pb-1">
                Billing Particulars
              </span>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Room Tariff Charges:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ₹{roomCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-200">
                <span>Duration / Stay:</span>
                <span className="font-mono">{numberOfNights} Nights ({checkInDate} to {checkOutDate})</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Box: Grand Totals & Tax Calculation */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Tariff + Services):</span>
            <span className="font-semibold text-slate-800">
              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Promotional Discount:</span>
              <span>-₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* GST Breakdown: CGST + SGST split if enabled */}
          {config.showGstBreakdown ? (
            <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST ({halfTaxRate}%):</span>
                <span>₹{halfTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST ({halfTaxRate}%):</span>
                <span>₹{halfTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-semibold text-xs pt-0.5">
                <span>Total GST ({taxPercentage}%):</span>
                <span>₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-slate-600">
              <span>GST Tax ({taxPercentage}%):</span>
              <span>₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* Final Payable Bill */}
          <div
            className="flex justify-between font-bold text-sm pt-2 border-t border-slate-300"
            style={{ color: config.themeColor }}
          >
            <span>Final Bill Amount:</span>
            <span>₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Advance / Payments Received */}
          <div className="flex justify-between text-emerald-700 font-medium pt-1">
            <span>Advance & Paid to Date:</span>
            <span>₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Balance Remaining */}
          <div
            className={`flex justify-between font-bold text-sm pt-1 border-t ${
              isFullySettled ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            <span>{isFullySettled ? "Balance (Settled):" : "Net Balance Due:"}</span>
            <span>₹{balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. AUTHORIZED SIGNATORY & TERMS & CONDITIONS                               */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Left: Terms & Conditions */}
        <div className="space-y-1">
          <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider block">
            Terms & Conditions & Hotel Policies
          </span>
          <div className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-line font-sans">
            {config.termsAndConditions}
          </div>
          {config.customNotes && (
            <p className="text-[9px] text-slate-400 italic mt-1 font-sans">
              {config.customNotes}
            </p>
          )}
        </div>

        {/* Right: Authorized Signatory Block */}
        {config.showSignatory && (
          <div className="flex flex-col justify-end items-end sm:items-end text-right">
            <div className="w-48 text-center pt-8">
              <div
                className="w-full border-b border-dashed mb-1.5"
                style={{ borderColor: config.themeColor }}
              />
              <span className="font-bold text-slate-800 text-xs block">
                {config.signatoryTitle || "Authorized Signatory"}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {config.signatoryDepartment || "Front Office & Accounts"}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {config.hotelName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Thank you note */}
      {config.thankYouMessage && (
        <div className="mt-6 pt-3 border-t border-slate-100 text-center text-xs italic text-slate-500 font-serif">
          &ldquo;{config.thankYouMessage}&rdquo;
        </div>
      )}
    </div>
  );
}
