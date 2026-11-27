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
  Download,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { bookingsService } from "@/services/bookings.service";
import { roomsService } from "@/services/rooms.service";
import { guestsService } from "@/services/guests.service";
import { Booking, Room, Guest, CheckoutSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WhatsAppIcon, getWhatsAppCheckInLink } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  const [isManualSettlement, setIsManualSettlement] = useState(false);
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
    guestType: "EXISTING" as "EXISTING" | "NEW",
    primaryGuestId: "",
    newGuestName: "",
    newGuestMobile: "",
    newGuestEmail: "",
    newGuestAddress: "",
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

  // Walk-in Guest Quick Search State
  const [walkInGuestSearch, setWalkInGuestSearch] = useState("");
  const [isSearchingWalkInGuest, setIsSearchingWalkInGuest] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stayToDelete, setStayToDelete] = useState<Booking | null>(null);
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

  const handleConfirmDelete = (b: Booking) => {
    setStayToDelete(b);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!stayToDelete) return;
    try {
      setIsDeleting(true);
      const res = await bookingsService.remove(stayToDelete.id);
      toast.success(res.message || `Stay ${stayToDelete.bookingNumber} deleted`);
      setDeleteModalOpen(false);
      setStayToDelete(null);
      fetchData();
      if (historyModalOpen) {
        fetchHistory(historyMonth, historyYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete stay record");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHistory = async (m?: number, y?: number) => {
    try {
      setHistoryLoading(true);
      const res = await bookingsService.getHistory({
        month: m || historyMonth,
        year: y || historyYear,
      });
      setHistoryData(res);
    } catch (err: any) {
      toast.error("Failed to load stay history");
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
      toast.info("Generating Excel report for Front Desk Stays...");

      let exportItems: any[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await bookingsService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const allRes = await bookingsService.findAll({ limit: 1000 });
        exportItems = allRes.items || [];
        scopeTitle = "All_Stays_Register";
      }

      if (exportItems.length === 0) {
        toast.warning("No stay records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Stays Register");

      // Title Banner
      worksheet.mergeCells("A1:T1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — FRONT DESK STAY & CHECK-IN/OUT REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:T2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Stays: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Booking / Stay #",
        "Stay Status",
        "Room Allocated",
        "Room Category",
        "Guest Full Name",
        "Mobile Number",
        "Check-In Date",
        "Check-In Time",
        "Expected Departure Date",
        "Expected Departure Time",
        "Actual Departure",
        "Nights",
        "Rate / Night (₹)",
        "Advance Paid (₹)",
        "Total Bill Amount (₹)",
        "POS Orders Count",
        "Lifecycle Status",
        "Stay Created Date",
        "Archived / Deletion Date",
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
        const nights = b.numberOfNights || 1;
        const rate = Number(b.roomRatePerNight || 0);
        const advance = Number(b.advanceAmount || 0);
        const inv = b.invoices && b.invoices[0];
        const totalBill = Number(inv?.totalAmount || rate * nights);

        const row = worksheet.addRow([
          idx + 1,
          b.bookingNumber || "—",
          b.bookingStatus || "—",
          b.room?.roomNumber ? `Room ${b.room.roomNumber}` : "—",
          b.room?.roomType?.name || "Standard Room",
          b.primaryGuest?.fullName || "—",
          b.primaryGuest?.mobileNumber || "—",
          b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("en-IN") : "—",
          b.checkInTime || "12:00 PM",
          b.expectedCheckOutDate ? new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN") : "—",
          b.expectedCheckOutTime || "11:00 AM",
          b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toLocaleDateString("en-IN") : "—",
          nights,
          rate,
          advance,
          totalBill,
          b.bookingItems?.length || 0,
          b.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE STAY",
          b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—",
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
            colNum === 4 ||
            colNum === 7 ||
            colNum === 8 ||
            colNum === 9 ||
            colNum === 10 ||
            colNum === 11 ||
            colNum === 12 ||
            colNum === 13 ||
            colNum === 17 ||
            colNum === 18 ||
            colNum === 19 ||
            colNum === 20
          ) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum === 14 || colNum === 15 || colNum === 16) {
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
        { width: 16 },
        { width: 22 },
        { width: 24 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 16 },
        { width: 14 },
        { width: 16 },
        { width: 10 },
        { width: 18 },
        { width: 18 },
        { width: 20 },
        { width: 18 },
        { width: 22 },
        { width: 18 },
        { width: 22 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hotel_Radha_Palace_Stays_${scopeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully (${exportItems.length} stays)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to generate stays Excel report");
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
      item.bookingNumber?.toLowerCase().includes(q) ||
      item.primaryGuest?.fullName?.toLowerCase().includes(q) ||
      item.primaryGuest?.mobileNumber?.includes(q) ||
      item.room?.roomNumber?.toLowerCase().includes(q)
    );
  });

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
        guestsService.findAll({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
        roomsService.findAvailable().catch(() => []),
      ]);

      const guestList: Guest[] = Array.isArray(gRes?.items)
        ? gRes.items
        : Array.isArray(gRes)
        ? (gRes as any)
        : [];
      const roomList: Room[] = Array.isArray(rRes)
        ? rRes
        : Array.isArray((rRes as any)?.items)
        ? (rRes as any).items
        : [];

      setAllGuests(guestList);
      setAllAvailableRooms(roomList);
      setWalkInForm((prev) => ({
        ...prev,
        guestType: guestList.length > 0 ? "EXISTING" : "NEW",
        primaryGuestId: "",
        roomId: roomList[0]?.id || "",
        roomRatePerNight: roomList[0] ? Number(roomList[0].pricePerNight) : 2000,
      }));
      setWalkInGuestSearch("");
      setWalkInModalOpen(true);
    } catch (err: any) {
      console.error("Failed to prepare walk-in check-in:", err);
      setWalkInGuestSearch("");
      setWalkInForm((prev) => ({ ...prev, guestType: "NEW" }));
      setWalkInModalOpen(true);
    }
  };

  // Quick Search registered guest by Mobile #, Name, ID Proof, or Guest Code
  const handleSearchWalkInGuest = async (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      toast.info("Please enter a mobile number, guest name, or ID proof to search");
      return;
    }

    setIsSearchingWalkInGuest(true);

    // 1. Search in local allGuests array first (mobile, name, code, or id proof)
    const cleanDigits = q.replace(/\D/g, "");
    const matched = allGuests.find((g) => {
      const matchName = g.fullName?.toLowerCase().includes(q);
      const matchMobile = cleanDigits.length >= 3 && g.mobileNumber?.replace(/\D/g, "").includes(cleanDigits);
      const matchCode = g.guestCode?.toLowerCase().includes(q);
      const matchId = g.idProofNumber?.toLowerCase().includes(q);
      const matchDoc = (g.documents || []).some((d: any) =>
        d.documentNumber?.toLowerCase().includes(q)
      );
      return matchName || matchMobile || matchCode || matchId || matchDoc;
    });

    if (matched) {
      setWalkInForm((prev) => ({ ...prev, primaryGuestId: matched.id, guestType: "EXISTING" }));
      toast.success(`Guest found: ${matched.fullName} (${matched.mobileNumber})`);
      setIsSearchingWalkInGuest(false);
      return;
    }

    // 2. Query backend API if not in the cached 100 items
    try {
      const res = await guestsService.findAll({ search: query.trim(), limit: 10 });
      const items: Guest[] = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? (res as any)
        : [];

      if (items.length > 0) {
        const found = items[0];
        setAllGuests((prev) => {
          if (!prev.some((g) => g.id === found.id)) {
            return [found, ...prev];
          }
          return prev;
        });
        setWalkInForm((prev) => ({ ...prev, primaryGuestId: found.id, guestType: "EXISTING" }));
        toast.success(`Guest found: ${found.fullName} (${found.mobileNumber})`);
      } else {
        toast.error(`No registered guest found matching "${query}"`);
      }
    } catch (err) {
      toast.error("Failed to query guest records");
    } finally {
      setIsSearchingWalkInGuest(false);
    }
  };

  // Automatic Date & Nights Calculation Helpers for Walk-In Check-In
  const calculateNightsFromDates = (checkInStr: string, checkOutStr: string): number => {
    if (!checkInStr || !checkOutStr) return 1;
    const inDate = new Date(checkInStr + "T00:00:00");
    const outDate = new Date(checkOutStr + "T00:00:00");
    const diffMs = outDate.getTime() - inDate.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const addDaysToDateString = (dateStr: string, days: number): string => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + Math.max(1, days));
    return d.toISOString().split("T")[0];
  };

  const handleWalkInCheckInDateChange = (newCheckIn: string) => {
    if (!newCheckIn) return;
    const currentOut = walkInForm.expectedCheckOutDate;
    if (!currentOut || currentOut <= newCheckIn) {
      const nights = walkInForm.numberOfNights || 1;
      const newOut = addDaysToDateString(newCheckIn, nights);
      setWalkInForm((prev) => ({
        ...prev,
        checkInDate: newCheckIn,
        expectedCheckOutDate: newOut,
      }));
    } else {
      const nights = calculateNightsFromDates(newCheckIn, currentOut);
      setWalkInForm((prev) => ({
        ...prev,
        checkInDate: newCheckIn,
        numberOfNights: nights,
      }));
    }
  };

  const handleWalkInCheckOutDateChange = (newCheckOut: string) => {
    if (!newCheckOut) return;
    const currentIn = walkInForm.checkInDate;
    if (newCheckOut <= currentIn) {
      const newOut = addDaysToDateString(currentIn, 1);
      setWalkInForm((prev) => ({
        ...prev,
        expectedCheckOutDate: newOut,
        numberOfNights: 1,
      }));
      toast.info("Check-out date must be after check-in date. Adjusted to 1 night.");
    } else {
      const nights = calculateNightsFromDates(currentIn, newCheckOut);
      setWalkInForm((prev) => ({
        ...prev,
        expectedCheckOutDate: newCheckOut,
        numberOfNights: nights,
      }));
    }
  };

  const handleWalkInNightsChange = (newNights: number) => {
    const nights = Math.max(1, isNaN(newNights) ? 1 : newNights);
    const newOut = addDaysToDateString(walkInForm.checkInDate, nights);
    setWalkInForm((prev) => ({
      ...prev,
      numberOfNights: nights,
      expectedCheckOutDate: newOut,
    }));
  };

  const handleConfirmWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.roomId) {
      toast.error("Please select an available Room");
      return;
    }

    try {
      setSubmitting(true);
      let targetGuestId = walkInForm.primaryGuestId;

      if (walkInForm.guestType === "NEW") {
        if (!walkInForm.newGuestName.trim() || !walkInForm.newGuestMobile.trim()) {
          toast.error("Please enter guest full name and mobile number");
          setSubmitting(false);
          return;
        }
        const createdGuest = await guestsService.create({
          fullName: walkInForm.newGuestName.trim(),
          mobileNumber: walkInForm.newGuestMobile.trim(),
          email: walkInForm.newGuestEmail.trim() || undefined,
          address: walkInForm.newGuestAddress.trim() || undefined,
        });
        targetGuestId = createdGuest.id;
      } else if (!targetGuestId) {
        toast.error("Please select a registered Guest");
        setSubmitting(false);
        return;
      }

      // 1. Create reservation (with advance payment recorded)
      const created = await bookingsService.create({
        primaryGuestId: targetGuestId,
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

      // 2. Perform instant check-in (advanceAmount = 0 to prevent double advance recording)
      await bookingsService.checkIn(created.id, {
        checkInTime: walkInForm.checkInTime,
        advanceAmount: 0,
        advancePaymentMethod: walkInForm.advancePaymentMethod,
      });

      const guestPhone =
        walkInForm.guestType === "NEW"
          ? walkInForm.newGuestMobile
          : allGuests.find((g) => g.id === targetGuestId)?.mobileNumber;
      const guestName =
        walkInForm.guestType === "NEW"
          ? walkInForm.newGuestName
          : allGuests.find((g) => g.id === targetGuestId)?.fullName || "Guest";
      const selRoom = allAvailableRooms.find((r) => r.id === walkInForm.roomId);

      toast.success("Walk-in check-in completed. Guest is now in-house.", {
        action: guestPhone
          ? {
              label: "WhatsApp",
              onClick: () => {
                window.open(
                  getWhatsAppCheckInLink({
                    guestName,
                    mobileNumber: guestPhone,
                    roomNumber: selRoom?.roomNumber || "",
                    roomType: selRoom?.roomType?.name || "",
                    checkInDate: walkInForm.checkInDate,
                    checkInTime: walkInForm.checkInTime,
                    expectedCheckOutDate: walkInForm.expectedCheckOutDate,
                    expectedCheckOutTime: walkInForm.expectedCheckOutTime,
                    advanceAmount: Number(walkInForm.advanceAmount || 0),
                  }),
                  "_blank"
                );
              },
            }
          : undefined,
      });
      setWalkInModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Walk-in check-in failed");
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
        `Guest ${checkInBooking.primaryGuest?.fullName} checked into Room ${checkInBooking.room?.roomNumber}`,
        {
          action: checkInBooking.primaryGuest?.mobileNumber
            ? {
                label: "WhatsApp",
                onClick: () => {
                  window.open(
                    getWhatsAppCheckInLink({
                      guestName: checkInBooking.primaryGuest?.fullName || "Guest",
                      mobileNumber: checkInBooking.primaryGuest!.mobileNumber,
                      roomNumber: checkInBooking.room?.roomNumber || "",
                      roomType: checkInBooking.room?.roomType?.name || "",
                      checkInDate: checkInBooking.checkInDate,
                      checkInTime,
                      expectedCheckOutDate: checkInBooking.expectedCheckOutDate,
                      expectedCheckOutTime: checkInBooking.expectedCheckOutTime,
                      advanceAmount: Number(checkInAdvanceAmount || 0),
                    }),
                    "_blank"
                  );
                },
              }
            : undefined,
        }
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
      setIsManualSettlement(false);
      setCheckOutModalOpen(true);
      const summary = await bookingsService.getCheckoutSummary(booking.id);
      setCheckoutSummary(summary);
      const fetchedTaxRate = summary.existingInvoice
        ? Number(summary.existingInvoice.taxPercentage)
        : (summary.taxPercentage !== undefined ? Number(summary.taxPercentage) : 12);
      setTaxPercentage(fetchedTaxRate);
      if (summary.existingInvoice?.discountType) {
        setDiscountType(summary.existingInvoice.discountType as any);
        setDiscountValue(Number(summary.existingInvoice.discountValue || 0));
      }
      setSettlementAmount(summary.remainingPayment || 0);
    } catch (err) {
      toast.error("Failed to load live check-out folio");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Recalculate folio when discount, service charges, or tax change in modal
  const computedRoomCharges = checkoutSummary?.roomCharges || 0;
  const computedAdditionalCharges = checkoutSummary?.additionalItemCharges || 0;
  const computedSubtotal = Math.round((computedRoomCharges + computedAdditionalCharges + Number(serviceCharges || 0)) * 100) / 100;
  let computedDiscount = 0;
  if (discountType === "PERCENTAGE") {
    computedDiscount = Math.round(computedSubtotal * (Math.min(100, Math.max(0, Number(discountValue || 0))) / 100) * 100) / 100;
  } else {
    computedDiscount = Math.min(Math.max(0, Number(discountValue || 0)), computedSubtotal);
  }
  const computedTaxable = Math.max(0, Math.round((computedSubtotal - computedDiscount) * 100) / 100);
  const computedTax = Math.round(computedTaxable * (Math.max(0, Number(taxPercentage || 0)) / 100) * 100) / 100;
  const computedTotalBill = Math.round((computedTaxable + computedTax) * 100) / 100;
  const computedPaidAlready = (checkoutSummary?.advancePayment || 0) + (checkoutSummary?.additionalPayments || 0);
  const computedBalanceDue = Math.max(0, Math.round((computedTotalBill - computedPaidAlready) * 100) / 100);

  // Automatically keep settlement amount synchronized with live balance due unless user manually edits it
  useEffect(() => {
    if (checkOutModalOpen && !isManualSettlement) {
      setSettlementAmount(computedBalanceDue);
    }
  }, [computedBalanceDue, checkOutModalOpen, isManualSettlement]);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#C4A06A] uppercase bg-[#F5F0EA] px-2.5 py-0.5 rounded-full">
              Front Desk Operations • Module 6
            </span>
            <span className="text-[11px] text-[#82747A]">• Stay Management & Digital Folios</span>
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-[#59283A] mt-1">
            Check-In & Check-Out Management
          </h2>
          <p className="text-xs text-[#82747A] mt-1 max-w-2xl">
            Manage the complete guest stay lifecycle: check-in details, room allocation, stay duration, in-house guests, room relocations, checkout billing folios, and digital archives.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="h-9 px-3.5 text-xs font-semibold border-[#E8DDD8] text-[#59283A] bg-white hover:bg-[#F5F0EA] flex items-center gap-1.5 shadow-xs transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Stay History</span>
          </Button>

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
            size="sm"
            onClick={fetchData}
            className="text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A] h-9"
          >
            Refresh Board
          </Button>

          <Button
            onClick={handleOpenWalkIn}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-2 text-xs font-medium h-9 shadow-sm"
          >
            <DoorOpen className="w-4 h-4 text-[#C4A06A]" />
            <span>Walk-In Check-In</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1E9] flex items-center justify-center text-[#32765B]">
              <BedDouble className="w-5 h-5 text-[#32765B]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#32765B] tracking-wider">In-House Guests</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{inHouse.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[#59283A]">
              <DoorOpen className="w-5 h-5 text-[#C4A06A]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Pending Check-Ins</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{arrivals.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6EDDC] flex items-center justify-center text-[#A97832]">
              <LogOut className="w-5 h-5 text-[#A97832]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#A97832] tracking-wider">Due Check-Outs</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{departures.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFF3] flex items-center justify-center text-[#627D91]">
              <ShieldCheck className="w-5 h-5 text-[#627D91]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#627D91] tracking-wider">Digital Records</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{archiveTotal}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifecycle Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inhouse")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "inhouse"
              ? "bg-[#59283A] text-white shadow-sm"
              : "text-[#82747A] hover:bg-[#F5F0EA]"
          }`}
        >
          <BedDouble className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Currently In-House ({inHouse.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("arrivals")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "arrivals"
              ? "bg-[#59283A] text-white shadow-sm"
              : "text-[#82747A] hover:bg-[#F5F0EA]"
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Expected Check-Ins ({arrivals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departures")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "departures"
              ? "bg-[#59283A] text-white shadow-sm"
              : "text-[#82747A] hover:bg-[#F5F0EA]"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Today&apos;s Check-Outs ({departures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "archive"
              ? "bg-[#59283A] text-white shadow-sm"
              : "text-[#82747A] hover:bg-[#F5F0EA]"
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#C4A06A]" />
          <span>Digital Check-Out Archive ({archiveTotal})</span>
        </button>
      </div>

      {/* TAB 1: IN-HOUSE GUESTS */}
      {activeTab === "inhouse" && (
        <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex justify-center items-center">
                <LoadingSpinner
                  text="Loading In-House Guests..."
                  subtext="Retrieving checked-in guest folios and room assignments..."
                />
              </div>
            ) : inHouse.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#82747A] space-y-3">
                <BedDouble className="w-10 h-10 text-[#C4A06A] mx-auto opacity-60" />
                <p className="font-medium text-[#59283A]">
                  No guests currently in-house. Check in an arrival from the Arrivals tab or register a Walk-in.
                </p>
                <Button
                  onClick={handleOpenWalkIn}
                  className="bg-[#59283A] hover:bg-[#472130] text-white text-xs"
                >
                  <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Process Walk-In Check-In
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {inHouse.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        {/* Room */}
                        <td className="px-4 py-3.5 font-semibold text-[#59283A]">
                          <div className="text-base font-serif font-bold text-[#59283A]">
                            Room {b.room?.roomNumber}
                          </div>
                          <div className="text-[10px] text-[#82747A]">
                            {b.room?.roomType?.name} • Floor {b.room?.floor}
                          </div>
                        </td>

                        {/* Guest */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-sm text-[#59283A]">
                            {b.primaryGuest?.fullName}
                          </div>
                          <div className="text-[11px] text-[#82747A] font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#C4A06A]" />
                            <span>{b.primaryGuest?.mobileNumber}</span>
                            {b.primaryGuest?.mobileNumber && (
                              <a
                                href={getWhatsAppCheckInLink({
                                  guestName: b.primaryGuest?.fullName || "Guest",
                                  mobileNumber: b.primaryGuest.mobileNumber,
                                  roomNumber: b.room?.roomNumber || "",
                                  roomType: b.room?.roomType?.name || "",
                                  checkInDate: b.checkInDate,
                                  checkInTime: b.actualCheckInAt
                                    ? new Date(b.actualCheckInAt).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : b.checkInTime || "12:00 PM",
                                  expectedCheckOutDate: b.expectedCheckOutDate,
                                  expectedCheckOutTime: b.expectedCheckOutTime || "11:00 AM",
                                  advanceAmount: Number(b.advanceAmount || 0),
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#128C7E] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 transition-all hover:scale-105"
                                title="Send Check-In Confirmation via WhatsApp"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Check-In Timestamp */}
                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div className="font-medium text-[#59283A]">
                            {new Date(b.checkInDate).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-[11px] text-[#8E7079] font-mono">
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
                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div className="font-medium text-[#59283A]">
                            {new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-[11px] text-[#8E7079] font-mono">
                            {b.expectedCheckOutTime || "11:00 AM"}
                          </div>
                        </td>

                        {/* Duration & Rate */}
                        <td className="px-4 py-3.5 text-[#59283A]">
                          <div className="font-semibold">{b.numberOfNights} Night(s)</div>
                          <div className="text-[11px] text-[#82747A] font-mono">
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
                          <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] text-[#59283A]">
                            {b.bookingItems?.length || 0} Orders
                          </Badge>
                        </td>

                        {/* Operations */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {b.primaryGuest?.mobileNumber && (
                            <a
                              href={getWhatsAppCheckInLink({
                                guestName: b.primaryGuest?.fullName || "Guest",
                                mobileNumber: b.primaryGuest.mobileNumber,
                                roomNumber: b.room?.roomNumber || "",
                                roomType: b.room?.roomType?.name || "",
                                checkInDate: b.checkInDate,
                                checkInTime: b.actualCheckInAt
                                  ? new Date(b.actualCheckInAt).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })
                                  : b.checkInTime || "12:00 PM",
                                expectedCheckOutDate: b.expectedCheckOutDate,
                                expectedCheckOutTime: b.expectedCheckOutTime || "11:00 AM",
                                advanceAmount: Number(b.advanceAmount || 0),
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center h-7 px-2 text-xs font-semibold text-[#128C7E] hover:text-[#0b665b] hover:bg-[#25D366]/15 border border-[#25D366]/30 rounded-md transition-colors"
                              title="Send Check-In Confirmation via WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 mr-1 text-[#25D366]" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRelocate(b)}
                            className="h-7 text-xs text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8]"
                            title="Relocate guest to another room"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Relocate
                          </Button>

                          <Link href={`/items?bookingId=${b.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8]"
                              title="Add POS Item or Room Service"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Service
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckOutModal(b)}
                            className="h-7 text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Check-Out Folio
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmDelete(b)}
                            className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                            title="Delete Stay Record"
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

      {/* TAB 2: EXPECTED ARRIVALS (CHECK-INS) */}
      {activeTab === "arrivals" && (
        <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {arrivals.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                <DoorOpen className="w-10 h-10 text-[#C4A06A] mx-auto opacity-60" />
                <p className="font-medium text-[#59283A]">No pending arrivals scheduled for check-in.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {arrivals.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-medium text-[#C4A06A]">
                          <span className="bg-[#F5F0EA] px-2 py-0.5 rounded text-[11px]">
                            {b.bookingNumber}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#59283A]">{b.primaryGuest?.fullName}</div>
                          <div className="text-[11px] text-[#82747A] font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#C4A06A]" />
                            <span>{b.primaryGuest?.mobileNumber}</span>
                            {b.primaryGuest?.mobileNumber && (
                              <a
                                href={getWhatsAppCheckInLink({
                                  guestName: b.primaryGuest?.fullName || "Guest",
                                  mobileNumber: b.primaryGuest.mobileNumber,
                                  roomNumber: b.room?.roomNumber || "",
                                  roomType: b.room?.roomType?.name || "",
                                  checkInDate: b.checkInDate,
                                  checkInTime: b.checkInTime || "12:00 PM",
                                  expectedCheckOutDate: b.expectedCheckOutDate,
                                  expectedCheckOutTime: b.expectedCheckOutTime || "11:00 AM",
                                  advanceAmount: Number(b.advanceAmount || 0),
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#128C7E] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 transition-all hover:scale-105"
                                title="Send Check-In Confirmation via WhatsApp"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#59283A]">Room {b.room?.roomNumber}</span>
                          <span className="text-[11px] text-[#82747A] block">
                            {b.room?.roomType?.name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div>{new Date(b.checkInDate).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-[#8E7079] font-mono">
                            {b.checkInTime || "12:00 PM"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-[#59283A]">
                          {b.numberOfNights} Night(s)
                        </td>

                        <td className="px-4 py-3.5 font-mono font-medium text-[#59283A]">
                          ₹{Number(b.roomRatePerNight).toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded text-[11px]">
                            ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckInModal(b)}
                            className="h-7 text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                          >
                            <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                            Process Check-In
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmDelete(b)}
                            className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                            title="Delete Stay Record"
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

      {/* TAB 3: EXPECTED DEPARTURES (CHECK-OUTS TODAY) */}
      {activeTab === "departures" && (
        <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {departures.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                <LogOut className="w-10 h-10 text-[#C4A06A] mx-auto opacity-60" />
                <p className="font-medium text-[#59283A]">No departures scheduled for check-out today.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {departures.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-sm text-[#59283A]">
                          Room {b.room?.roomNumber}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#59283A]">
                          {b.primaryGuest?.fullName}
                        </td>
                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div>{new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-[#8E7079] font-mono">
                            {b.expectedCheckOutTime || "11:00 AM"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#59283A]">
                          {b.numberOfNights} Nights
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#59283A]">
                          ₹{Number(b.roomRatePerNight).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#32765B]">
                          ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckOutModal(b)}
                            className="h-7 text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                            Check-Out Folio
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmDelete(b)}
                            className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                            title="Delete Stay Record"
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

      {/* TAB 4: DIGITAL CHECK-OUT ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8]">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search archived stays by guest, booking, or room..."
                value={archiveSearch}
                onChange={(e) => {
                  setArchiveSearch(e.target.value);
                  setArchivePage(1);
                }}
                className="pl-9 h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
              />
            </div>
            <div className="text-xs text-[#82747A]">
              Showing <span className="font-semibold text-[#59283A]">{archive.length}</span> of{" "}
              <span className="font-semibold text-[#59283A]">{archiveTotal}</span> completed digital stay records
            </div>
          </div>

          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-16 flex justify-center items-center">
                  <LoadingSpinner
                    text="Loading Digital Checkout Archives..."
                    subtext="Querying historical check-out folios and stay records..."
                  />
                </div>
              ) : archive.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A]">
                  No archived check-out records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {archive.map((b) => {
                        const inv = b.invoices && b.invoices[0];
                        return (
                          <tr key={b.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                            <td className="px-4 py-3.5 font-mono">
                              <span className="font-semibold text-[#59283A] block">
                                {b.bookingNumber}
                              </span>
                              {inv && (
                                <span className="text-[10px] text-[#C4A06A]">{inv.invoiceNumber}</span>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-[#59283A]">
                                {b.primaryGuest?.fullName}
                              </div>
                              <div className="text-[11px] text-[#82747A] font-mono">
                                {b.primaryGuest?.mobileNumber}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="font-bold text-[#59283A]">Room {b.room?.roomNumber}</span>
                              <span className="text-[10px] text-[#82747A] block">{b.room?.roomType?.name}</span>
                            </td>

                            <td className="px-4 py-3.5 text-[#82747A]">
                              <div>{new Date(b.checkInDate).toLocaleDateString("en-IN")}</div>
                              <div className="text-[10px] text-[#8E7079]">
                                Out: {b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toLocaleDateString("en-IN") : "—"}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 font-medium text-[#59283A]">
                              {b.numberOfNights} Nights
                            </td>

                            <td className="px-4 py-3.5 font-mono font-bold text-[#59283A]">
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

                            <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
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
                                className="h-7 text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A]"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                                Folio Dossier
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmDelete(b)}
                                className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                                title="Delete Stay Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        <DialogContent className="max-w-lg bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded w-fit">
              Front Desk Arrival Processing
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Check-In Verification • #{checkInBooking?.bookingNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Verify guest credentials, room allocation, check-in timestamp, and advance payment.
            </DialogDescription>
          </DialogHeader>

          {checkInBooking && (
            <form onSubmit={handleConfirmCheckIn} className="space-y-4 pt-2 text-xs">
              {/* 1. Guest Details */}
              <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#8E7079] tracking-wider block">
                  1. Guest Information
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#59283A] text-sm">
                    {checkInBooking.primaryGuest?.fullName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#82747A]">
                      {checkInBooking.primaryGuest?.mobileNumber}
                    </span>
                    {checkInBooking.primaryGuest?.mobileNumber && (
                      <a
                        href={getWhatsAppCheckInLink({
                          guestName: checkInBooking.primaryGuest?.fullName || "Guest",
                          mobileNumber: checkInBooking.primaryGuest.mobileNumber,
                          roomNumber: checkInBooking.room?.roomNumber || "",
                          roomType: checkInBooking.room?.roomType?.name || "",
                          checkInDate: checkInBooking.checkInDate,
                          checkInTime,
                          expectedCheckOutDate: checkInBooking.expectedCheckOutDate,
                          expectedCheckOutTime: checkInBooking.expectedCheckOutTime,
                          advanceAmount: Number(checkInAdvanceAmount || 0),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#25D366] hover:text-[#1ebd59] p-1 rounded-full hover:bg-[#25D366]/10"
                        title="Chat on WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-[#82747A]">
                  {checkInBooking.primaryGuest?.city || "India"} • ID Verified
                </div>
              </div>

              {/* 2. Room Details & Pricing */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-[#E8DDD8]">
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">
                    2. Room Number & Category
                  </span>
                  <span className="font-bold text-[#59283A]">
                    Room {checkInBooking.room?.roomNumber}
                  </span>
                  <span className="text-[11px] text-[#82747A] block">
                    {checkInBooking.room?.roomType?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">
                    Room Price Per Night
                  </span>
                  <span className="font-mono font-bold text-[#59283A]">
                    ₹{Number(checkInBooking.roomRatePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Check-In Date</label>
                  <Input
                    disabled
                    value={new Date(checkInBooking.checkInDate).toLocaleDateString("en-IN")}
                    className="h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Check-In Time *</label>
                  <Input
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="e.g. 12:30 PM"
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Expected Check-Out Date</label>
                  <Input
                    disabled
                    value={new Date(checkInBooking.expectedCheckOutDate).toLocaleDateString("en-IN")}
                    className="h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Expected Check-Out Time</label>
                  <Input
                    disabled
                    value={checkInBooking.expectedCheckOutTime || "11:00 AM"}
                    className="h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
                  />
                </div>
              </div>

              {/* Number of Nights */}
              <div className="flex justify-between items-center p-2.5 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8]">
                <span className="font-semibold text-[#59283A]">Duration of Stay:</span>
                <span className="font-bold text-[#59283A]">{checkInBooking.numberOfNights} Night(s)</span>
              </div>

              {/* Advance Payment */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DDD8] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#59283A] text-[11px] uppercase tracking-wider">
                    Advance Payment
                  </span>
                  <span className="font-mono text-xs font-bold text-[#32765B]">
                    Existing: ₹{Number(checkInBooking.advanceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[#82747A] font-semibold">Collect Additional Advance (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={checkInAdvanceAmount}
                      onChange={(e) => setCheckInAdvanceAmount(Number(e.target.value))}
                      className="h-8 text-xs font-mono border-[#E8DDD8]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#82747A] font-semibold">Payment Method</label>
                    <select
                      value={checkInAdvanceMethod}
                      onChange={(e) => setCheckInAdvanceMethod(e.target.value)}
                      className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Bank Transfer / Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
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
                  className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
                >
                  {submitting ? (
                    <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
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
        <DialogContent className="max-w-2xl bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A97832] bg-[#F6EDDC] px-2 py-0.5 rounded">
                  Digital Check-Out & Settlement
                </span>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
                  Complete Guest Check-Out • Room {checkOutBooking?.room?.roomNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Guest: {checkOutBooking?.primaryGuest?.fullName} • Folio Breakdown & Balance Settlement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingSummary ? (
            <div className="p-16 flex justify-center items-center">
              <LoadingSpinner
                text="Computing Check-Out Folio..."
                subtext="Calculating room tariff, services consumed, and GST tax balance..."
              />
            </div>
          ) : (
            <form onSubmit={handleConfirmCheckOut} noValidate className="space-y-4 pt-2 text-xs">
              {/* Stay Header Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">Check-In</span>
                  <span className="font-semibold text-[#59283A]">
                    {checkOutBooking ? new Date(checkOutBooking.checkInDate).toLocaleDateString("en-IN") : "—"}
                  </span>
                  <span className="text-[10px] text-[#82747A] block font-mono">
                    {checkOutBooking?.checkInTime || "12:00 PM"}
                  </span>
                </div>

                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">Actual Check-Out</span>
                  <span className="font-semibold text-[#59283A]">
                    {new Date().toLocaleDateString("en-IN")}
                  </span>
                  <span className="text-[10px] text-[#82747A] block font-mono">
                    {actualCheckOutTime}
                  </span>
                </div>

                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">Total Nights</span>
                  <span className="font-bold text-sm text-[#59283A]">
                    {checkoutSummary?.totalNumberOfNights || 1} Night(s)
                  </span>
                </div>

                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold">Room Rate</span>
                  <span className="font-mono font-bold text-[#59283A]">
                    ₹{Number(checkOutBooking?.roomRatePerNight || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Line Items & Charges Breakdown */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DDD8] space-y-2.5">
                <h5 className="font-bold text-[#59283A] uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-[#E8DDD8] pb-1.5">
                  <span>Stay Charges Breakdown</span>
                  <span className="text-[#8E7079] text-[10px] font-normal">All amounts in INR (₹)</span>
                </h5>

                <div className="space-y-1.5">
                  {/* Room Charges */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#82747A]">
                      Room Charges ({checkoutSummary?.totalNumberOfNights} night(s) × ₹
                      {Number(checkOutBooking?.roomRatePerNight || 0).toLocaleString("en-IN")}):
                    </span>
                    <span className="font-mono font-semibold text-[#59283A]">
                      ₹{computedRoomCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Additional Item Charges */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#82747A]">
                      Additional Item Charges (Room Service, POS, Minibar):
                    </span>
                    <span className="font-mono font-semibold text-[#59283A]">
                      ₹{computedAdditionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Additional Items breakdown (if any) */}
                  {checkoutSummary?.additionalItems && checkoutSummary.additionalItems.length > 0 && (
                    <div className="pl-3 py-1 border-l-2 border-[#E8DDD8] text-[11px] space-y-0.5 text-[#82747A]">
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
                    <span className="text-[#82747A]">Service Charges / Facility Fees:</span>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={serviceCharges}
                        onChange={(e) => {
                          setServiceCharges(e.target.value === "" ? 0 : Number(e.target.value));
                          setIsManualSettlement(false);
                        }}
                        className="h-7 text-xs font-mono text-right border-[#E8DDD8]"
                      />
                    </div>
                  </div>

                  {/* Discount Input */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#82747A]">Discount:</span>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="h-6 text-[10px] border border-[#E8DDD8] rounded px-1 bg-white"
                      >
                        <option value="PERCENTAGE">% Percentage</option>
                        <option value="FIXED">₹ Fixed Amount</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={discountValue}
                        onChange={(e) => {
                          setDiscountValue(e.target.value === "" ? 0 : Number(e.target.value));
                          setIsManualSettlement(false);
                        }}
                        className="h-7 w-20 text-xs font-mono text-right border-[#E8DDD8]"
                      />
                      <span className="font-mono text-xs text-rose-600 font-medium w-24 text-right">
                        -₹{computedDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Tax / GST - Locked to Automatic Billing / Folio Rate */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#82747A] font-semibold">Tax / GST:</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold border",
                          Number(taxPercentage) === 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-[#F5F0EA] text-[#59283A] border-[#E8DDD8]"
                        )}
                      >
                        {Number(taxPercentage) === 0
                          ? "0% (Non-GST Billing)"
                          : `${taxPercentage}% GST (${checkoutSummary?.existingInvoice ? "From Billing Invoice" : "Standard"})`}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#59283A] w-28 text-right">
                      {Number(taxPercentage) === 0
                        ? "₹0.00"
                        : `+₹${computedTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>

                  {/* Total Bill Amount */}
                  <div className="flex justify-between items-center text-sm font-bold text-[#59283A] pt-2 border-t border-[#E8DDD8]">
                    <span>Total Bill Amount:</span>
                    <span className="font-mono text-base text-[#59283A]">
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
                  <div
                    onClick={() => {
                      setIsManualSettlement(false);
                      setSettlementAmount(computedBalanceDue);
                    }}
                    className="flex justify-between items-center text-sm font-bold p-2.5 bg-[#F6EDDC] rounded-lg border border-[#A97832]/30 mt-2 cursor-pointer hover:bg-[#F3E6D0] transition-colors"
                    title="Click to copy balance due to settlement amount"
                  >
                    <span className="text-[#A97832]">Remaining Payment (Balance Due):</span>
                    <span className="font-mono text-base text-[#A97832]">
                      ₹{computedBalanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Payment Section */}
              <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2.5">
                <span className="font-bold text-[#59283A] text-[11px] uppercase tracking-wider block">
                  Check-Out Settlement Payment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#59283A]">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">Card / Bank Transfer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#59283A] block mb-0.5 whitespace-nowrap">
                      Settlement Amount (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={settlementAmount}
                      onChange={(e) => {
                        setIsManualSettlement(true);
                        setSettlementAmount(e.target.value === "" ? 0 : Number(e.target.value));
                      }}
                      className="h-8 text-xs font-mono bg-white border-[#E8DDD8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#59283A]">Actual Check-Out Time</label>
                    <Input
                      value={actualCheckOutTime}
                      onChange={(e) => setActualCheckOutTime(e.target.value)}
                      className="h-8 text-xs font-mono bg-white border-[#E8DDD8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#59283A]">Notes / Settlement Remarks</label>
                  <Input
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                    placeholder="e.g. Settled in full at front desk counter"
                    className="h-8 text-xs bg-white border-[#E8DDD8]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
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
                  className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
                >
                  {submitting ? (
                    <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
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
        <DialogContent className="max-w-xl bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded">
                  {Number(receiptData?.folio?.tax || receiptData?.invoice?.taxAmount || 0) > 0
                    ? "Official GST Tax Invoice • Stay Settled"
                    : "Official Guest Stay Receipt (Non-GST) • Stay Settled"}
                </span>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
                  {receiptData?.invoice?.invoiceNumber || "Digital Checkout Dossier"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Archived permanently in secure database.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="h-8 text-xs border-[#C4A06A] text-[#59283A]"
              >
                <Printer className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                Print Folio
              </Button>
            </div>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Hotel & Guest dossier */}
              <div className="p-4 rounded-xl bg-[#F5F0EA] border border-[#E8DDD8] space-y-2">
                <div className="flex justify-between border-b border-[#E8DDD8] pb-2">
                  <div>
                    <span className="font-bold text-[#59283A] text-sm block">GRAND BOUTIQUE HOTEL</span>
                    <span className="text-[10px] text-[#82747A]">Luxury Hospitality Suite</span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-[#59283A]">
                    <div>Booking: {receiptData.booking?.bookingNumber}</div>
                    <div className="text-[#C4A06A] font-bold">{receiptData.invoice?.invoiceNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[#8E7079] block text-[10px]">Guest Name:</span>
                    <span className="font-semibold text-[#59283A]">
                      {receiptData.booking?.primaryGuest?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E7079] block text-[10px]">Room Allocated:</span>
                    <span className="font-bold text-[#59283A]">
                      Room {receiptData.booking?.room?.roomNumber} ({receiptData.booking?.room?.roomType?.name})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E7079] block text-[10px]">Check-In:</span>
                    <span className="text-[#59283A]">
                      {new Date(receiptData.booking?.checkInDate).toLocaleDateString("en-IN")}{" "}
                      {receiptData.booking?.checkInTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E7079] block text-[10px]">Check-Out:</span>
                    <span className="text-[#59283A]">
                      {receiptData.folio?.actualCheckOutDate || new Date().toLocaleDateString("en-IN")}{" "}
                      {receiptData.folio?.actualCheckOutTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Folio Table */}
              <div className="border border-[#E8DDD8] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-3 py-2">Charge Description</th>
                      <th className="px-3 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
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
                    {Number(receiptData.folio?.tax || receiptData.invoice?.taxAmount || 0) > 0 ? (
                      <tr>
                        <td className="px-3 py-2">
                          Applicable Taxes (GST {receiptData.invoice?.taxPercentage ? `${receiptData.invoice.taxPercentage}%` : ""})
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          ₹{Number(receiptData.folio?.tax || receiptData.invoice?.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="font-bold bg-[#F5F0EA]/60 text-[#59283A]">
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
                  className="bg-[#59283A] hover:bg-[#472130] text-white text-xs w-full sm:w-auto"
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
        <DialogContent className="max-w-xl bg-white border-[#E8DDD8] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Front Desk Quick Intake
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              Direct Walk-In Check-In
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Instantly assign room, record check-in time, collect advance payment, and mark guest in-house.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmWalkIn} className="space-y-3.5 pt-2 text-xs">
            {/* Guest Selection Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#59283A]">Primary Guest *</label>
                <div className="inline-flex rounded-md p-0.5 bg-[#F5F0EA] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, guestType: "EXISTING" })}
                    className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                      walkInForm.guestType === "EXISTING"
                        ? "bg-[#59283A] text-white shadow-sm"
                        : "text-[#82747A] hover:text-[#59283A]"
                    }`}
                  >
                    Select Registered ({allGuests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInForm({ ...walkInForm, guestType: "NEW" })}
                    className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                      walkInForm.guestType === "NEW"
                        ? "bg-[#59283A] text-white shadow-sm"
                        : "text-[#82747A] hover:text-[#59283A]"
                    }`}
                  >
                    + Quick New Guest
                  </button>
                </div>
              </div>

              {walkInForm.guestType === "EXISTING" ? (
                <div className="space-y-2">
                  {/* Quick Search Row alongside dropdown */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#C4A06A]" />
                      <Input
                        type="text"
                        placeholder="Search by Mobile #, Name, or ID Proof..."
                        value={walkInGuestSearch}
                        onChange={(e) => setWalkInGuestSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchWalkInGuest(walkInGuestSearch);
                          }
                        }}
                        className="pl-8 pr-7 h-8 text-xs border-[#E8DDD8] bg-white text-[#59283A] placeholder:text-[#8E7079]"
                      />
                      {walkInGuestSearch && (
                        <button
                          type="button"
                          onClick={() => setWalkInGuestSearch("")}
                          className="absolute right-2 top-2 text-[#8E7079] hover:text-[#59283A]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchWalkInGuest(walkInGuestSearch)}
                      disabled={isSearchingWalkInGuest}
                      className="h-8 px-3 border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] text-xs font-semibold shrink-0"
                    >
                      {isSearchingWalkInGuest ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Dropdown Selector */}
                  {allGuests.length > 0 ? (
                    <select
                      value={walkInForm.primaryGuestId}
                      onChange={(e) => setWalkInForm({ ...walkInForm, primaryGuestId: e.target.value })}
                      className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                    >
                      <option value="">-- Select Registered Guest (or Search Above) --</option>
                      {allGuests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.fullName} ({g.mobileNumber}) • {g.guestCode}
                          {g.idProofNumber ? ` • ${g.idProofType || "ID"}: ${g.idProofNumber}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8] text-[11px] text-[#82747A] flex items-center justify-between">
                      <span>No registered guests found in system.</span>
                      <button
                        type="button"
                        onClick={() => setWalkInForm({ ...walkInForm, guestType: "NEW" })}
                        className="text-[#59283A] font-semibold underline"
                      >
                        Enter Guest Details
                      </button>
                    </div>
                  )}

                  {/* Instant Guest Information Preview Card */}
                  {(() => {
                    if (!walkInForm.primaryGuestId) return null;
                    const selectedGuest = allGuests.find((g) => g.id === walkInForm.primaryGuestId);
                    if (!selectedGuest) return null;
                    return (
                      <div className="p-2.5 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[#59283A]">
                            <span>{selectedGuest.fullName}</span>
                            <span className="font-mono text-[10px] text-[#C4A06A] bg-white px-1.5 py-0.2 rounded border border-[#E8DDD8]">
                              {selectedGuest.guestCode}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#32765B]" />
                            Guest Verified
                          </span>
                        </div>
                        <div className="text-[11px] text-[#82747A] flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 font-mono text-[#59283A]">
                            <Phone className="w-3 h-3 text-[#C4A06A]" />
                            {selectedGuest.mobileNumber}
                          </span>
                          {selectedGuest.idProofNumber && (
                            <span className="flex items-center gap-1">
                              <span className="font-semibold text-[#59283A]">{selectedGuest.idProofType || "ID"}:</span>
                              <span className="font-mono">{selectedGuest.idProofNumber}</span>
                            </span>
                          )}
                          {selectedGuest.city && (
                            <span>• {selectedGuest.city}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] uppercase font-bold text-[#82747A]">Full Name *</label>
                      <Input
                        required={walkInForm.guestType === "NEW"}
                        placeholder="e.g. Ramesh Kumar"
                        value={walkInForm.newGuestName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, newGuestName: e.target.value })}
                        className="h-7 text-xs bg-white border-[#E8DDD8]"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] uppercase font-bold text-[#82747A]">Mobile Number *</label>
                      <Input
                        required={walkInForm.guestType === "NEW"}
                        placeholder="10-digit mobile"
                        value={walkInForm.newGuestMobile}
                        onChange={(e) => setWalkInForm({ ...walkInForm, newGuestMobile: e.target.value })}
                        className="h-7 text-xs font-mono bg-white border-[#E8DDD8]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] uppercase font-bold text-[#82747A]">Email (Optional)</label>
                      <Input
                        type="email"
                        placeholder="guest@example.com"
                        value={walkInForm.newGuestEmail}
                        onChange={(e) => setWalkInForm({ ...walkInForm, newGuestEmail: e.target.value })}
                        className="h-7 text-xs bg-white border-[#E8DDD8]"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[10px] uppercase font-bold text-[#82747A]">City / Address (Optional)</label>
                      <Input
                        placeholder="e.g. Mumbai, MH"
                        value={walkInForm.newGuestAddress}
                        onChange={(e) => setWalkInForm({ ...walkInForm, newGuestAddress: e.target.value })}
                        className="h-7 text-xs bg-white border-[#E8DDD8]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select Available Room *</label>
              {allAvailableRooms.length > 0 ? (
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
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="">-- Choose Available Room --</option>
                  {allAvailableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType?.name} - Floor {r.floor} - ₹{r.pricePerNight}/night)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                  All rooms are currently occupied or under maintenance. No room is available for walk-in.
                </div>
              )}
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Check-In Date *</label>
                <Input
                  type="date"
                  required
                  value={walkInForm.checkInDate}
                  onChange={(e) => handleWalkInCheckInDateChange(e.target.value)}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Check-In Time *</label>
                <Input
                  required
                  value={walkInForm.checkInTime}
                  onChange={(e) => setWalkInForm({ ...walkInForm, checkInTime: e.target.value })}
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Expected Check-Out Date *</label>
                <Input
                  type="date"
                  required
                  value={walkInForm.expectedCheckOutDate}
                  onChange={(e) => handleWalkInCheckOutDateChange(e.target.value)}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Expected Check-Out Time</label>
                <Input
                  value={walkInForm.expectedCheckOutTime}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, expectedCheckOutTime: e.target.value })
                  }
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Nights & Room Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#59283A]">Number of Nights</label>
                  <span className="text-[10px] text-[#2E5E44] bg-[#E7F1E9] px-1.5 py-0.5 rounded font-medium">
                    ✓ Auto-calculated
                  </span>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={walkInForm.numberOfNights}
                  onChange={(e) => handleWalkInNightsChange(Number(e.target.value))}
                  className="h-8 text-xs border-[#E8DDD8] font-bold bg-[#F5F0EA]/40 text-[#59283A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Room Price Per Night (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={walkInForm.roomRatePerNight}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, roomRatePerNight: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Advance Payment (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={walkInForm.advanceAmount}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, advanceAmount: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono bg-white border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Payment Method</label>
                <select
                  value={walkInForm.advancePaymentMethod}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, advancePaymentMethod: e.target.value })
                  }
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Card / Bank Transfer</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
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
                className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
              >
                {submitting ? (
                  <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <DoorOpen className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
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
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <DialogTitle className="text-base font-serif font-bold text-[#59283A]">
              Relocate Room • {selectedBooking?.primaryGuest?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Currently residing in Room {selectedBooking?.room?.roomNumber}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRelocate} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Target Destination Room *</label>
              {availableRooms.length === 0 ? (
                <div className="p-3 bg-[#F8E8E5] text-[#B54C44] rounded-lg text-xs">
                  No other rooms available for the remaining stay period.
                </div>
              ) : (
                <select
                  required
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
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
              <label className="font-semibold text-[#59283A]">Relocation Reason</label>
              <Input
                value={relocateReason}
                onChange={(e) => setRelocateReason(e.target.value)}
                placeholder="e.g. AC maintenance, guest upgrade request"
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
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
                className="bg-[#59283A] hover:bg-[#472130] text-white"
              >
                {submitting ? "Processing..." : "Confirm Relocation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE STAY RECORD CONFIRMATION MODAL                                     */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F8E8E5] flex items-center justify-center text-[#B54C44] mx-auto mb-1 border border-[#B54C44]/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-serif text-lg font-bold text-[#59283A]">
              Delete Stay Record?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#82747A]">
              Are you sure you want to delete stay record{" "}
              <strong className="text-[#59283A]">{stayToDelete?.bookingNumber}</strong> for{" "}
              <strong className="text-[#59283A]">{stayToDelete?.primaryGuest?.fullName || "Guest"}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This stay&apos;s complete guest details, room history, POS orders, invoices, and billing payments will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Database Removal:</strong> The record will be removed from your active front-desk stay boards, and Room {stayToDelete?.room?.roomNumber} will automatically be restored to <strong>AVAILABLE</strong> if currently in-house.
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
                setStayToDelete(null);
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
                  <span>Yes, Delete Stay</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH STAY HISTORY & ARCHIVE MODAL                                   */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Stay Activity &amp; In-House Records</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Stay History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month guest check-ins, in-house stays, settled checkout folios, and deleted records.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Stay Records</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <BedDouble className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active / Checked-In</div>
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
                placeholder="Search history by booking #, guest name, mobile, room..."
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
                title="Download this month's complete record"
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
                <LoadingSpinner size="md" text="Loading stay history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No stay or deletion activity found for {historyData?.monthName || "this month"}.
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
                        {item.isDeleted ? <Trash2 className="w-4 h-4" /> : <BedDouble className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#59283A] font-mono">{item.bookingNumber}</span>
                          <span className="font-semibold text-xs text-[#59283A]">
                            {item.primaryGuest?.fullName || "Guest"}
                          </span>
                          <span className="text-[11px] text-[#8E7079] font-mono">
                            {item.primaryGuest?.mobileNumber}
                          </span>
                          <span className="text-[11px] bg-[#F5F0EA] text-[#59283A] px-2 py-0.5 rounded font-medium">
                            Room {item.room?.roomNumber} ({item.room?.roomType?.name || "Standard"})
                          </span>
                          {item.isDeleted ? (
                            <Badge className="text-[9px] bg-[#F8E8E5] text-[#B54C44] border-[#B54C44]/30">
                              Deleted / Archived
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-semibold ${
                                item.bookingStatus === "CHECKED_IN"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.bookingStatus === "RESERVED"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : item.bookingStatus === "CHECKED_OUT"
                                  ? "bg-slate-100 text-[#7A4652] border-slate-300"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {item.bookingStatus}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#82747A] mt-1 flex-wrap">
                          <span>
                            Check-In: <strong>{new Date(item.checkInDate).toLocaleDateString("en-IN")}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Departure: <strong>{new Date(item.expectedCheckOutDate).toLocaleDateString("en-IN")}</strong> ({item.numberOfNights} Nights)
                          </span>
                          <span>•</span>
                          <span>
                            Advance: <strong className="text-emerald-700">₹{Number(item.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                          </span>
                          <span>•</span>
                          {item.isDeleted ? (
                            <span className="text-[#B54C44] font-medium">
                              Archived: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-IN") : "Recorded"}
                            </span>
                          ) : (
                            <span>
                              Created: {new Date(item.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const inv = item.invoices && item.invoices[0];
                          setReceiptData({
                            booking: item,
                            invoice: inv,
                            folio: {
                              actualCheckOutDate: item.actualCheckOutAt ? new Date(item.actualCheckOutAt).toISOString().split("T")[0] : "",
                              actualCheckOutTime: "11:00 AM",
                              totalNumberOfNights: item.numberOfNights,
                              roomCharges: Number(inv?.roomCharges || Number(item.roomRatePerNight) * item.numberOfNights),
                              additionalItemCharges: Number(inv?.additionalCharges || 0),
                              serviceCharges: 0,
                              discount: Number(inv?.discountAmount || 0),
                              tax: Number(inv?.taxAmount || 0),
                              totalBillAmount: Number(inv?.totalAmount || 0),
                              advancePayment: Number(item.advanceAmount || 0),
                              additionalPayments: Number(inv?.totalPaid || 0) - Number(item.advanceAmount || 0),
                              remainingPayment: 0,
                            },
                          });
                          setReceiptModalOpen(true);
                        }}
                        className="h-7 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                        <span>Dossier</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t border-[#E8DDD8] bg-white flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-[#82747A]">
              Showing {filteredHistoryItems.length} of {historyData?.totalCount || 0} stay records for {historyData?.monthName || "selected month"}.
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
