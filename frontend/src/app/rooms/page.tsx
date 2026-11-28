"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Clock,
  DoorOpen,
  Edit2,
  Layers,
  Sparkles,
  Calendar,
  Eye,
  Users,
  Trash2,
  LayoutGrid,
  List,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Check,
  X,
  FileText,
  Download,
  History,
  FileSpreadsheet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Archive,
  Loader2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { roomsService } from "@/services/rooms.service";
import { Room, RoomType } from "@/types";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState<"rooms" | "types">("rooms");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [floorFilter, setFloorFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Check Room Availability date-range explorer
  const [availabilityExplorerOpen, setAvailabilityExplorerOpen] = useState(false);
  const [availCheckIn, setAvailCheckIn] = useState("");
  const [availCheckOut, setAvailCheckOut] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableRoomsResult, setAvailableRoomsResult] = useState<Room[] | null>(null);

  // Add / Edit Room modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    roomTypeId: "",
    floor: 1,
    pricePerNight: 2000,
    description: "",
    roomStatus: "AVAILABLE" as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE",
  });

  // Quick Price Update modal
  const [quickPriceModalOpen, setQuickPriceModalOpen] = useState(false);
  const [priceRoom, setPriceRoom] = useState<Room | null>(null);
  const [newPrice, setNewPrice] = useState<number>(2000);

  // Room Dossier / View Details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);

  // Room Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    defaultPricePerNight: 2000,
    capacity: 2,
  });

  const [submitting, setSubmitting] = useState(false);

  // Delete Room modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Full Month Room History & Archive state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<{
    month: number;
    year: number;
    monthName: string;
    totalCount: number;
    activeCount: number;
    deletedCount: number;
    items: any[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [historySearch, setHistorySearch] = useState("");

  // Excel Export state
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, tRes] = await Promise.all([
        roomsService.findAll({
          status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
          roomTypeId: typeFilter !== "ALL" ? typeFilter : undefined,
          floor: floorFilter !== "ALL" ? Number(floorFilter) : undefined,
          search: search || undefined,
          limit: 100,
        }),
        roomsService.findAllTypes(),
      ]);
      setRooms(rRes.items);
      setRoomTypes(tRes);
    } catch (err) {
      toast.error("Failed to load room inventory from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, floorFilter, search]);

  const handleConfirmDelete = (r: Room) => {
    if (r.roomStatus === "OCCUPIED") {
      toast.error(`Cannot delete Room ${r.roomNumber}: Currently occupied by an in-house guest. Complete checkout or reassign stay first.`);
      return;
    }
    setRoomToDelete(r);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!roomToDelete) return;
    try {
      setIsDeleting(true);
      await roomsService.remove(roomToDelete.id);
      toast.success(
        `Room ${roomToDelete.roomNumber} (${roomToDelete.roomType?.name || "Room"}) removed from active inventory. Complete dossier archived in history.`
      );
      setDeleteModalOpen(false);
      setRoomToDelete(null);
      fetchData();
      if (historyModalOpen) {
        fetchHistory(historyMonth, historyYear);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete room");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHistory = async (month: number, year: number) => {
    try {
      setHistoryLoading(true);
      const data = await roomsService.getHistory({ month, year });
      setHistoryData(data);
    } catch (err: any) {
      console.error("Failed to load room history:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to load room history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistoryModal = () => {
    setHistoryModalOpen(true);
    fetchHistory(historyMonth, historyYear);
  };

  const handlePrevMonth = () => {
    let newMonth = historyMonth - 1;
    let newYear = historyYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setHistoryMonth(newMonth);
    setHistoryYear(newYear);
    fetchHistory(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = historyMonth + 1;
    let newYear = historyYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setHistoryMonth(newMonth);
    setHistoryYear(newYear);
    fetchHistory(newMonth, newYear);
  };

  const handleExportExcel = async (scope: "MONTH" | "ALL") => {
    try {
      setIsExporting(true);
      toast.info("Generating Excel report for Room Inventory...");

      let exportItems: any[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await roomsService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const allRes = await roomsService.findAll({ limit: 500 });
        exportItems = allRes.items || [];
        scopeTitle = "All_Active_Rooms";
      }

      if (exportItems.length === 0) {
        toast.warning("No room records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Room Inventory");

      // Title Banner
      worksheet.mergeCells("A1:M1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — ROOM INVENTORY & STATUS REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:M2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Rooms: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Room Number",
        "Category / Type",
        "Floor",
        "Max Capacity",
        "Price Per Night (₹)",
        "Room Status",
        "Active In-House Guest",
        "Guest Mobile",
        "Booking Status",
        "Description",
        "Inventory Status",
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

      exportItems.forEach((r, idx) => {
        const row = worksheet.addRow([
          idx + 1,
          `Room ${r.roomNumber}`,
          r.roomType?.name || "Standard Room",
          `Floor ${r.floor}`,
          `${r.roomType?.capacity || 2} Pax`,
          Number(r.pricePerNight || 0),
          r.roomStatus || "AVAILABLE",
          r.currentBooking?.primaryGuest?.fullName || "—",
          r.currentBooking?.primaryGuest?.mobileNumber || "—",
          r.currentBooking?.bookingStatus || "—",
          r.description || r.roomType?.description || "—",
          r.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE INVENTORY",
          r.deletedAt ? new Date(r.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = r.isDeleted;

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

          if (colNum === 1 || colNum === 2 || colNum === 4 || colNum === 5 || colNum === 7 || colNum === 12 || colNum === 13) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum === 6) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
            cell.numFmt = "₹#,##0.00";
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 7 },
        { width: 16 },
        { width: 24 },
        { width: 12 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 32 },
        { width: 22 },
        { width: 22 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hotel_Radha_Palace_Rooms_${scopeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully (${exportItems.length} rooms)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to generate room Excel report");
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
      item.roomNumber?.toLowerCase().includes(q) ||
      item.roomType?.name?.toLowerCase().includes(q) ||
      String(item.floor).includes(q)
    );
  });

  // Availability statistics
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.roomStatus === "AVAILABLE").length;
  const occupiedRoomsCount = rooms.filter((r) => r.roomStatus === "OCCUPIED").length;
  const maintenanceRoomsCount = rooms.filter((r) => r.roomStatus === "MAINTENANCE").length;
  const occupancyPercentage =
    totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

  // Floors list
  const uniqueFloors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  // Check Availability for date range
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availCheckIn || !availCheckOut) {
      toast.error("Please select both Check-in and Check-out dates");
      return;
    }
    if (new Date(availCheckIn) >= new Date(availCheckOut)) {
      toast.error("Check-out date must be after Check-in date");
      return;
    }

    try {
      setCheckingAvailability(true);
      const res = await roomsService.findAvailable({
        checkIn: availCheckIn,
        checkOut: availCheckOut,
        roomTypeId: typeFilter !== "ALL" ? typeFilter : undefined,
      });
      setAvailableRoomsResult(res);
      toast.success(`Found ${res.length} available room(s) for selected dates`);
    } catch (err) {
      toast.error("Failed to calculate room availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleClearAvailabilityFilter = () => {
    setAvailableRoomsResult(null);
    setAvailCheckIn("");
    setAvailCheckOut("");
    setAvailabilityExplorerOpen(false);
  };

  // Add / Edit Room
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      roomNumber: "",
      roomTypeId: roomTypes[0]?.id || "",
      floor: 1,
      pricePerNight: roomTypes[0]?.defaultPricePerNight
        ? Number(roomTypes[0].defaultPricePerNight)
        : 2000,
      description: "",
      roomStatus: "AVAILABLE",
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomForm({
      roomNumber: r.roomNumber,
      roomTypeId: r.roomTypeId,
      floor: r.floor,
      pricePerNight: Number(r.pricePerNight),
      description: r.description || "",
      roomStatus: r.roomStatus,
    });
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.roomNumber.trim()) {
      toast.error("Room Number is required");
      return;
    }
    if (!roomForm.roomTypeId) {
      toast.error("Please select a Room Type");
      return;
    }

    try {
      setSubmitting(true);
      if (editingRoom) {
        await roomsService.update(editingRoom.id, {
          ...roomForm,
          pricePerNight: Number(roomForm.pricePerNight),
          floor: Number(roomForm.floor),
        });
        toast.success(`Room ${roomForm.roomNumber} updated successfully`);
      } else {
        await roomsService.create({
          ...roomForm,
          pricePerNight: Number(roomForm.pricePerNight),
          floor: Number(roomForm.floor),
        });
        toast.success(`Room ${roomForm.roomNumber} added to inventory`);
      }
      setRoomModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving room details");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Price Update
  const handleOpenQuickPrice = (r: Room) => {
    setPriceRoom(r);
    setNewPrice(Number(r.pricePerNight));
    setQuickPriceModalOpen(true);
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceRoom) return;

    if (newPrice < 0 || isNaN(newPrice)) {
      toast.error("Please enter a valid price per night");
      return;
    }

    try {
      setSubmitting(true);
      await roomsService.updatePrice(priceRoom.id, Number(newPrice));
      toast.success(
        `Room ${priceRoom.roomNumber} price updated to ₹${Number(newPrice).toLocaleString("en-IN")}`
      );
      setQuickPriceModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update price");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = async (
    room: Room,
    newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
  ) => {
    try {
      await roomsService.updateStatus(room.id, newStatus);
      const statusLabel =
        newStatus === "AVAILABLE"
          ? "Available"
          : newStatus === "MAINTENANCE"
          ? "Under Maintenance"
          : "Occupied";
      toast.success(`Room ${room.roomNumber} is now ${statusLabel}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot change room status");
    }
  };

  // Room Dossier / View Details
  const handleOpenDetails = async (roomId: string) => {
    try {
      const r = await roomsService.findOne(roomId);
      setSelectedRoomDetails(r);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error("Could not load full room details");
    }
  };

  // Deactivate Room
  const handleDeactivateRoom = async (room: Room) => {
    if (room.roomStatus === "OCCUPIED") {
      toast.error(`Cannot deactivate Room ${room.roomNumber} because it is currently occupied`);
      return;
    }
    if (!confirm(`Are you sure you want to deactivate Room ${room.roomNumber}?`)) return;

    try {
      await roomsService.remove(room.id);
      toast.success(`Room ${room.roomNumber} deactivated`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot deactivate room");
    }
  };

  // Room Type CRUD
  const handleOpenAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: "",
      description: "",
      defaultPricePerNight: 2500,
      capacity: 2,
    });
    setTypeModalOpen(true);
  };

  const handleOpenEditType = (t: RoomType) => {
    setEditingType(t);
    setTypeForm({
      name: t.name,
      description: t.description || "",
      defaultPricePerNight: Number(t.defaultPricePerNight),
      capacity: t.capacity,
    });
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error("Room type name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingType) {
        await roomsService.updateType(editingType.id, {
          ...typeForm,
          defaultPricePerNight: Number(typeForm.defaultPricePerNight),
          capacity: Number(typeForm.capacity),
        });
        toast.success(`Room type "${typeForm.name}" updated`);
      } else {
        await roomsService.createType({
          ...typeForm,
          defaultPricePerNight: Number(typeForm.defaultPricePerNight),
          capacity: Number(typeForm.capacity),
        });
        toast.success(`Room type "${typeForm.name}" created`);
      }
      setTypeModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving room type");
    } finally {
      setSubmitting(false);
    }
  };

  // Display rooms (either available search result or full list)
  const displayRooms = availableRoomsResult !== null ? availableRoomsResult : rooms;

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto pb-12">
      {/* Editorial Luxury Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#C4A06A] uppercase bg-[#F5F0EA] px-2.5 py-0.5 rounded-full">
              Hospitality Operations • Room Management
            </span>
            <span className="text-[11px] text-[#82747A]">• Live Inventory & Availability</span>
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-[#59283A] mt-1">
            Room Inventory & Status Control
          </h2>
          <p className="text-xs text-[#82747A] mt-1 max-w-2xl">
            Maintain complete hotel room details: room numbers, room types, descriptions, nightly prices, live room statuses (Available, Occupied, Under Maintenance), and check room availability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onClick={() => setAvailabilityExplorerOpen(!availabilityExplorerOpen)}
            className="border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5 text-xs h-9"
          >
            <Calendar className="w-4 h-4 text-[#C4A06A]" />
            <span>Check Room Availability</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleOpenHistoryModal}
            className="border-[#59283A]/30 text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5 text-xs h-9 shadow-sm"
          >
            <History className="w-4 h-4 text-[#C4A06A]" />
            <span>Room History</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExportExcel("ALL")}
            disabled={isExporting}
            className="border-[#32765B]/40 text-[#32765B] hover:bg-[#E7F1E9] flex items-center gap-1.5 text-xs h-9 shadow-sm font-medium"
          >
            <Download className="w-4 h-4 text-[#32765B]" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </Button>

          {activeTab === "rooms" ? (
            <Button
              onClick={handleOpenAddRoom}
              className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-2 shadow-sm font-medium px-4 h-9"
            >
              <Plus className="w-4 h-4 text-[#C4A06A]" />
              <span>Add Room</span>
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddType}
              className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-2 shadow-sm font-medium px-4 h-9"
            >
              <Plus className="w-4 h-4 text-[#C4A06A]" />
              <span>Add Room Type</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Room Availability & Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Total Rooms */}
        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[#59283A]">
              <BedDouble className="w-5 h-5 text-[#C4A06A]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Total Rooms</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{totalRoomsCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card
          onClick={() => setStatusFilter("AVAILABLE")}
          className="bg-white border-[#E8DDD8] shadow-sm cursor-pointer hover:border-[#32765B] transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1E9] flex items-center justify-center text-[#32765B]">
              <CheckCircle2 className="w-5 h-5 text-[#32765B]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#32765B] tracking-wider flex items-center gap-1">
                <span>Available</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#32765B] animate-pulse" />
              </p>
              <h3 className="text-xl font-serif font-bold text-[#32765B]">{availableRoomsCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Occupied Rooms */}
        <Card
          onClick={() => setStatusFilter("OCCUPIED")}
          className="bg-white border-[#E8DDD8] shadow-sm cursor-pointer hover:border-rose-400 transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <UserCheck className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider flex items-center gap-1">
                <span>Occupied</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </p>
              <h3 className="text-xl font-serif font-bold text-rose-700">{occupiedRoomsCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Under Maintenance */}
        <Card
          onClick={() => setStatusFilter("MAINTENANCE")}
          className="bg-white border-[#E8DDD8] shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider flex items-center gap-1">
                <span>Under Maintenance</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </p>
              <h3 className="text-xl font-serif font-bold text-amber-700">{maintenanceRoomsCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="bg-white border-[#E8DDD8] shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[#59283A]">
              <DoorOpen className="w-5 h-5 text-[#C4A06A]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Live Occupancy</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{occupancyPercentage}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Room Availability Explorer Panel */}
      {availabilityExplorerOpen && (
        <Card className="bg-[#F5F0EA] border-[#C4A06A] shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C4A06A]" />
                <h4 className="text-sm font-bold text-[#59283A]">
                  Check Room Availability for Stay Dates
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAvailabilityFilter}
                className="h-7 text-xs text-[#82747A] hover:text-[#59283A]"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Close Explorer
              </Button>
            </div>

            <form
              onSubmit={handleCheckAvailability}
              className="flex flex-wrap items-end gap-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Check-In Date *</label>
                <Input
                  type="date"
                  required
                  value={availCheckIn}
                  onChange={(e) => setAvailCheckIn(e.target.value)}
                  className="h-8 text-xs bg-white border-[#E8DDD8] w-40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Check-Out Date *</label>
                <Input
                  type="date"
                  required
                  value={availCheckOut}
                  onChange={(e) => setAvailCheckOut(e.target.value)}
                  className="h-8 text-xs bg-white border-[#E8DDD8] w-40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Room Type (Optional)</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A] w-44"
                >
                  <option value="ALL">All Categories</option>
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                disabled={checkingAvailability}
                size="sm"
                className="h-8 text-xs bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
              >
                {checkingAvailability ? (
                  <LoadingSpinner className="w-3.5 h-3.5" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-[#C4A06A]" />
                )}
                <span>Check Availability</span>
              </Button>

              {availableRoomsResult !== null && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAvailabilityFilter}
                  className="h-8 text-xs border-[#E8DDD8] text-[#82747A]"
                >
                  Reset Filter
                </Button>
              )}
            </form>

            {availableRoomsResult !== null && (
              <div className="p-2.5 bg-[#E7F1E9] border border-[#32765B]/30 rounded-lg text-xs text-[#32765B] flex items-center justify-between">
                <span>
                  Showing <strong>{availableRoomsResult.length}</strong> available room(s) between{" "}
                  <strong>{new Date(availCheckIn).toLocaleDateString("en-IN")}</strong> and{" "}
                  <strong>{new Date(availCheckOut).toLocaleDateString("en-IN")}</strong>.
                </span>
                <span className="font-semibold text-[11px] uppercase tracking-wide">
                  Verified Unbooked Inventory
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs & View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#E8DDD8] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "rooms"
                ? "bg-[#59283A] text-white shadow-sm"
                : "text-[#82747A] hover:bg-[#F5F0EA]"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Rooms Directory ({rooms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "types"
                ? "bg-[#59283A] text-white shadow-sm"
                : "text-[#82747A] hover:bg-[#F5F0EA]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Room Categories & Pricing ({roomTypes.length})</span>
          </button>
        </div>

        {activeTab === "rooms" && (
          <div className="flex items-center gap-1.5 bg-[#F5F0EA] p-1 rounded-lg border border-[#E8DDD8]">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2.5 text-xs ${
                viewMode === "grid"
                  ? "bg-[#59283A] text-white hover:bg-[#472130]"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />
              <span>Grid View</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7 px-2.5 text-xs ${
                viewMode === "table"
                  ? "bg-[#59283A] text-white hover:bg-[#472130]"
                  : "text-[#82747A] hover:text-[#59283A]"
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1" />
              <span>Table View</span>
            </Button>
          </div>
        )}
      </div>

      {/* ROOMS DIRECTORY */}
      {activeTab === "rooms" && (
        <>
          {/* Filters & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#82747A] mr-1">Status:</span>
              {[
                { key: "ALL", label: "All Rooms" },
                { key: "AVAILABLE", label: "Available" },
                { key: "OCCUPIED", label: "Occupied" },
                { key: "MAINTENANCE", label: "Under Maintenance" },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === st.key
                      ? "bg-[#59283A] text-white shadow-sm"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Floor Filter */}
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="h-8 text-xs border border-[#E8DDD8] rounded-lg px-2 bg-[#F5F0EA] text-[#59283A]"
              >
                <option value="ALL">All Floors</option>
                {uniqueFloors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>

              {/* Room Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 text-xs border border-[#E8DDD8] rounded-lg px-2 bg-[#F5F0EA] text-[#59283A]"
              >
                <option value="ALL">All Categories</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search room number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-[#F5F0EA] border-[#E8DDD8]"
                />
              </div>
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <>
              {loading ? (
                <div className="p-16 flex flex-col justify-center items-center gap-3 bg-white rounded-xl border border-[#E8DDD8]">
                  <LoadingSpinner text="Loading Room Inventory & Floors..." subtext="Retrieving room statuses, pricing tiers, and occupancy..." />
                  <p className="text-xs text-[#82747A]">Loading room inventory from database...</p>
                </div>
              ) : displayRooms.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A] bg-white rounded-xl border border-[#E8DDD8] space-y-3">
                  <BedDouble className="w-10 h-10 text-[#C4A06A] mx-auto opacity-60" />
                  <p className="font-medium text-[#59283A]">
                    No rooms found matching your active filter criteria.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddRoom}
                    className="border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Add New Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-8 gap-2.5">
                  {displayRooms.map((r) => {
                    const isAvailable = r.roomStatus === "AVAILABLE";
                    const isOccupied = r.roomStatus === "OCCUPIED";
                    const isMaintenance = r.roomStatus === "MAINTENANCE";

                    return (
                      <Card
                        key={r.id}
                        className={`border bg-white transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between rounded-xl ${
                          isAvailable
                            ? "border-emerald-200/90 hover:border-emerald-500 hover:shadow-emerald-500/10"
                            : isOccupied
                            ? "border-rose-200/90 hover:border-rose-500 hover:shadow-rose-500/10"
                            : "border-amber-200/90 hover:border-amber-500 hover:shadow-amber-500/10"
                        }`}
                      >
                        {/* Top Status Accent Bar */}
                        <div
                          className={`h-1 w-full ${
                            isAvailable
                              ? "bg-emerald-500"
                              : isOccupied
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />

                        <CardContent className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            {/* Room Header: Number & Floor in full */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm sm:text-base font-serif font-bold text-[#59283A] whitespace-nowrap leading-tight">
                                Room {r.roomNumber}
                              </span>
                              <span className="text-[10px] font-mono text-[#82747A] whitespace-nowrap">
                                Fl {r.floor} • Cap: {r.roomType?.capacity || 2}
                              </span>
                            </div>

                            {/* Live Status Badge with Blinker - Full Dedicated Row */}
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 flex items-center justify-center gap-1.5 w-full shadow-xs ${
                                isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : isOccupied
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {/* Blinker Indicator Dot */}
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span
                                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    isAvailable
                                      ? "bg-emerald-400"
                                      : isOccupied
                                      ? "bg-rose-400"
                                      : "bg-amber-400"
                                  }`}
                                />
                                <span
                                  className={`relative inline-flex rounded-full h-2 w-2 ${
                                    isAvailable
                                      ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                                      : isOccupied
                                      ? "bg-rose-500 shadow-[0_0_6px_#F43F5E]"
                                      : "bg-amber-500 shadow-[0_0_6px_#F59E0B]"
                                  }`}
                                />
                              </span>
                              <span className="whitespace-nowrap">
                                {isAvailable
                                  ? "Available"
                                  : isOccupied
                                  ? "Occupied"
                                  : "Maintenance"}
                              </span>
                            </Badge>

                            {/* Room Category & Description */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[#8E7079] uppercase font-semibold text-[9px]">
                                  Type:
                                </span>
                                <span
                                  className="font-semibold text-[#59283A] text-[10px] truncate max-w-[95px]"
                                  title={r.roomType?.name}
                                >
                                  {r.roomType?.name}
                                </span>
                              </div>

                              {/* Room Description (Compact single line with tooltip) */}
                              <div
                                className="text-[10px] text-[#82747A] bg-[#F5F0EA]/70 px-1.5 py-0.5 rounded border border-[#E8DDD8]/60 truncate"
                                title={r.description || r.roomType?.description || "Comfortable guest room"}
                              >
                                {r.description || (
                                  <span className="italic text-[#8E7079]">
                                    {r.roomType?.description || "Comfortable room"}
                                  </span>
                                )}
                              </div>

                              {/* Price Per Night with Quick Update */}
                              <div className="flex justify-between items-center pt-0.5">
                                <span className="text-[#8E7079] text-[9px] uppercase font-semibold">
                                  Rate:
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-xs text-[#59283A]">
                                    ₹{Number(r.pricePerNight).toLocaleString("en-IN")}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenQuickPrice(r)}
                                    className="text-[#C4A06A] hover:text-[#59283A] p-0.5 rounded hover:bg-[#F5F0EA]"
                                    title="Update Price"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Active Occupant Details if Occupied */}
                              {r.currentBooking && (
                                <div className="p-1.5 bg-rose-50/80 rounded border border-rose-200/70 text-[10px] text-[#59283A] space-y-0.5">
                                  <div className="flex items-center justify-between font-semibold truncate">
                                    <span className="truncate text-[10px]">
                                      {r.currentBooking.primaryGuest?.fullName}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-[#82747A] font-mono truncate">
                                    {r.currentBooking.primaryGuest?.mobileNumber}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Footer: Compact mini buttons with tooltips */}
                          <div className="pt-1.5 border-t border-[#E8DDD8] flex items-center justify-between gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(r.id)}
                              className="h-6 w-6 p-0 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA] border-[#E8DDD8] rounded"
                              title="View Room Dossier"
                            >
                              <Eye className="w-3 h-3 text-[#C4A06A]" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRoom(r)}
                              className="h-6 w-6 p-0 text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8] rounded"
                              title="Edit Room Details"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>

                            {/* Quick Status Toggle Button */}
                            {!isOccupied && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuickStatusChange(
                                    r,
                                    isAvailable ? "MAINTENANCE" : "AVAILABLE"
                                  )
                                }
                                title={
                                  isAvailable
                                    ? "Mark as Under Maintenance"
                                    : "Mark as Available"
                                }
                                className={`h-6 w-6 p-0 border-[#E8DDD8] rounded ${
                                  isAvailable
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {isAvailable ? (
                                  <Wrench className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                )}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirmDelete(r)}
                              disabled={isOccupied}
                              title={isOccupied ? "Cannot delete occupied room" : "Delete Room from Inventory"}
                              className="h-6 w-6 p-0 text-[#8E7079] hover:text-[#B54C44] hover:bg-rose-50 disabled:opacity-30 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-[#B54C44]" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-16 flex flex-col justify-center items-center gap-3">
                    <LoadingSpinner text="Loading Room Inventory & Floors..." subtext="Retrieving room statuses, pricing tiers, and occupancy..." />
                    <p className="text-xs text-[#82747A]">Loading room inventory...</p>
                  </div>
                ) : displayRooms.length === 0 ? (
                  <div className="p-16 text-center text-xs text-[#82747A]">
                    No rooms matching your active filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                        <tr>
                          <th className="px-4 py-3.5">Room Number</th>
                          <th className="px-4 py-3.5">Room Type</th>
                          <th className="px-4 py-3.5">Room Description</th>
                          <th className="px-4 py-3.5">Floor</th>
                          <th className="px-4 py-3.5">Price Per Night</th>
                          <th className="px-4 py-3.5">Room Status</th>
                          <th className="px-4 py-3.5">Current Occupant</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DDD8]">
                        {displayRooms.map((r) => {
                          const isAvailable = r.roomStatus === "AVAILABLE";
                          const isOccupied = r.roomStatus === "OCCUPIED";
                          const isMaintenance = r.roomStatus === "MAINTENANCE";

                          return (
                            <tr key={r.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                              {/* Room Number */}
                              <td className="px-4 py-3.5 font-serif font-bold text-sm text-[#59283A]">
                                Room {r.roomNumber}
                              </td>

                              {/* Room Type */}
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-[#59283A] block">
                                  {r.roomType?.name}
                                </span>
                                <span className="text-[11px] text-[#82747A]">
                                  Capacity: {r.roomType?.capacity || 2} Guests
                                </span>
                              </td>

                              {/* Room Description */}
                              <td className="px-4 py-3.5 text-[#82747A] max-w-xs">
                                <span className="truncate block" title={r.description || ""}>
                                  {r.description || (
                                    <span className="italic text-[#8E7079]">
                                      {r.roomType?.description || "Standard boutique amenities"}
                                    </span>
                                  )}
                                </span>
                              </td>

                              {/* Floor */}
                              <td className="px-4 py-3.5 font-mono text-[#59283A]">
                                Floor {r.floor}
                              </td>

                              {/* Price Per Night */}
                              <td className="px-4 py-3.5 font-mono font-bold text-[#59283A]">
                                <div className="flex items-center gap-1.5">
                                  <span>
                                    ₹{Number(r.pricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenQuickPrice(r)}
                                    className="text-[#C4A06A] hover:text-[#59283A]"
                                    title="Quick Price Update"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Room Status */}
                              <td className="px-4 py-3.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                    isAvailable
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : isOccupied
                                      ? "bg-rose-50 text-rose-700 border-rose-300"
                                      : "bg-amber-50 text-amber-700 border-amber-300"
                                  }`}
                                >
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span
                                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        isAvailable
                                          ? "bg-emerald-400"
                                          : isOccupied
                                          ? "bg-rose-400"
                                          : "bg-amber-400"
                                      }`}
                                    />
                                    <span
                                      className={`relative inline-flex rounded-full h-2 w-2 ${
                                        isAvailable
                                          ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                                          : isOccupied
                                          ? "bg-rose-500 shadow-[0_0_6px_#F43F5E]"
                                          : "bg-amber-500 shadow-[0_0_6px_#F59E0B]"
                                      }`}
                                    />
                                  </span>
                                  <span>
                                    {isAvailable
                                      ? "Available"
                                      : isOccupied
                                      ? "Occupied"
                                      : "Under Maintenance"}
                                  </span>
                                </Badge>
                              </td>

                              {/* Current Occupant */}
                              <td className="px-4 py-3.5 text-[#82747A]">
                                {r.currentBooking ? (
                                  <div>
                                    <span className="font-semibold text-[#59283A] block">
                                      {r.currentBooking.primaryGuest?.fullName}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#8E7079]">
                                      {r.currentBooking.primaryGuest?.mobileNumber}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#8E7079] italic">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDetails(r.id)}
                                  className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                                  Dossier
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditRoom(r)}
                                  className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                                  title="Edit Room"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>

                                {!isOccupied && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleQuickStatusChange(
                                        r,
                                        isAvailable ? "MAINTENANCE" : "AVAILABLE"
                                      )
                                    }
                                    className={`h-7 px-2 ${
                                      isAvailable
                                        ? "text-[#A97832] hover:bg-[#F6EDDC]"
                                        : "text-[#32765B] hover:bg-[#E7F1E9]"
                                    }`}
                                  >
                                    {isAvailable ? "Maintain" : "Ready"}
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConfirmDelete(r)}
                                  disabled={isOccupied}
                                  className="h-7 px-2 text-[#8E7079] hover:text-[#B54C44] hover:bg-[#F8E8E5] disabled:opacity-40"
                                  title={isOccupied ? "Cannot delete occupied room" : "Delete Room"}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1 text-[#B54C44]" />
                                  <span>Delete</span>
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
          )}
        </>
      )}

      {/* ROOM CATEGORIES & PRICING TAB */}
      {activeTab === "types" && (
        <Card className="border-[#E8DDD8] shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-[#E8DDD8] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-serif font-bold text-[#59283A]">
                  Room Types & Pricing Rules
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  Define base nightly rates and default guest capacities across categories.
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenAddType}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Add Room Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                <tr>
                  <th className="px-4 py-3.5">Category Name</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Guest Capacity</th>
                  <th className="px-4 py-3.5">Default Nightly Rate</th>
                  <th className="px-4 py-3.5">Assigned Rooms</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD8]">
                {roomTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F5F0EA]/70 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-[#59283A]">
                      {t.name}
                    </td>
                    <td className="px-4 py-3.5 text-[#82747A] max-w-sm">
                      {t.description || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[#82747A] font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#C4A06A]" />
                        {t.capacity} Guests
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[#59283A]">
                      ₹{Number(t.defaultPricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] text-[#59283A]">
                        {t._count?.rooms || 0} Rooms
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditType(t)}
                        className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT ROOM MODAL (WITH ROOM NUMBER, TYPE, DESCRIPTION, PRICE, STATUS)  */}
      {/* ========================================================================= */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#C4A06A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              {editingRoom ? "Inventory Update" : "New Inventory Item"}
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : "Add New Room"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Configure room number, room type, description, price per night, and status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRoom} className="space-y-3.5 pt-2 text-xs">
            {/* 1. Room Number */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Room Number *</label>
              <Input
                required
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                placeholder="e.g. 101, 204, or PH-1"
                className="h-8 text-xs font-mono border-[#E8DDD8]"
              />
            </div>

            {/* 2. Room Type */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Room Type / Category *</label>
              <select
                required
                value={roomForm.roomTypeId}
                onChange={(e) => {
                  const sel = roomTypes.find((t) => t.id === e.target.value);
                  setRoomForm({
                    ...roomForm,
                    roomTypeId: e.target.value,
                    pricePerNight: sel ? Number(sel.defaultPricePerNight) : roomForm.pricePerNight,
                  });
                }}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Cap: {t.capacity}, Default: ₹{t.defaultPricePerNight})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Room Description */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Room Description</label>
              <textarea
                rows={2}
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                placeholder="Corner room with king bed, balcony, garden view, premium minibar..."
                className="w-full text-xs border border-[#E8DDD8] rounded-md p-2 bg-white text-[#59283A] focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              />
            </div>

            {/* 4. Floor & Price Per Night */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Floor</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Price Per Night (₹) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={roomForm.pricePerNight}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* 5. Room Status */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Room Status *</label>
              <select
                value={roomForm.roomStatus}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomStatus: e.target.value as any })
                }
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Under Maintenance</option>
                {editingRoom && <option value="OCCUPIED">Occupied</option>}
              </select>
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoomModalOpen(false)}
                className="text-xs border-[#E8DDD8]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs"
              >
                {submitting ? "Saving..." : editingRoom ? "Save Room Details" : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* QUICK PRICE UPDATE MODAL                                                  */}
      {/* ========================================================================= */}
      <Dialog open={quickPriceModalOpen} onOpenChange={setQuickPriceModalOpen}>
        <DialogContent className="max-w-sm bg-white border-[#E8DDD8] shadow-2xl p-5">
          <DialogHeader className="border-b border-[#E8DDD8] pb-2.5">
            <DialogTitle className="text-base font-serif font-bold text-[#59283A]">
              Update Nightly Rate • Room {priceRoom?.roomNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Category: {priceRoom?.roomType?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuickPrice} className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-[#F5F0EA] rounded-lg border border-[#E8DDD8] flex justify-between items-center">
              <span className="text-[#82747A]">Current Rate:</span>
              <span className="font-mono font-bold text-[#59283A]">
                ₹{Number(priceRoom?.pricePerNight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">New Nightly Price (₹) *</label>
              <Input
                type="number"
                required
                min="0"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="h-9 text-sm font-mono border-[#E8DDD8]"
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickPriceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white"
              >
                {submitting ? "Updating..." : "Save New Price"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ROOM DOSSIER / VIEW DETAILS MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-xl bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C4A06A] bg-[#F5F0EA] px-2 py-0.5 rounded">
                  Floor {selectedRoomDetails?.floor}
                </span>
                <DialogTitle className="text-2xl font-serif font-bold text-[#59283A] mt-1">
                  Room {selectedRoomDetails?.roomNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  {selectedRoomDetails?.roomType?.name} • Detailed Room Dossier
                </DialogDescription>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  selectedRoomDetails?.roomStatus === "AVAILABLE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : selectedRoomDetails?.roomStatus === "OCCUPIED"
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                }`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      selectedRoomDetails?.roomStatus === "AVAILABLE"
                        ? "bg-emerald-400"
                        : selectedRoomDetails?.roomStatus === "OCCUPIED"
                        ? "bg-rose-400"
                        : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      selectedRoomDetails?.roomStatus === "AVAILABLE"
                        ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                        : selectedRoomDetails?.roomStatus === "OCCUPIED"
                        ? "bg-rose-500 shadow-[0_0_6px_#F43F5E]"
                        : "bg-amber-500 shadow-[0_0_6px_#F59E0B]"
                    }`}
                  />
                </span>
                <span>
                  {selectedRoomDetails?.roomStatus === "AVAILABLE"
                    ? "Available"
                    : selectedRoomDetails?.roomStatus === "OCCUPIED"
                    ? "Occupied"
                    : "Under Maintenance"}
                </span>
              </Badge>
            </div>
          </DialogHeader>

          {selectedRoomDetails && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                    Room Type
                  </span>
                  <span className="font-semibold text-[#59283A]">
                    {selectedRoomDetails.roomType?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                    Guest Capacity
                  </span>
                  <span className="font-medium text-[#59283A]">
                    {selectedRoomDetails.roomType?.capacity || 2} Persons
                  </span>
                </div>
                <div>
                  <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                    Nightly Rate
                  </span>
                  <span className="font-mono font-bold text-[#59283A]">
                    ₹{Number(selectedRoomDetails.pricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DDD8] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider block">
                  Room Description & Amenities
                </span>
                <p className="text-xs text-[#59283A]">
                  {selectedRoomDetails.description || (
                    <span className="italic text-[#8E7079]">
                      {selectedRoomDetails.roomType?.description || "No custom room description recorded."}
                    </span>
                  )}
                </p>
              </div>

              {/* Current Occupant Details (if Occupied) */}
              {selectedRoomDetails.roomStatus === "OCCUPIED" && (
                <div className="p-3.5 bg-[#E9EFF3] rounded-xl border border-[#627D91]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#59283A] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#627D91]" />
                      <span>Current Occupant Information</span>
                    </span>
                  </div>
                  {((selectedRoomDetails.bookings && selectedRoomDetails.bookings[0]) || selectedRoomDetails.currentBooking) ? (
                    (() => {
                      const activeBooking =
                        (selectedRoomDetails.bookings && selectedRoomDetails.bookings[0]) ||
                        selectedRoomDetails.currentBooking;
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div>
                            <span className="text-[#82747A] block text-[10px]">Guest Name:</span>
                            <span className="font-semibold text-[#59283A]">
                              {activeBooking.primaryGuest?.fullName || "Primary Guest"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#82747A] block text-[10px]">Contact Mobile:</span>
                            <span className="font-mono text-[#59283A]">
                              {activeBooking.primaryGuest?.mobileNumber || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#82747A] block text-[10px]">Check-In Date:</span>
                            <span className="text-[#59283A]">
                              {activeBooking.checkInDate
                                ? new Date(activeBooking.checkInDate).toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#82747A] block text-[10px]">Expected Check-Out:</span>
                            <span className="text-[#59283A]">
                              {activeBooking.expectedCheckOutDate
                                ? new Date(activeBooking.expectedCheckOutDate).toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-[#82747A]">Room is marked occupied.</p>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD8]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeactivateRoom(selectedRoomDetails)}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Deactivate Room
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleOpenEditRoom(selectedRoomDetails);
                    }}
                    className="text-xs border-[#E8DDD8]"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setDetailsModalOpen(false)}
                    className="text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ADD / EDIT ROOM TYPE MODAL                                                */}
      {/* ========================================================================= */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <DialogTitle className="text-base font-serif font-bold text-[#59283A]">
              {editingType ? `Edit Category: ${editingType.name}` : "New Room Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Configure category pricing and guest capacity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveType} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Category Name *</label>
              <Input
                required
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g. Deluxe Double Suite"
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Guest Capacity</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={typeForm.capacity}
                  onChange={(e) => setTypeForm({ ...typeForm, capacity: Number(e.target.value) })}
                  className="h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Default Nightly Rate (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={typeForm.defaultPricePerNight}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, defaultPricePerNight: Number(e.target.value) })
                  }
                  className="h-8 text-xs font-mono border-[#E8DDD8]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Description</label>
              <textarea
                rows={2}
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Category amenities, king size bed, view, etc."
                className="w-full text-xs border border-[#E8DDD8] rounded-md p-2 bg-white text-[#59283A] focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTypeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white"
              >
                {submitting ? "Saving..." : editingType ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE ROOM CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F8E8E5] text-[#B54C44] flex items-center justify-center mb-2 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A] text-center">
              Delete Room from Inventory?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] text-center">
              Are you sure you want to delete{" "}
              <strong className="text-[#59283A]">Room {roomToDelete?.roomNumber}</strong> ({roomToDelete?.roomType?.name}, Floor {roomToDelete?.floor})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This room&apos;s full specifications, category, floor tier, nightly rates, and historical stay logs will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Inventory Removal:</strong> The room will be removed from your active room inventory, live occupancy boards, and future booking calendars.
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
                setRoomToDelete(null);
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
                  <span>Yes, Delete Room</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH ROOM INVENTORY HISTORY & ARCHIVE MODAL                         */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Room Activity &amp; Records</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Room Inventory &amp; Deletion History</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review room inventory lifecycle, specifications, nightly rates, and rooms decommissioned or deleted from active operations.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Room Dossiers</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <BedDouble className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active in Inventory</div>
                  <div className="text-lg font-serif font-bold text-[#32765B]">
                    {historyData?.activeCount || 0}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#32765B]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#B54C44]">Deleted / Decommissioned</div>
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
                placeholder="Search history by room number, category, floor..."
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
                <LoadingSpinner size="md" text="Loading room history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No room inventory or deletion activity found for {historyData?.monthName || "this month"}.
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
                          <span className="font-bold text-sm text-[#59283A]">Room {item.roomNumber}</span>
                          <span className="font-mono text-[10px] bg-[#F5F0EA] text-[#82747A] px-1.5 py-0.5 rounded">
                            Floor {item.floor}
                          </span>
                          <span className="text-xs font-semibold text-[#8E7079]">
                            {item.roomType?.name || "Standard Room"}
                          </span>
                          {item.isDeleted ? (
                            <Badge className="text-[9px] bg-[#F8E8E5] text-[#B54C44] border-[#B54C44]/30">
                              Decommissioned / Deleted
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30">
                              Active Inventory
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#82747A] mt-1 flex-wrap">
                          <span>Nightly Tariff: <strong>₹{Number(item.pricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                          <span>•</span>
                          <span>Capacity: <strong>{item.roomType?.capacity || 2} Pax</strong></span>
                          <span>•</span>
                          {item.isDeleted ? (
                            <span className="text-[#B54C44] font-medium">
                              Archived: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("en-IN") : "Recorded"}
                            </span>
                          ) : (
                            <span>
                              Status: <strong className="text-[#32765B] uppercase">{item.roomStatus || "AVAILABLE"}</strong>
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
                          setSelectedRoomDetails(item);
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
              Showing {filteredHistoryItems.length} of {historyData?.totalCount || 0} room records for {historyData?.monthName || "selected month"}.
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
