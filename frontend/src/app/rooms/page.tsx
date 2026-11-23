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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Room modal
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

  // Type modal
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
          search: search || undefined,
          limit: 100,
        }),
        roomsService.findAllTypes(),
      ]);
      setRooms(rRes.items);
      setRoomTypes(tRes);
    } catch (err) {
      toast.error("Failed to load room inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, search]);

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      roomNumber: "",
      roomTypeId: roomTypes[0]?.id || "",
      floor: 1,
      pricePerNight: roomTypes[0]?.defaultPricePerNight ? Number(roomTypes[0].defaultPricePerNight) : 2000,
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
      toast.error("Room number is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingRoom) {
        await roomsService.update(editingRoom.id, roomForm);
        toast.success(`Room ${roomForm.roomNumber} updated successfully`);
      } else {
        await roomsService.create(roomForm);
        toast.success(`Room ${roomForm.roomNumber} added to inventory`);
      }
      setRoomModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error saving room");
    } finally {
      setSubmitting(false);
    }
  };

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
        await roomsService.updateType(editingType.id, typeForm);
        toast.success(`Room type "${typeForm.name}" updated`);
      } else {
        await roomsService.createType(typeForm);
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

  const handleQuickStatusChange = async (room: Room, newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") => {
    try {
      await roomsService.updateStatus(room.id, newStatus);
      toast.success(`Room ${room.roomNumber} marked as ${newStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot change status");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Room Inventory & Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure room numbers, floors, nightly rates, live statuses, and room categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "rooms" ? (
            <Button
              onClick={handleOpenAddRoom}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddType}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room Type</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "rooms"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BedDouble className="w-3.5 h-3.5" />
          <span>Rooms ({rooms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("types")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "types"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Room Types ({roomTypes.length})</span>
        </button>
      </div>

      {activeTab === "rooms" && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
              {["ALL", "AVAILABLE", "OCCUPIED", "MAINTENANCE"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-700"
              >
                <option value="ALL">All Categories</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search room..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Room Inventory Grid */}
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No rooms matching the criteria. Click &quot;Add Room&quot; to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((r) => (
                <Card
                  key={r.id}
                  className={`border transition-all hover:shadow-md ${
                    r.roomStatus === "AVAILABLE"
                      ? "border-emerald-200/90 bg-emerald-50/20"
                      : r.roomStatus === "OCCUPIED"
                      ? "border-blue-200/90 bg-blue-50/20"
                      : "border-amber-200/90 bg-amber-50/20"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-slate-900">Room {r.roomNumber}</span>
                        <span className="text-[11px] text-slate-500 block">Floor {r.floor}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          r.roomStatus === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : r.roomStatus === "OCCUPIED"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {r.roomStatus}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-semibold text-slate-800">{r.roomType?.name}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Nightly Rate:</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(r.pricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {r.currentBooking && (
                        <div className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-600 mt-2">
                          <span className="font-semibold text-slate-800 block truncate">
                            {r.currentBooking.primaryGuest?.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {r.currentBooking.bookingStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditRoom(r)}
                        className="h-7 text-xs flex-1 text-slate-700"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      {r.roomStatus !== "OCCUPIED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleQuickStatusChange(
                              r,
                              r.roomStatus === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE",
                            )
                          }
                          title={r.roomStatus === "AVAILABLE" ? "Put in Maintenance" : "Mark Available"}
                          className="h-7 text-xs text-amber-700 hover:bg-amber-100/60"
                        >
                          {r.roomStatus === "AVAILABLE" ? (
                            <Wrench className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "types" && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Default Nightly Rate</th>
                  <th className="px-4 py-3">Total Rooms</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{t.description || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.capacity} Guests</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      ₹{Number(t.defaultPricePerNight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {t._count?.rooms || 0} Rooms
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditType(t)}
                        className="h-7 px-2 text-slate-600 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Room Modal */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : "Add New Room"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure room inventory parameters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRoom} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Room Number *</label>
              <Input
                required
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                placeholder="e.g. 101 or 204"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Room Category *</label>
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
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Cap: {t.capacity}, Default: ₹{t.defaultPricePerNight})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Floor</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nightly Rate (₹) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={roomForm.pricePerNight}
                  onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Initial Status</label>
              <select
                value={roomForm.roomStatus}
                onChange={(e) => setRoomForm({ ...roomForm, roomStatus: e.target.value as any })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setRoomModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : editingRoom ? "Save Changes" : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Room Type Modal */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingType ? `Edit Room Type` : "New Room Type"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Manage category pricing and guest capacity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveType} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Category Name *</label>
              <Input
                required
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g. Deluxe Double Suite"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Guest Capacity</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={typeForm.capacity}
                  onChange={(e) => setTypeForm({ ...typeForm, capacity: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Default Rate (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={typeForm.defaultPricePerNight}
                  onChange={(e) => setTypeForm({ ...typeForm, defaultPricePerNight: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Description</label>
              <Input
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Amenities, bed size, view..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setTypeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : editingType ? "Update Type" : "Create Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
