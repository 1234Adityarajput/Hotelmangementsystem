"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DoorOpen,
  ArrowRight,
  LogOut,
  ArrowRightLeft,
  Calendar,
  Clock,
  User,
  BedDouble,
  CheckCircle2,
  FileSpreadsheet,
  Receipt,
  Search,
  Plus,
  Eye,
  Printer,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  FileText,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  X,
  Users,
  Check,
  History,
} from "lucide-react";
import { bookingsService } from "@/services/bookings.service";
import { roomsService } from "@/services/rooms.service";
import { guestsService } from "@/services/guests.service";
import { Booking, Room, Guest, CheckoutSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function StaysPage() {
  const [activeTab, setActiveTab] = useState<"arrivals" | "inhouse" | "departures" | "archive">("inhouse");
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [inHouse, setInHouse] = useState<Booking[]>([]);
  const [departures, setDepartures] = useState<Booking[]>([]);
  const [archive, setArchive] = useState<Booking[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Relocation modal state
  const [relocateModalOpen, setRelocateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [relocateReason, setRelocateReason] = useState("");

  // Check-In modal state (All required Check-in information)
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInBooking, setCheckInBooking] = useState<Booking | null>(null);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkInAdvanceAmount, setCheckInAdvanceAmount] = useState<number>(0);
  const [checkInAdvanceMethod, setCheckInAdvanceMethod] = useState<string>("CASH");

  // Check-Out Folio modal state (All required Check-out information)
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [checkOutBooking, setCheckOutBooking] = useState<Booking | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [actualCheckOutTime, setActualCheckOutTime] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [serviceCharges, setServiceCharges] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(12);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Digital Stay Dossier / Receipt modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Walk-in Check-In modal
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [allAvailableRooms, setAllAvailableRooms] = useState<Room[]>([]);
  const [walkInForm, setWalkInForm] = useState({
    primaryGuestId: "",
    roomId: "",
    checkInDate: new Date().toISOString().split("T")[0],
    checkInTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    expectedCheckOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    expectedCheckOutTime: "11:00 AM",
    numberOfNights: 1,
    roomRatePerNight: 2000,
    advanceAmount: 0,
    advancePaymentMethod: "CASH",
    numberOfGuests: 1,
    notes: "Direct Walk-in Check-in",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [arr, act, dep, comp] = await Promise.all([
        bookingsService.getTodayCheckIns(),
        bookingsService.getActiveStays(),
        bookingsService.getTodayCheckOuts(),
        bookingsService.getCompletedStays({ search: archiveSearch, page: archivePage, limit: 15 }),
      ]);
      setArrivals(arr);
      setInHouse(act);
      setDepartures(dep);
      setArchive(comp.items);
      setArchiveTotal(comp.total);
    } catch (err) {
      toast.error("Failed to load front-desk stay lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [archivePage, archiveSearch]);

  // Load guests & available rooms for Walk-In modal
  const handleOpenWalkIn = async () => {
    try {
      const [gRes, rRes] = await Promise.all([
        guestsService.findAll({ limit: 100 }),
        roomsService.findAvailable(),
      ]);
      setAllGuests(gRes.items);
      setAllAvailableRooms(rRes);
      if (rRes.length > 0) {
        setWalkInForm((prev) => ({
          ...prev,
          primaryGuestId: gRes.items[0]?.id || "",
          roomId: rRes[0].id,
          roomRatePerNight: Number(rRes[0].pricePerNight),
        }));
      }
      setWalkInModalOpen(true);
    } catch (err) {
      toast.error("Failed to prepare walk-in check-in");
    }
  };

  const handleConfirmWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.primaryGuestId || !walkInForm.roomId) {
      toast.error("Please select a Guest and Room");
      return;
    }

    try {
      setSubmitting(true);
      // 1. Create reservation
      const created = await bookingsService.create({
        primaryGuestId: walkInForm.primaryGuestId,
        roomId: walkInForm.roomId,
        checkInDate: walkInForm.checkInDate,
        checkInTime: walkInForm.checkInTime,
        expectedCheckOutDate: walkInForm.expectedCheckOutDate,
        expectedCheckOutTime: walkInForm.expectedCheckOutTime,
        numberOfNights: Number(walkInForm.numberOfNights),
        roomRatePerNight: Number(walkInForm.roomRatePerNight),
        advanceAmount: Number(walkInForm.advanceAmount),
        advancePaymentMethod: walkInForm.advancePaymentMethod,
        numberOfGuests: Number(walkInForm.numberOfGuests),
        notes: walkInForm.notes,
      });

      // 2. Perform instant check-in
      await bookingsService.checkIn(created.id, {
        checkInTime: walkInForm.checkInTime,
        advanceAmount: Number(walkInForm.advanceAmount),
        advancePaymentMethod: walkInForm.advancePaymentMethod,
      });

      toast.success("Walk-in check-in completed. Guest is now in-house.");
      setWalkInModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Walk-in check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Check-In Process
  const handleOpenCheckInModal = (booking: Booking) => {
    setCheckInBooking(booking);
    setCheckInTime(
      booking.checkInTime ||
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    );
    setCheckInAdvanceAmount(0);
    setCheckInAdvanceMethod("CASH");
    setCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInBooking) return;

    try {
      setSubmitting(true);
      await bookingsService.checkIn(checkInBooking.id, {
        checkInTime,
        advanceAmount: Number(checkInAdvanceAmount),
        advancePaymentMethod: checkInAdvanceMethod,
      });
      toast.success(
        `Guest ${checkInBooking.primaryGuest?.fullName} checked into Room ${checkInBooking.room?.roomNumber}`
      );
      setCheckInModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check in guest");
    } finally {
      setSubmitting(false);
    }
  };

  // Check-Out Process (Live Folio Calculations)
  const handleOpenCheckOutModal = async (booking: Booking) => {
    setCheckOutBooking(booking);
    setCheckOutNotes("");
    setDiscountValue(0);
    setDiscountType("PERCENTAGE");
    setServiceCharges(0);
    setPaymentMethod("CASH");
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setActualCheckOutTime(currentTime);

    try {
      setLoadingSummary(true);
      setCheckOutModalOpen(true);
      const summary = await bookingsService.getCheckoutSummary(booking.id);
      setCheckoutSummary(summary);
      setTaxPercentage(summary.taxPercentage || 12);
      setSettlementAmount(summary.remainingPayment || 0);
    } catch (err) {
      toast.error("Failed to load live check-out folio");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Recalculate folio when discount or service charges change in modal
  const computedRoomCharges = checkoutSummary?.roomCharges || 0;
  const computedAdditionalCharges = checkoutSummary?.additionalItemCharges || 0;
  const computedSubtotal = Math.round((computedRoomCharges + computedAdditionalCharges + Number(serviceCharges)) * 100) / 100;
  let computedDiscount = 0;
  if (discountType === "PERCENTAGE") {
    computedDiscount = Math.round(computedSubtotal * (Math.min(100, Number(discountValue)) / 100) * 100) / 100;
  } else {
    computedDiscount = Math.min(Number(discountValue), computedSubtotal);
  }
  const computedTaxable = Math.max(0, computedSubtotal - computedDiscount);
  const computedTax = Math.round(computedTaxable * (Number(taxPercentage) / 100) * 100) / 100;
  const computedTotalBill = Math.round((computedTaxable + computedTax) * 100) / 100;
  const computedPaidAlready = (checkoutSummary?.advancePayment || 0) + (checkoutSummary?.additionalPayments || 0);
  const computedBalanceDue = Math.max(0, Math.round((computedTotalBill - computedPaidAlready) * 100) / 100);

  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutBooking) return;

    try {
      setSubmitting(true);
      const res = await bookingsService.checkOut(checkOutBooking.id, {
        actualCheckOutTime,
        discountType,
        discountValue: Number(discountValue),
        taxPercentage: Number(taxPercentage),
        serviceCharges: Number(serviceCharges),
        paymentMethod,
        paidAmount: Number(settlementAmount),
        notes: checkOutNotes || "Settled and checked out digitally",
      });

      toast.success(
        `Guest ${checkOutBooking.primaryGuest?.fullName} checked out. Digital Invoice ${res.invoice.invoiceNumber} archived.`
      );
      setCheckOutModalOpen(false);
      setReceiptData({
        booking: res.booking,
        invoice: res.invoice,
        folio: res.checkoutFolio,
      });
      setReceiptModalOpen(true);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete digital check-out");
    } finally {
      setSubmitting(false);
    }
  };

  // Relocation
  const handleOpenRelocate = async (booking: Booking) => {
    setSelectedBooking(booking);
    setRelocateReason("");
    try {
      const rooms = await roomsService.findAvailable({
        checkIn: new Date().toISOString().split("T")[0],
        checkOut: booking.expectedCheckOutDate.split("T")[0],
      });
      const filtered = rooms.filter((r) => r.id !== booking.roomId);
      setAvailableRooms(filtered);
      if (filtered.length > 0) {
        setNewRoomId(filtered[0].id);
      }
      setRelocateModalOpen(true);
    } catch (err) {
      toast.error("Error finding available rooms for relocation");
    }
  };

  const handleConfirmRelocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newRoomId) return;

    try {
      setSubmitting(true);
      await bookingsService.relocate(selectedBooking.id, newRoomId, relocateReason);
      toast.success("Room relocation completed. Room statuses updated.");
      setRelocateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Relocation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Editorial Luxury Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#B08A60] uppercase bg-[#EEE7DA] px-2.5 py-0.5 rounded-full">
              Front Desk Operations • Module 6
            </span>
            <span className="text-[11px] text-[#79695B]">• Stay Management & Digital Folios</span>
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-[#362A22] mt-1">
            Check-In & Check-Out Management
          </h2>
          <p className="text-xs text-[#79695B] mt-1 max-w-2xl">
            Manage the complete guest stay lifecycle: check-in details, room allocation, stay duration, in-house guests, room relocations, checkout billing folios, and digital archives.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs border-[#E3D9CA] text-[#79695B] hover:text-[#362A22] h-9"
          >
            Refresh Board
          </Button>

          <Button
            onClick={handleOpenWalkIn}
            className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-2 text-xs font-medium h-9 shadow-sm"
          >
            <DoorOpen className="w-4 h-4 text-[#B08A60]" />
            <span>Walk-In Check-In</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="bg-white border-[#E3D9CA] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1E9] flex items-center justify-center text-[#32765B]">
              <BedDouble className="w-5 h-5 text-[#32765B]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#32765B] tracking-wider">In-House Guests</p>
              <h3 className="text-xl font-serif font-bold text-[#362A22]">{inHouse.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E3D9CA] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEE7DA] flex items-center justify-center text-[#362A22]">
              <DoorOpen className="w-5 h-5 text-[#B08A60]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#948779] tracking-wider">Pending Check-Ins</p>
              <h3 className="text-xl font-serif font-bold text-[#362A22]">{arrivals.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E3D9CA] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6EDDC] flex items-center justify-center text-[#A97832]">
              <LogOut className="w-5 h-5 text-[#A97832]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#A97832] tracking-wider">Due Check-Outs</p>
              <h3 className="text-xl font-serif font-bold text-[#362A22]">{departures.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E3D9CA] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFF3] flex items-center justify-center text-[#627D91]">
              <ShieldCheck className="w-5 h-5 text-[#627D91]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#627D91] tracking-wider">Digital Records</p>
              <h3 className="text-xl font-serif font-bold text-[#362A22]">{archiveTotal}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E3D9CA] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inhouse")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "inhouse"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-[#EEE7DA]"
          }`}
        >
          <BedDouble className="w-3.5 h-3.5 text-[#B08A60]" />
          <span>Currently In-House ({inHouse.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("arrivals")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "arrivals"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-[#EEE7DA]"
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5 text-[#B08A60]" />
          <span>Expected Check-Ins ({arrivals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departures")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "departures"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-[#EEE7DA]"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-[#B08A60]" />
          <span>Today&apos;s Check-Outs ({departures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "archive"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-[#EEE7DA]"
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#B08A60]" />
          <span>Digital Check-Out Archive ({archiveTotal})</span>
        </button>
      </div>

      {/* TAB 1: IN-HOUSE GUESTS */}
      {activeTab === "inhouse" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col justify-center items-center gap-3">
                <LoadingSpinner className="w-7 h-7 text-[#B08A60]" />
                <p className="text-xs text-[#79695B]">Loading active in-house stays...</p>
              </div>
            ) : inHouse.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#79695B] space-y-3">
                <BedDouble className="w-10 h-10 text-[#B08A60] mx-auto opacity-60" />
                <p className="font-medium text-[#362A22]">
                  No guests currently in-house. Check in an arrival from the Arrivals tab or register a Walk-in.
                </p>
                <Button
                  onClick={handleOpenWalkIn}
                  className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
                >
                  <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#B08A60]" /> Process Walk-In Check-In
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                    <tr>
                      <th className="px-4 py-3.5">Room</th>
                      <th className="px-4 py-3.5">Guest Information</th>
                      <th className="px-4 py-3.5">Check-In Time</th>
                      <th className="px-4 py-3.5">Expected Departure</th>
                      <th className="px-4 py-3.5">Duration & Rate</th>
                      <th className="px-4 py-3.5">Advance Paid</th>
                      <th className="px-4 py-3.5">Room Items</th>
                      <th className="px-4 py-3.5 text-right">Stay Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {inHouse.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                        {/* Room */}
                        <td className="px-4 py-3.5 font-semibold text-[#362A22]">
                          <div className="text-base font-serif font-bold text-[#362A22]">
                            Room {b.room?.roomNumber}
                          </div>
                          <div className="text-[10px] text-[#79695B]">
                            {b.room?.roomType?.name} • Floor {b.room?.floor}
                          </div>
                        </td>

                        {/* Guest */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-sm text-[#362A22]">
                            {b.primaryGuest?.fullName}
                          </div>
                          <div className="text-[11px] text-[#79695B] font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#B08A60]" />
                            <span>{b.primaryGuest?.mobileNumber}</span>
                          </div>
                        </td>

                        {/* Check-In Timestamp */}
                        <td className="px-4 py-3.5 text-[#79695B]">
                          <div className="font-medium text-[#362A22]">
                            {new Date(b.checkInDate).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-[11px] text-[#948779] font-mono">
                            {b.actualCheckInAt
                              ? new Date(b.actualCheckInAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : b.checkInTime || "12:00 PM"}
                          </div>
                        </td>

                        {/* Expected Departure */}
                        <td className="px-4 py-3.5 text-[#79695B]">
                          <div className="font-medium text-[#362A22]">
                            {new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-[11px] text-[#948779] font-mono">
                            {b.expectedCheckOutTime || "11:00 AM"}
                          </div>
                        </td>

                        {/* Duration & Rate */}
                        <td className="px-4 py-3.5 text-[#362A22]">
                          <div className="font-semibold">{b.numberOfNights} Night(s)</div>
                          <div className="text-[11px] text-[#79695B] font-mono">
                            ₹{Number(b.roomRatePerNight).toLocaleString("en-IN")} / night
                          </div>
                        </td>

                        {/* Advance Paid */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded text-[11px]">
                            ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Room Items */}
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="text-[10px] bg-[#EEE7DA] text-[#362A22]">
                            {b.bookingItems?.length || 0} Orders
                          </Badge>
                        </td>

                        {/* Operations */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRelocate(b)}
                            className="h-7 text-xs text-[#5D493D] hover:bg-[#EEE7DA] border-[#E3D9CA]"
                            title="Relocate guest to another room"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-[#B08A60]" /> Relocate
                          </Button>

                          <Link href={`/items?bookingId=${b.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-[#5D493D] hover:bg-[#EEE7DA] border-[#E3D9CA]"
                              title="Add POS Item or Room Service"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Service
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckOutModal(b)}
                            className="h-7 text-xs bg-[#362A22] hover:bg-[#43352B] text-white"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1 text-[#B08A60]" /> Check-Out Folio
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

      {/* TAB 2: EXPECTED ARRIVALS (CHECK-INS) */}
      {activeTab === "arrivals" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {arrivals.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
                <DoorOpen className="w-10 h-10 text-[#B08A60] mx-auto opacity-60" />
                <p className="font-medium text-[#362A22]">No pending arrivals scheduled for check-in.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                    <tr>
                      <th className="px-4 py-3.5">Booking #</th>
                      <th className="px-4 py-3.5">Guest Information</th>
                      <th className="px-4 py-3.5">Allocated Room</th>
                      <th className="px-4 py-3.5">Check-In Date & Time</th>
                      <th className="px-4 py-3.5">Stay Nights</th>
                      <th className="px-4 py-3.5">Price / Night</th>
                      <th className="px-4 py-3.5">Advance Payment</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {arrivals.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-medium text-[#B08A60]">
                          <span className="bg-[#EEE7DA] px-2 py-0.5 rounded text-[11px]">
                            {b.bookingNumber}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#362A22]">{b.primaryGuest?.fullName}</div>
                          <div className="text-[11px] text-[#79695B] font-mono">
                            {b.primaryGuest?.mobileNumber}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#362A22]">Room {b.room?.roomNumber}</span>
                          <span className="text-[11px] text-[#79695B] block">
                            {b.room?.roomType?.name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-[#79695B]">
                          <div>{new Date(b.checkInDate).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-[#948779] font-mono">
                            {b.checkInTime || "12:00 PM"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-[#362A22]">
                          {b.numberOfNights} Night(s)
                        </td>

                        <td className="px-4 py-3.5 font-mono font-medium text-[#362A22]">
                          ₹{Number(b.roomRatePerNight).toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded text-[11px]">
                            ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckInModal(b)}
                            className="h-7 text-xs bg-[#362A22] hover:bg-[#43352B] text-white"
                          >
                            <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                            Process Check-In
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

      {/* TAB 3: EXPECTED DEPARTURES (CHECK-OUTS TODAY) */}
      {activeTab === "departures" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {departures.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
                <LogOut className="w-10 h-10 text-[#B08A60] mx-auto opacity-60" />
                <p className="font-medium text-[#362A22]">No departures scheduled for check-out today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                    <tr>
                      <th className="px-4 py-3.5">Room</th>
                      <th className="px-4 py-3.5">Guest</th>
                      <th className="px-4 py-3.5">Expected Departure</th>
                      <th className="px-4 py-3.5">Duration</th>
                      <th className="px-4 py-3.5">Rate / Night</th>
                      <th className="px-4 py-3.5">Advance Paid</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {departures.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-sm text-[#362A22]">
                          Room {b.room?.roomNumber}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#362A22]">
                          {b.primaryGuest?.fullName}
                        </td>
                        <td className="px-4 py-3.5 text-[#79695B]">
                          <div>{new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-[#948779] font-mono">
                            {b.expectedCheckOutTime || "11:00 AM"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#362A22]">
                          {b.numberOfNights} Nights
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#362A22]">
                          ₹{Number(b.roomRatePerNight).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#32765B]">
                          ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckOutModal(b)}
                            className="h-7 text-xs bg-[#362A22] hover:bg-[#43352B] text-white"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                            Check-Out Folio
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

      {/* TAB 4: DIGITAL CHECK-OUT ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E3D9CA]">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#948779] absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search archived stays by guest, booking, or room..."
                value={archiveSearch}
                onChange={(e) => {
                  setArchiveSearch(e.target.value);
                  setArchivePage(1);
                }}
                className="pl-9 h-8 text-xs bg-[#F7F4EE] border-[#E3D9CA]"
              />
            </div>
            <div className="text-xs text-[#79695B]">
              Showing <span className="font-semibold text-[#362A22]">{archive.length}</span> of{" "}
              <span className="font-semibold text-[#362A22]">{archiveTotal}</span> completed digital stay records
            </div>
          </div>

          <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-16 flex flex-col justify-center items-center gap-3">
                  <LoadingSpinner className="w-7 h-7 text-[#B08A60]" />
                  <p className="text-xs text-[#79695B]">Querying digital checkout archives...</p>
                </div>
              ) : archive.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#79695B]">
                  No archived check-out records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                      <tr>
                        <th className="px-4 py-3.5">Booking / Invoice</th>
                        <th className="px-4 py-3.5">Guest Details</th>
                        <th className="px-4 py-3.5">Room</th>
                        <th className="px-4 py-3.5">Check-In / Out</th>
                        <th className="px-4 py-3.5">Total Nights</th>
                        <th className="px-4 py-3.5">Total Bill</th>
                        <th className="px-4 py-3.5">Payment Status</th>
                        <th className="px-4 py-3.5 text-right">Digital Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {archive.map((b) => {
                        const inv = b.invoices && b.invoices[0];
                        return (
                          <tr key={b.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                            <td className="px-4 py-3.5 font-mono">
                              <span className="font-semibold text-[#362A22] block">
                                {b.bookingNumber}
                              </span>
                              {inv && (
                                <span className="text-[10px] text-[#B08A60]">{inv.invoiceNumber}</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[#362A22]">
                                {b.primaryGuest?.fullName}
                              </div>
                              <div className="text-[11px] text-[#79695B] font-mono">
                                {b.primaryGuest?.mobileNumber}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="font-bold text-[#362A22]">Room {b.room?.roomNumber}</span>
                              <span className="text-[10px] text-[#79695B] block">{b.room?.roomType?.name}</span>
                            </td>

                            <td className="px-4 py-3.5 text-[#79695B]">
                              <div>{new Date(b.checkInDate).toLocaleDateString("en-IN")}</div>
                              <div className="text-[10px] text-[#948779]">
                                Out: {b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toLocaleDateString("en-IN") : "—"}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 font-medium text-[#362A22]">
                              {b.numberOfNights} Nights
                            </td>

                            <td className="px-4 py-3.5 font-mono font-bold text-[#362A22]">
                              ₹{Number(inv?.totalAmount || Number(b.roomRatePerNight) * b.numberOfNights).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="px-4 py-3.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30 font-bold"
                              >
                                {inv?.invoiceStatus || "SETTLED"}
                              </Badge>
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReceiptData({
                                    booking: b,
                                    invoice: inv,
                                    folio: {
                                      actualCheckOutDate: b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toISOString().split("T")[0] : "",
                                      actualCheckOutTime: "11:00 AM",
                                      totalNumberOfNights: b.numberOfNights,
                                      roomCharges: Number(inv?.roomCharges || Number(b.roomRatePerNight) * b.numberOfNights),
                                      additionalItemCharges: Number(inv?.additionalCharges || 0),
                                      serviceCharges: 0,
                                      discount: Number(inv?.discountAmount || 0),
                                      tax: Number(inv?.taxAmount || 0),
                                      totalBillAmount: Number(inv?.totalAmount || 0),
                                      advancePayment: Number(b.advanceAmount || 0),
                                      additionalPayments: Number(inv?.totalPaid || 0) - Number(b.advanceAmount || 0),
                                      remainingPayment: 0,
                                    },
                                  });
                                  setReceiptModalOpen(true);
                                }}
                                className="h-7 text-xs border-[#E3D9CA] text-[#79695B] hover:text-[#362A22]"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                                Folio Dossier
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECK-IN MODAL (ALL 9 CHECK-IN FIELDS)                                    */}
      {/* ========================================================================= */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded w-fit">
              Front Desk Arrival Processing
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
              Check-In Verification • #{checkInBooking?.bookingNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Verify guest credentials, room allocation, check-in timestamp, and advance payment.
            </DialogDescription>
          </DialogHeader>

          {checkInBooking && (
            <form onSubmit={handleConfirmCheckIn} className="space-y-4 pt-2 text-xs">
              {/* 1. Guest Details */}
              <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#948779] tracking-wider block">
                  1. Guest Information
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#362A22] text-sm">
                    {checkInBooking.primaryGuest?.fullName}
                  </span>
                  <span className="font-mono text-[#79695B]">
                    {checkInBooking.primaryGuest?.mobileNumber}
                  </span>
                </div>
                <div className="text-[11px] text-[#79695B]">
                  {checkInBooking.primaryGuest?.city || "India"} • ID Verified
                </div>
              </div>

              {/* 2. Room Details & Pricing */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-[#E3D9CA]">
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">
                    2. Room Number & Category
                  </span>
                  <span className="font-bold text-[#362A22]">
                    Room {checkInBooking.room?.roomNumber}
                  </span>
                  <span className="text-[11px] text-[#79695B] block">
                    {checkInBooking.room?.roomType?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">
                    Room Price Per Night
                  </span>
                  <span className="font-mono font-bold text-[#362A22]">
                    ₹{Number(checkInBooking.roomRatePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Check-In Date</label>
                  <Input
                    disabled
                    value={new Date(checkInBooking.checkInDate).toLocaleDateString("en-IN")}
                    className="h-8 text-xs bg-[#F7F4EE] border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Check-In Time *</label>
                  <Input
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="e.g. 12:30 PM"
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Expected Check-Out Date</label>
                  <Input
                    disabled
                    value={new Date(checkInBooking.expectedCheckOutDate).toLocaleDateString("en-IN")}
                    className="h-8 text-xs bg-[#F7F4EE] border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Expected Check-Out Time</label>
                  <Input
                    disabled
                    value={checkInBooking.expectedCheckOutTime || "11:00 AM"}
                    className="h-8 text-xs bg-[#F7F4EE] border-[#E3D9CA]"
                  />
                </div>
              </div>

              {/* Number of Nights */}
              <div className="flex justify-between items-center p-2.5 bg-[#F7F4EE] rounded-lg border border-[#E3D9CA]">
                <span className="font-semibold text-[#362A22]">Duration of Stay:</span>
                <span className="font-bold text-[#362A22]">{checkInBooking.numberOfNights} Night(s)</span>
              </div>

              {/* Advance Payment */}
              <div className="p-3 bg-white rounded-xl border border-[#E3D9CA] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#362A22] text-[11px] uppercase tracking-wider">
                    Advance Payment
                  </span>
                  <span className="font-mono text-xs font-bold text-[#32765B]">
                    Existing: ₹{Number(checkInBooking.advanceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[#79695B] font-semibold">Collect Additional Advance (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={checkInAdvanceAmount}
                      onChange={(e) => setCheckInAdvanceAmount(Number(e.target.value))}
                      className="h-8 text-xs font-mono border-[#E3D9CA]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#79695B] font-semibold">Payment Method</label>
                    <select
                      value={checkInAdvanceMethod}
                      onChange={(e) => setCheckInAdvanceMethod(e.target.value)}
                      className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer / Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#EAE3D8]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckInModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5"
                >
                  {submitting ? (
                    <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                  )}
                  <span>Confirm Check-In</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* CHECK-OUT FOLIO MODAL (ALL 12 CHECK-OUT FIELDS)                           */}
      {/* ========================================================================= */}
      <Dialog open={checkOutModalOpen} onOpenChange={setCheckOutModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A97832] bg-[#F6EDDC] px-2 py-0.5 rounded">
                  Digital Check-Out & Settlement
                </span>
                <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
                  Complete Guest Check-Out • Room {checkOutBooking?.room?.roomNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#79695B]">
                  Guest: {checkOutBooking?.primaryGuest?.fullName} • Folio Breakdown & Balance Settlement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingSummary ? (
            <div className="p-16 flex flex-col justify-center items-center gap-2">
              <LoadingSpinner className="w-7 h-7 text-[#B08A60]" />
              <p className="text-xs text-[#79695B]">Calculating stay charges, room items & taxes...</p>
            </div>
          ) : (
            <form onSubmit={handleConfirmCheckOut} className="space-y-4 pt-2 text-xs">
              {/* Stay Header Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA]">
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">Check-In</span>
                  <span className="font-semibold text-[#362A22]">
                    {checkOutBooking ? new Date(checkOutBooking.checkInDate).toLocaleDateString("en-IN") : "—"}
                  </span>
                  <span className="text-[10px] text-[#79695B] block font-mono">
                    {checkOutBooking?.checkInTime || "12:00 PM"}
                  </span>
                </div>

                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">Actual Check-Out</span>
                  <span className="font-semibold text-[#362A22]">
                    {new Date().toLocaleDateString("en-IN")}
                  </span>
                  <span className="text-[10px] text-[#79695B] block font-mono">
                    {actualCheckOutTime}
                  </span>
                </div>

                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">Total Nights</span>
                  <span className="font-bold text-sm text-[#362A22]">
                    {checkoutSummary?.totalNumberOfNights || 1} Night(s)
                  </span>
                </div>

                <div>
                  <span className="text-[#948779] block text-[10px] uppercase font-bold">Room Rate</span>
                  <span className="font-mono font-bold text-[#362A22]">
                    ₹{Number(checkOutBooking?.roomRatePerNight || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Line Items & Charges Breakdown */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E3D9CA] space-y-2.5">
                <h5 className="font-bold text-[#362A22] uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-[#EAE3D8] pb-1.5">
                  <span>Stay Charges Breakdown</span>
                  <span className="text-[#948779] text-[10px] font-normal">All amounts in INR (₹)</span>
                </h5>

                <div className="space-y-1.5">
                  {/* Room Charges */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#79695B]">
                      Room Charges ({checkoutSummary?.totalNumberOfNights} night(s) × ₹
                      {Number(checkOutBooking?.roomRatePerNight || 0).toLocaleString("en-IN")}):
                    </span>
                    <span className="font-mono font-semibold text-[#362A22]">
                      ₹{computedRoomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Additional Item Charges */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#79695B]">
                      Additional Item Charges (Room Service, POS, Minibar):
                    </span>
                    <span className="font-mono font-semibold text-[#362A22]">
                      ₹{computedAdditionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Additional Items breakdown (if any) */}
                  {checkoutSummary?.additionalItems && checkoutSummary.additionalItems.length > 0 && (
                    <div className="pl-3 py-1 border-l-2 border-[#E3D9CA] text-[11px] space-y-0.5 text-[#79695B]">
                      {checkoutSummary.additionalItems.map((it: any) => (
                        <div key={it.id} className="flex justify-between">
                          <span>
                            • {it.itemNameSnapshot} (×{it.quantity})
                          </span>
                          <span className="font-mono">
                            ₹{Number(it.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service Charges Input */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-[#79695B]">Service Charges / Facility Fees:</span>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        value={serviceCharges}
                        onChange={(e) => setServiceCharges(Number(e.target.value))}
                        className="h-7 text-xs font-mono text-right border-[#E3D9CA]"
                      />
                    </div>
                  </div>

                  {/* Discount Input */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#79695B]">Discount:</span>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="h-6 text-[10px] border border-[#E3D9CA] rounded px-1 bg-white"
                      >
                        <option value="PERCENTAGE">% Percentage</option>
                        <option value="FIXED">₹ Fixed Amount</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="h-7 w-20 text-xs font-mono text-right border-[#E3D9CA]"
                      />
                      <span className="font-mono text-xs text-rose-600 font-medium w-24 text-right">
                        -₹{computedDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-[#79695B]">Tax / GST ({taxPercentage}%):</span>
                    <span className="font-mono font-semibold text-[#362A22]">
                      ₹{computedTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Total Bill Amount */}
                  <div className="flex justify-between items-center text-sm font-bold text-[#362A22] pt-2 border-t border-[#E3D9CA]">
                    <span>Total Bill Amount:</span>
                    <span className="font-mono text-base text-[#362A22]">
                      ₹{computedTotalBill.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Advance Payment Deduction */}
                  <div className="flex justify-between items-center text-xs text-[#32765B] pt-1">
                    <span>Advance Payment (Already Received):</span>
                    <span className="font-mono font-semibold">
                      -₹{Number(checkoutSummary?.advancePayment || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Additional Interim Payments */}
                  {checkoutSummary?.additionalPayments ? (
                    <div className="flex justify-between items-center text-xs text-[#32765B]">
                      <span>Additional Interim Payments:</span>
                      <span className="font-mono font-semibold">
                        -₹{Number(checkoutSummary.additionalPayments).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : null}

                  {/* Remaining Payment / Balance Due */}
                  <div className="flex justify-between items-center text-sm font-bold p-2.5 bg-[#F6EDDC] rounded-lg border border-[#A97832]/30 mt-2">
                    <span className="text-[#A97832]">Remaining Payment (Balance Due):</span>
                    <span className="font-mono text-base text-[#A97832]">
                      ₹{computedBalanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Payment Section */}
              <div className="p-3.5 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA] space-y-2.5">
                <span className="font-bold text-[#362A22] text-[11px] uppercase tracking-wider block">
                  Check-Out Settlement Payment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#362A22]">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Card / Bank Transfer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#362A22]">Settlement Amount (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(Number(e.target.value))}
                      className="h-8 text-xs font-mono bg-white border-[#E3D9CA]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#362A22]">Actual Check-Out Time</label>
                    <Input
                      value={actualCheckOutTime}
                      onChange={(e) => setActualCheckOutTime(e.target.value)}
                      className="h-8 text-xs font-mono bg-white border-[#E3D9CA]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#362A22]">Notes / Settlement Remarks</label>
                  <Input
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                    placeholder="e.g. Settled in full at front desk counter"
                    className="h-8 text-xs bg-white border-[#E3D9CA]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#EAE3D8]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckOutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5"
                >
                  {submitting ? (
                    <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                  )}
                  <span>Complete Digital Check-Out & Finalize Invoice</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIGITAL STAY DOSSIER & RECEIPT MODAL                                      */}
      {/* ========================================================================= */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded">
                  Official Digital Receipt • Stay Settled
                </span>
                <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
                  {receiptData?.invoice?.invoiceNumber || "Digital Checkout Dossier"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#79695B]">
                  Archived permanently in Neon PostgreSQL database.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs border-[#B08A60] text-[#362A22]"
              >
                <Printer className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                Print Folio
              </Button>
            </div>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Hotel & Guest dossier */}
              <div className="p-4 rounded-xl bg-[#F7F4EE] border border-[#E3D9CA] space-y-2">
                <div className="flex justify-between border-b border-[#E3D9CA] pb-2">
                  <div>
                    <span className="font-bold text-[#362A22] text-sm block">GRAND BOUTIQUE HOTEL</span>
                    <span className="text-[10px] text-[#79695B]">Luxury Hospitality Suite</span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-[#362A22]">
                    <div>Booking: {receiptData.booking?.bookingNumber}</div>
                    <div className="text-[#B08A60] font-bold">{receiptData.invoice?.invoiceNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[#948779] block text-[10px]">Guest Name:</span>
                    <span className="font-semibold text-[#362A22]">
                      {receiptData.booking?.primaryGuest?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#948779] block text-[10px]">Room Allocated:</span>
                    <span className="font-bold text-[#362A22]">
                      Room {receiptData.booking?.room?.roomNumber} ({receiptData.booking?.room?.roomType?.name})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#948779] block text-[10px]">Check-In:</span>
                    <span className="text-[#362A22]">
                      {new Date(receiptData.booking?.checkInDate).toLocaleDateString("en-IN")}{" "}
                      {receiptData.booking?.checkInTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#948779] block text-[10px]">Check-Out:</span>
                    <span className="text-[#362A22]">
                      {receiptData.folio?.actualCheckOutDate || new Date().toLocaleDateString("en-IN")}{" "}
                      {receiptData.folio?.actualCheckOutTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Folio Table */}
              <div className="border border-[#E3D9CA] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F4EE] text-[#79695B] border-b border-[#E3D9CA]">
                    <tr>
                      <th className="px-3 py-2">Charge Description</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    <tr>
                      <td className="px-3 py-2">
                        Room Accommodation ({receiptData.folio?.totalNumberOfNights || receiptData.booking?.numberOfNights} Night(s))
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        ₹{Number(receiptData.folio?.roomCharges || receiptData.invoice?.roomCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">Additional Hotel Services & Room Orders</td>
                      <td className="px-3 py-2 text-right font-mono">
                        ₹{Number(receiptData.folio?.additionalItemCharges || receiptData.invoice?.additionalCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {receiptData.folio?.serviceCharges ? (
                      <tr>
                        <td className="px-3 py-2">Service Charges / Facility Fees</td>
                        <td className="px-3 py-2 text-right font-mono">
                          ₹{Number(receiptData.folio.serviceCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ) : null}
                    {receiptData.folio?.discount ? (
                      <tr className="text-rose-600">
                        <td className="px-3 py-2">Discount Applied</td>
                        <td className="px-3 py-2 text-right font-mono">
                          -₹{Number(receiptData.folio.discount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td className="px-3 py-2">Applicable Taxes (GST)</td>
                      <td className="px-3 py-2 text-right font-mono">
                        ₹{Number(receiptData.folio?.tax || receiptData.invoice?.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold bg-[#F7F4EE]/60 text-[#362A22]">
                      <td className="px-3 py-2.5">Total Bill Amount</td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm">
                        ₹{Number(receiptData.folio?.totalBillAmount || receiptData.invoice?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="text-[#32765B]">
                      <td className="px-3 py-2">Total Amount Settled & Received</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        ₹{Number(receiptData.invoice?.totalPaid || receiptData.folio?.totalBillAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="font-bold text-[#32765B] bg-[#E7F1E9]/40">
                      <td className="px-3 py-2">Final Balance Due</td>
                      <td className="px-3 py-2 text-right font-mono">₹0.00 (PAID IN FULL)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  size="sm"
                  onClick={() => setReceiptModalOpen(false)}
                  className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs w-full sm:w-auto"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIRECT WALK-IN CHECK-IN MODAL                                             */}
      {/* ========================================================================= */}
      <Dialog open={walkInModalOpen} onOpenChange={setWalkInModalOpen}>
        <DialogContent className="max-w-xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded w-fit">
              Front Desk Quick Intake
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
              Direct Walk-In Check-In
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Instantly assign room, record check-in time, collect advance payment, and mark guest in-house.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmWalkIn} className="space-y-3.5 pt-2 text-xs">
            {/* Guest Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Select Primary Guest *</label>
              <select
                required
                value={walkInForm.primaryGuestId}
                onChange={(e) => setWalkInForm({ ...walkInForm, primaryGuestId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                {allGuests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.mobileNumber}) • {g.guestCode}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Select Available Room *</label>
              <select
                required
                value={walkInForm.roomId}
                onChange={(e) => {
                  const sel = allAvailableRooms.find((r) => r.id === e.target.value);
                  setWalkInForm({
                    ...walkInForm,
                    roomId: e.target.value,
                    roomRatePerNight: sel ? Number(sel.pricePerNight) : walkInForm.roomRatePerNight,
                  });
                }}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                {allAvailableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomType?.name} - Floor {r.floor} - ₹{r.pricePerNight}/night)
                  </option>
                ))}
              </select>
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Check-In Date *</label>
                <Input
                  type="date"
                  required
                  value={walkInForm.checkInDate}
                  onChange={(e) => setWalkInForm({ ...walkInForm, checkInDate: e.target.value })}
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Check-In Time *</label>
                <Input
                  required
                  value={walkInForm.checkInTime}
                  onChange={(e) => setWalkInForm({ ...walkInForm, checkInTime: e.target.value })}
                  className="h-8 text-xs font-mono border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Expected Check-Out Date *</label>
                <Input
                  type="date"
                  required
                  value={walkInForm.expectedCheckOutDate}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, expectedCheckOutDate: e.target.value })
                  }
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Expected Check-Out Time</label>
                <Input
                  value={walkInForm.expectedCheckOutTime}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, expectedCheckOutTime: e.target.value })
                  }
                  className="h-8 text-xs font-mono border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Nights & Room Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Number of Nights</label>
                <Input
                  type="number"
                  min="1"
                  value={walkInForm.numberOfNights}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, numberOfNights: Number(e.target.value) })
                  }
                  className="h-8 text-xs border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Room Price Per Night (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={walkInForm.roomRatePerNight}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, roomRatePerNight: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono border-[#E3D9CA]"
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA]">
              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Advance Payment (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={walkInForm.advanceAmount}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, advanceAmount: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono bg-white border-[#E3D9CA]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#362A22]">Payment Method</label>
                <select
                  value={walkInForm.advancePaymentMethod}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, advancePaymentMethod: e.target.value })
                  }
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Card / Bank Transfer</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWalkInModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5"
              >
                {submitting ? (
                  <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                )}
                <span>Check-In Guest Now</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ROOM RELOCATION MODAL                                                     */}
      {/* ========================================================================= */}
      <Dialog open={relocateModalOpen} onOpenChange={setRelocateModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <DialogTitle className="text-base font-serif font-bold text-[#362A22]">
              Relocate Room • {selectedBooking?.primaryGuest?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Currently residing in Room {selectedBooking?.room?.roomNumber}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRelocate} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Target Destination Room *</label>
              {availableRooms.length === 0 ? (
                <div className="p-3 bg-[#F8E8E5] text-[#B54C44] rounded-lg text-xs">
                  No other rooms available for the remaining stay period.
                </div>
              ) : (
                <select
                  required
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType?.name} - Floor {r.floor} - ₹{r.pricePerNight}/night)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Relocation Reason</label>
              <Input
                value={relocateReason}
                onChange={(e) => setRelocateReason(e.target.value)}
                placeholder="e.g. AC maintenance, guest upgrade request"
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRelocateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || availableRooms.length === 0}
                className="bg-[#362A22] hover:bg-[#43352B] text-white"
              >
                {submitting ? "Processing..." : "Confirm Relocation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
