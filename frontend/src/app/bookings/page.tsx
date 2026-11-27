"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Eye,
  XCircle,
  Clock,
  User,
  BedDouble,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  DoorOpen,
  LogOut,
  Download,
  History,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { bookingsService } from "@/services/bookings.service";
import { guestsService } from "@/services/guests.service";
import { roomsService } from "@/services/rooms.service";
import { Booking, Guest, Room } from "@/types";
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New booking modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Catalog data for modal
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
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

  // Form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = new Date().toISOString().split("T")[0];
  const defaultCheckOut = tomorrow.toISOString().split("T")[0];

  const [bookingForm, setBookingForm] = useState({
    primaryGuestId: "",
    roomId: "",
    checkInDate: defaultCheckIn,
    checkInTime: "12:00 PM",
    expectedCheckOutDate: defaultCheckOut,
    expectedCheckOutTime: "11:00 AM",
    numberOfGuests: 1,
    roomRatePerNight: 2000,
    advanceAmount: 0,
    advancePaymentMethod: "CASH" as "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER",
    notes: "",
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsService.findAll({
        status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setBookings(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, search]);

  const handleOpenCreate = async () => {
    try {
      const [gRes, rRes] = await Promise.all([
        guestsService.findAll({ limit: 100 }),
        roomsService.findAvailable({
          checkIn: bookingForm.checkInDate,
          checkOut: bookingForm.expectedCheckOutDate,
        }),
      ]);
      setGuests(gRes.items);
      setAvailableRooms(rRes);

      if (gRes.items.length > 0 && !bookingForm.primaryGuestId) {
        setBookingForm((prev) => ({ ...prev, primaryGuestId: gRes.items[0].id }));
      }
      if (rRes.length > 0 && !bookingForm.roomId) {
        setBookingForm((prev) => ({
          ...prev,
          roomId: rRes[0].id,
          roomRatePerNight: Number(rRes[0].pricePerNight),
        }));
      }

      setCreateModalOpen(true);
    } catch (err) {
      toast.error("Error preparing booking form");
    }
  };

  // Recalculate available rooms when dates change
  const handleDatesChange = async (inDate: string, outDate: string) => {
    setBookingForm((prev) => ({
      ...prev,
      checkInDate: inDate,
      expectedCheckOutDate: outDate,
    }));

    if (inDate && outDate && new Date(outDate) > new Date(inDate)) {
      try {
        const rooms = await roomsService.findAvailable({
          checkIn: inDate,
          checkOut: outDate,
        });
        setAvailableRooms(rooms);
        if (rooms.length > 0) {
          setBookingForm((prev) => ({
            ...prev,
            roomId: rooms[0].id,
            roomRatePerNight: Number(rooms[0].pricePerNight),
          }));
        }
      } catch (_) {}
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.primaryGuestId) {
      toast.error("Please select a primary guest");
      return;
    }
    if (!bookingForm.roomId) {
      toast.error("Please select an available room");
      return;
    }

    try {
      setSubmitting(true);
      await bookingsService.create(bookingForm);
      toast.success("Reservation created successfully");
      setCreateModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      await bookingsService.cancel(selectedBooking.id, cancelReason);
      toast.success(`Booking ${selectedBooking.bookingNumber} cancelled`);
      setCancelModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const b = await bookingsService.findOne(id);
      setSelectedBooking(b);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error("Could not load booking details");
    }
  };

  const handleCheckIn = async (b: Booking) => {
    try {
      await bookingsService.checkIn(b.id);
      toast.success(`Guest ${b.primaryGuest?.fullName || "Guest"} checked into Room ${b.room?.roomNumber}`);
      fetchBookings();
      if (detailsModalOpen) setDetailsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check in guest");
    }
  };

  const handleCheckOut = async (b: Booking) => {
    try {
      await bookingsService.checkOut(b.id);
      toast.success(`Guest ${b.primaryGuest?.fullName || "Guest"} checked out. Room ${b.room?.roomNumber} marked AVAILABLE.`);
      fetchBookings();
      if (detailsModalOpen) setDetailsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check out guest");
    }
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleConfirmDelete = (b: Booking) => {
    setBookingToDelete(b);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!bookingToDelete) return;
    try {
      setIsDeleting(true);
      const res = await bookingsService.remove(bookingToDelete.id);
      toast.success(res.message || `Booking ${bookingToDelete.bookingNumber} deleted`);
      setDeleteModalOpen(false);
      setBookingToDelete(null);
      fetchBookings();
      if (historyModalOpen) {
        fetchHistory(historyMonth, historyYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete booking");
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
      toast.error("Failed to load booking history");
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
      toast.info("Generating Excel report for Reservations & Bookings...");

      let exportItems: any[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await bookingsService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const allRes = await bookingsService.findAll({ limit: 1000 });
        exportItems = allRes.items || [];
        scopeTitle = "All_Reservations";
      }

      if (exportItems.length === 0) {
        toast.warning("No reservation records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Booking Register");

      // Title Banner
      worksheet.mergeCells("A1:T1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — RESERVATIONS & BOOKING REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:T2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Reservations: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Booking #",
        "Booking Status",
        "Primary Guest Name",
        "Mobile Number",
        "Allocated Room",
        "Room Category",
        "Check-In Date",
        "Check-In Time",
        "Check-Out Date",
        "Check-Out Time",
        "Nights",
        "Guests (Pax)",
        "Rate / Night (₹)",
        "Advance Paid (₹)",
        "Total Estimated (₹)",
        "Special Notes",
        "Lifecycle Status",
        "Reservation Date",
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
        const totalEst = nights * rate;

        const row = worksheet.addRow([
          idx + 1,
          b.bookingNumber || "—",
          b.bookingStatus || "—",
          b.primaryGuest?.fullName || "—",
          b.primaryGuest?.mobileNumber || "—",
          b.room?.roomNumber ? `Room ${b.room.roomNumber}` : "—",
          b.room?.roomType?.name || "Standard Room",
          b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("en-IN") : "—",
          b.checkInTime || "12:00 PM",
          b.expectedCheckOutDate ? new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN") : "—",
          b.expectedCheckOutTime || "11:00 AM",
          nights,
          b.numberOfGuests || 1,
          rate,
          advance,
          totalEst,
          b.notes || "—",
          b.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE RESERVATION",
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
            colNum === 5 ||
            colNum === 6 ||
            colNum === 8 ||
            colNum === 9 ||
            colNum === 10 ||
            colNum === 11 ||
            colNum === 12 ||
            colNum === 13 ||
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
        { width: 24 },
        { width: 18 },
        { width: 16 },
        { width: 22 },
        { width: 16 },
        { width: 14 },
        { width: 16 },
        { width: 14 },
        { width: 10 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 20 },
        { width: 28 },
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
      link.download = `Hotel_Radha_Palace_Bookings_${scopeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully (${exportItems.length} reservations)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to generate bookings Excel report");
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

  // Calculate nights
  const calculatedNights = Math.max(
    1,
    Math.ceil(
      (new Date(bookingForm.expectedCheckOutDate).getTime() -
        new Date(bookingForm.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const estimatedTotal = calculatedNights * Number(bookingForm.roomRatePerNight);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#59283A]">
            Booking & Stay Reservations
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
            Create new reservations, select rooms, manage advance payments, and review stay records.
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
            <span>Booking History</span>
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
            onClick={handleOpenCreate}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 shadow-sm text-xs h-9 px-4 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-[#82747A] mr-1">Status:</span>
          {["ALL", "RESERVED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map((st) => (
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
            placeholder="Search booking # or guest..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="border-[#E8DDD8] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner text="Loading Reservations & Bookings..." subtext="Retrieving upcoming reservations and advance allocations..." />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8E7079]">
              No reservations found. Click &quot;New Reservation&quot; to book a room.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                  <tr>
                    <th className="px-4 py-3">Booking #</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Nights</th>
                    <th className="px-4 py-3">Advance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD8]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-[#C4A06A]">
                        {b.bookingNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#59283A]">
                        <div>{b.primaryGuest?.fullName}</div>
                        <div className="text-[11px] text-[#8E7079] font-mono">
                          {b.primaryGuest?.mobileNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#59283A]">Room {b.room?.roomNumber}</span>
                        <span className="text-[10px] text-[#8E7079] block">{b.room?.roomType?.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#82747A]">
                        <div>{new Date(b.checkInDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#8E7079]">
                          to {new Date(b.expectedCheckOutDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#7A4652]">
                        {b.numberOfNights} Nights
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">
                        ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            b.bookingStatus === "CHECKED_IN"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : b.bookingStatus === "RESERVED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : b.bookingStatus === "CHECKED_OUT"
                              ? "bg-slate-100 text-[#7A4652] border-slate-300"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {b.bookingStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {b.bookingStatus === "RESERVED" && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(b)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
                            title="Check In Guest Now"
                          >
                            <DoorOpen className="w-3.5 h-3.5 mr-1" /> Check-In
                          </Button>
                        )}
                        {b.bookingStatus === "CHECKED_IN" && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckOut(b)}
                            className="h-7 px-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
                            title="Check Out Guest Now"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1" /> Check-Out
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(b.id)}
                          className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A] hover:bg-[#EFE8E0]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {b.bookingStatus === "RESERVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCancel(b)}
                            className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirmDelete(b)}
                          className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] hover:text-[#963730]"
                          title="Delete Reservation Record"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E8DDD8] flex items-center justify-between text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-[#82747A]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Reservation Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Create New Stay Reservation
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Allocates room and prevents overlapping stays using PostgreSQL GiST exclusion constraint.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBooking} className="space-y-4 pt-2 text-xs">
            {/* Primary Guest Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Primary Guest *</label>
              <select
                required
                value={bookingForm.primaryGuestId}
                onChange={(e) => setBookingForm({ ...bookingForm, primaryGuestId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
              >
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.guestCode} • {g.mobileNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Stay Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Check-In Date *</label>
                <Input
                  type="date"
                  required
                  value={bookingForm.checkInDate}
                  onChange={(e) => handleDatesChange(e.target.value, bookingForm.expectedCheckOutDate)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Expected Check-Out Date *</label>
                <Input
                  type="date"
                  required
                  value={bookingForm.expectedCheckOutDate}
                  onChange={(e) => handleDatesChange(bookingForm.checkInDate, e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Room Selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-[#7A4652]">Select Available Room *</label>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {availableRooms.length} Rooms Available for these dates
                </span>
              </div>
              <select
                required
                value={bookingForm.roomId}
                onChange={(e) => {
                  const sel = availableRooms.find((r) => r.id === e.target.value);
                  setBookingForm({
                    ...bookingForm,
                    roomId: e.target.value,
                    roomRatePerNight: sel ? Number(sel.pricePerNight) : bookingForm.roomRatePerNight,
                  });
                }}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white font-mono"
              >
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomType?.name} • ₹{Number(r.pricePerNight)}/night)
                  </option>
                ))}
              </select>
            </div>

            {/* Rate & Guests breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Room Rate Snapshot (₹/night)</label>
                <Input
                  type="number"
                  min="0"
                  value={bookingForm.roomRatePerNight}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomRatePerNight: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Number of Guests</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={bookingForm.numberOfGuests}
                  onChange={(e) => setBookingForm({ ...bookingForm, numberOfGuests: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Advance Payment */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Advance Deposit (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={bookingForm.advanceAmount}
                  onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#7A4652]">Payment Method</label>
                <select
                  value={bookingForm.advancePaymentMethod}
                  onChange={(e) => setBookingForm({ ...bookingForm, advancePaymentMethod: e.target.value as any })}
                  className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="OTHER">Card / Other</option>
                </select>
              </div>
            </div>

            {/* Estimated Total Card */}
            <div className="p-3 bg-[#F5F0EA] border border-[#E8DDD8] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-indigo-800 font-semibold block">
                  Stay Duration: {calculatedNights} {calculatedNights === 1 ? "Night" : "Nights"}
                </span>
                <span className="text-[11px] text-[#C4A06A]">
                  Rate: ₹{bookingForm.roomRatePerNight} × {calculatedNights}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#C4A06A] uppercase block font-semibold">Estimated Total</span>
                <span className="text-base font-bold text-indigo-900 font-mono">
                  ₹{estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Special Notes</label>
              <Input
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="Airport pickup, ground floor preference..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#59283A] hover:bg-[#472130] text-white">
                {submitting ? "Reserving..." : "Confirm Reservation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#59283A]">
              Cancel Reservation
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Are you sure you want to cancel booking {selectedBooking?.bookingNumber}? This will release the allocated room back to AVAILABLE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#7A4652]">Cancellation Reason</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Guest requested cancellation, flight delayed..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmCancel}>
              Cancel Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Booking Details Sheet */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-[#59283A] font-mono">
                  {selectedBooking?.bookingNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Created on {selectedBooking ? new Date(selectedBooking.createdAt).toLocaleString() : ""}
                </DialogDescription>
              </div>
              {selectedBooking && (
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    selectedBooking.bookingStatus === "CHECKED_IN"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedBooking.bookingStatus === "RESERVED"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-[#7A4652] border-slate-300"
                  }`}
                >
                  {selectedBooking.bookingStatus}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F0EA] rounded-xl">
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-semibold">Primary Guest</span>
                  <span className="font-semibold text-[#59283A]">{selectedBooking.primaryGuest?.fullName}</span>
                  <span className="text-[11px] text-[#82747A] block font-mono">
                    {selectedBooking.primaryGuest?.mobileNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-semibold">Allocated Room</span>
                  <span className="font-semibold text-[#59283A]">Room {selectedBooking.room?.roomNumber}</span>
                  <span className="text-[11px] text-[#82747A] block">
                    {selectedBooking.room?.roomType?.name} • ₹{Number(selectedBooking.roomRatePerNight)}/night
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-semibold">Check-In</span>
                  <span className="text-[#59283A] font-medium">
                    {new Date(selectedBooking.checkInDate).toLocaleDateString()} ({selectedBooking.checkInTime})
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-semibold">Expected Check-Out</span>
                  <span className="text-[#59283A] font-medium">
                    {new Date(selectedBooking.expectedCheckOutDate).toLocaleDateString()} ({selectedBooking.expectedCheckOutTime})
                  </span>
                </div>
              </div>

              {/* Payments breakdown */}
              <div className="p-3 bg-[#F5F0EA] rounded-xl space-y-2">
                <span className="text-xs font-bold text-[#59283A] uppercase tracking-wider block">Financial Summary</span>
                <div className="flex justify-between text-[#82747A]">
                  <span>Room Charges ({selectedBooking.numberOfNights} Nights):</span>
                  <span className="font-mono font-semibold text-[#59283A]">
                    ₹{(selectedBooking.numberOfNights * Number(selectedBooking.roomRatePerNight)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[#82747A]">
                  <span>Advance Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    ₹{Number(selectedBooking.advanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  {selectedBooking.notes}
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-[#E8DDD8] flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  {selectedBooking.bookingStatus === "RESERVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(selectedBooking)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <DoorOpen className="w-4 h-4" /> Process Check-In
                    </Button>
                  )}
                  {selectedBooking.bookingStatus === "CHECKED_IN" && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(selectedBooking)}
                      className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <LogOut className="w-4 h-4" /> Process Check-Out
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE BOOKING CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F8E8E5] flex items-center justify-center text-[#B54C44] mx-auto mb-1 border border-[#B54C44]/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-serif text-lg font-bold text-[#59283A]">
              Delete Reservation Record?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[#82747A]">
              Are you sure you want to delete reservation{" "}
              <strong className="text-[#59283A]">{bookingToDelete?.bookingNumber}</strong> for{" "}
              <strong className="text-[#59283A]">{bookingToDelete?.primaryGuest?.fullName || "Guest"}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This booking&apos;s complete details, guest dossier, payment records, dates, and stay notes will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Database Removal:</strong> The reservation will be removed from your active reservations list, and the assigned room will be automatically released back to <strong>AVAILABLE</strong> if currently checked in.
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
                setBookingToDelete(null);
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
              className="text-xs h-9 px-4 font-semibold bg-[#B54C44] hover:bg-[#923832] text-white flex items-center justify-center gap-1.5 min-w-[140px] rounded-lg transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Yes, Delete Booking</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH BOOKING HISTORY & ARCHIVE MODAL                                */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Reservation Activity &amp; Records</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Booking History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month reservations, guest check-ins, advance receipts, and deleted or cancelled bookings.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Reservations</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <CalendarDays className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active Bookings</div>
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
                <LoadingSpinner size="md" text="Loading booking history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No reservation or deletion activity found for {historyData?.monthName || "this month"}.
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
                        {item.isDeleted ? <Trash2 className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
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
                            Dates: <strong>{new Date(item.checkInDate).toLocaleDateString("en-IN")}</strong> to <strong>{new Date(item.expectedCheckOutDate).toLocaleDateString("en-IN")}</strong> ({item.numberOfNights} Nights)
                          </span>
                          <span>•</span>
                          <span>
                            Rate: <strong>₹{Number(item.roomRatePerNight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}/night</strong>
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
                          setSelectedBooking(item);
                          setDetailsModalOpen(true);
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
              Showing {filteredHistoryItems.length} of {historyData?.totalCount || 0} booking records for {historyData?.monthName || "selected month"}.
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
