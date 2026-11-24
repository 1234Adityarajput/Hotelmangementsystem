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
} from "lucide-react";
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setAvailabilityExplorerOpen(!availabilityExplorerOpen)}
            className="border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5 text-xs h-9"
          >
            <Calendar className="w-4 h-4 text-[#C4A06A]" />
            <span>Check Room Availability</span>
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
          className="bg-white border-[#E8DDD8] shadow-sm cursor-pointer hover:border-[#627D91] transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFF3] flex items-center justify-center text-[#627D91]">
              <UserCheck className="w-5 h-5 text-[#627D91]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#627D91] tracking-wider">Occupied</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{occupiedRoomsCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Under Maintenance */}
        <Card
          onClick={() => setStatusFilter("MAINTENANCE")}
          className="bg-white border-[#E8DDD8] shadow-sm cursor-pointer hover:border-[#A97832] transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6EDDC] flex items-center justify-center text-[#A97832]">
              <Wrench className="w-5 h-5 text-[#A97832]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#A97832] tracking-wider">
                Under Maintenance
              </p>
              <h3 className="text-xl font-serif font-bold text-[#A97832]">{maintenanceRoomsCount}</h3>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayRooms.map((r) => {
                    const isAvailable = r.roomStatus === "AVAILABLE";
                    const isOccupied = r.roomStatus === "OCCUPIED";
                    const isMaintenance = r.roomStatus === "MAINTENANCE";

                    return (
                      <Card
                        key={r.id}
                        className={`border bg-white transition-all hover:shadow-md relative overflow-hidden ${
                          isAvailable
                            ? "border-[#32765B]/30 hover:border-[#32765B]"
                            : isOccupied
                            ? "border-[#627D91]/30 hover:border-[#627D91]"
                            : "border-[#A97832]/30 hover:border-[#A97832]"
                        }`}
                      >
                        {/* Top Status Accent Bar */}
                        <div
                          className={`h-1.5 w-full ${
                            isAvailable
                              ? "bg-[#32765B]"
                              : isOccupied
                              ? "bg-[#627D91]"
                              : "bg-[#A97832]"
                          }`}
                        />

                        <CardContent className="p-4 space-y-3">
                          {/* Room Header: Number, Floor & Status Badge */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xl font-serif font-bold text-[#59283A]">
                                  Room {r.roomNumber}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-[#82747A] block">
                                Floor {r.floor} • Cap: {r.roomType?.capacity || 2}
                              </span>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isAvailable
                                  ? "bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30"
                                  : isOccupied
                                  ? "bg-[#E9EFF3] text-[#627D91] border-[#627D91]/30"
                                  : "bg-[#F6EDDC] text-[#A97832] border-[#A97832]/30"
                              }`}
                            >
                              {isAvailable
                                ? "Available"
                                : isOccupied
                                ? "Occupied"
                                : "Under Maintenance"}
                            </Badge>
                          </div>

                          {/* Room Type & Description */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-[#82747A]">
                              <span className="text-[#8E7079] text-[11px] uppercase font-semibold">
                                Category:
                              </span>
                              <span className="font-semibold text-[#59283A]">{r.roomType?.name}</span>
                            </div>

                            {/* Room Description */}
                            <div className="text-[11px] text-[#82747A] bg-[#F5F0EA] p-2 rounded-lg border border-[#E8DDD8]/60 min-h-[42px] line-clamp-2">
                              {r.description || (
                                <span className="italic text-[#8E7079]">
                                  {r.roomType?.description || "Standard room with premium hospitality amenities."}
                                </span>
                              )}
                            </div>

                            {/* Price Per Night with Quick Update Action */}
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[#8E7079] text-[11px] uppercase font-semibold">
                                Price Per Night:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-sm text-[#59283A]">
                                  ₹{Number(r.pricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickPrice(r)}
                                  className="text-[#C4A06A] hover:text-[#59283A] p-0.5"
                                  title="Update Price"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Active Occupant Details if Occupied */}
                            {r.currentBooking && (
                              <div className="p-2 bg-[#E9EFF3]/60 rounded-lg border border-[#627D91]/20 text-[11px] text-[#59283A] mt-1 space-y-0.5">
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="truncate">
                                    {r.currentBooking.primaryGuest?.fullName}
                                  </span>
                                  <Badge variant="outline" className="text-[9px] bg-white">
                                    {r.currentBooking.bookingStatus}
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-[#82747A] font-mono">
                                  {r.currentBooking.primaryGuest?.mobileNumber}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons Footer */}
                          <div className="pt-2 border-t border-[#E8DDD8] flex items-center justify-between gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDetails(r.id)}
                              className="h-7 text-[11px] px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA] border-[#E8DDD8]"
                              title="View Room Dossier"
                            >
                              <Eye className="w-3 h-3 mr-1 text-[#C4A06A]" />
                              Dossier
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRoom(r)}
                              className="h-7 text-[11px] px-2 text-[#7A4652] hover:bg-[#F5F0EA] border-[#E8DDD8]"
                              title="Edit Room Details"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>

                            {/* Quick Status Toggle Button */}
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
                                title={
                                  isAvailable
                                    ? "Mark as Under Maintenance"
                                    : "Mark as Available"
                                }
                                className={`h-7 px-2 text-[11px] ${
                                  isAvailable
                                    ? "text-[#A97832] hover:bg-[#F6EDDC]"
                                    : "text-[#32765B] hover:bg-[#E7F1E9]"
                                }`}
                              >
                                {isAvailable ? (
                                  <>
                                    <Wrench className="w-3 h-3 mr-1" />
                                    <span>Maintain</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-[#32765B]" />
                                    <span>Ready</span>
                                  </>
                                )}
                              </Button>
                            )}
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
                                  className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isAvailable
                                      ? "bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30"
                                      : isOccupied
                                      ? "bg-[#E9EFF3] text-[#627D91] border-[#627D91]/30"
                                      : "bg-[#F6EDDC] text-[#A97832] border-[#A97832]/30"
                                  }`}
                                >
                                  {isAvailable
                                    ? "Available"
                                    : isOccupied
                                    ? "Occupied"
                                    : "Under Maintenance"}
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
                  step="50"
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
                step="50"
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
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  selectedRoomDetails?.roomStatus === "AVAILABLE"
                    ? "bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30"
                    : selectedRoomDetails?.roomStatus === "OCCUPIED"
                    ? "bg-[#E9EFF3] text-[#627D91] border-[#627D91]/30"
                    : "bg-[#F6EDDC] text-[#A97832] border-[#A97832]/30"
                }`}
              >
                {selectedRoomDetails?.roomStatus === "AVAILABLE"
                  ? "Available"
                  : selectedRoomDetails?.roomStatus === "OCCUPIED"
                  ? "Occupied"
                  : "Under Maintenance"}
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
                  step="100"
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
    </div>
  );
}
