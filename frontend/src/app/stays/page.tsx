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
} from "lucide-react";
import { bookingsService } from "@/services/bookings.service";
import { roomsService } from "@/services/rooms.service";
import { Booking, Room } from "@/types";
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
  const [activeTab, setActiveTab] = useState<"arrivals" | "inhouse" | "departures">("inhouse");
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [inHouse, setInHouse] = useState<Booking[]>([]);
  const [departures, setDepartures] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Relocation modal state
  const [relocateModalOpen, setRelocateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [relocateReason, setRelocateReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [arr, act, dep] = await Promise.all([
        bookingsService.getTodayCheckIns(),
        bookingsService.getActiveStays(),
        bookingsService.getTodayCheckOuts(),
      ]);
      setArrivals(arr);
      setInHouse(act);
      setDepartures(dep);
    } catch (err) {
      toast.error("Failed to load front-desk stay lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (booking: Booking) => {
    try {
      await bookingsService.checkIn(booking.id);
      toast.success(`Guest ${booking.primaryGuest?.fullName} checked into Room ${booking.room?.roomNumber}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check in guest");
    }
  };

  const handleCheckOut = async (booking: Booking) => {
    try {
      await bookingsService.checkOut(booking.id);
      toast.success(`Guest ${booking.primaryGuest?.fullName} checked out. Room ${booking.room?.roomNumber} marked AVAILABLE.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to check out guest");
    }
  };

  const handleOpenRelocate = async (booking: Booking) => {
    setSelectedBooking(booking);
    setRelocateReason("");
    try {
      const rooms = await roomsService.findAvailable({
        checkIn: new Date().toISOString().split("T")[0],
        checkOut: booking.expectedCheckOutDate.split("T")[0],
      });
      // Filter out the room they are already in
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Check-In & Check-Out Operations
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Real-time front desk workflow: process arrivals, manage in-house guest stays, room relocations, and departures.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="text-xs">
          Refresh Board
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E3D9CA] pb-2">
        <button
          onClick={() => setActiveTab("inhouse")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "inhouse"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-slate-100"
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>In-House Guests ({inHouse.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("arrivals")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "arrivals"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-slate-100"
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Pending Check-Ins / Arrivals ({arrivals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departures")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "departures"
              ? "bg-[#362A22] text-white shadow-sm"
              : "text-[#79695B] hover:bg-slate-100"
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Today&apos;s Expected Departures ({departures.length})</span>
        </button>
      </div>

      {/* In-House Guests Table */}
      {activeTab === "inhouse" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <LoadingSpinner className="w-6 h-6 text-[#B08A60]" />
              </div>
            ) : inHouse.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#948779]">
                No guests currently in-house. Check in an arrival from the Arrivals tab.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                  <tr>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Guest Information</th>
                    <th className="px-4 py-3">Checked In At</th>
                    <th className="px-4 py-3">Expected Departure</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {inHouse.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F4EE]/70">
                      <td className="px-4 py-3 font-semibold text-[#362A22]">
                        <div className="text-base text-[#362A22]">Room {b.room?.roomNumber}</div>
                        <div className="text-[10px] text-[#948779]">{b.room?.roomType?.name}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        <div>{b.primaryGuest?.fullName}</div>
                        <div className="text-[11px] text-[#948779] font-mono">
                          {b.primaryGuest?.mobileNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        {b.actualCheckInAt ? new Date(b.actualCheckInAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        <div>{new Date(b.expectedCheckOutDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#948779]">{b.expectedCheckOutTime}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#5D493D]">
                        {b.numberOfNights} Nights
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRelocate(b)}
                          className="h-7 text-xs text-[#5D493D] hover:text-[#B08A60]"
                          title="Relocate to another room"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Relocate
                        </Button>
                        <Link href={`/invoices?bookingId=${b.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-[#5D493D] hover:text-amber-600"
                            title="Generate final invoice"
                          >
                            <Receipt className="w-3.5 h-3.5 mr-1" /> Bill
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleCheckOut(b)}
                          className="h-7 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1" /> Check-Out
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Expected Arrivals */}
      {activeTab === "arrivals" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {arrivals.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#948779]">
                No arrivals scheduled for today.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                  <tr>
                    <th className="px-4 py-3">Booking #</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Reserved Room</th>
                    <th className="px-4 py-3">Expected Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {arrivals.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F4EE]/70">
                      <td className="px-4 py-3 font-mono font-medium text-[#B08A60]">
                        {b.bookingNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        <div>{b.primaryGuest?.fullName}</div>
                        <div className="text-[11px] text-[#948779] font-mono">
                          {b.primaryGuest?.mobileNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#362A22]">Room {b.room?.roomNumber}</span>
                        <span className="text-[10px] text-[#948779] block">{b.room?.roomType?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-[#79695B] font-medium">
                        {b.checkInTime || "12:00 PM"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {b.bookingStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.bookingStatus === "RESERVED" ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(b)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <DoorOpen className="w-3.5 h-3.5 mr-1" /> Check-In Guest
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Already Checked-In</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Expected Departures */}
      {activeTab === "departures" && (
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {departures.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#948779]">
                No departures scheduled for today.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                  <tr>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Expected Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {departures.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F4EE]/70">
                      <td className="px-4 py-3 font-semibold text-[#362A22]">
                        Room {b.room?.roomNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        {b.primaryGuest?.fullName}
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        {b.expectedCheckOutTime || "11:00 AM"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {b.bookingStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.bookingStatus === "CHECKED_IN" ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckOut(b)}
                            className="h-7 text-xs bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1" /> Process Checkout
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#948779]">Departed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relocate Room Modal */}
      <Dialog open={relocateModalOpen} onOpenChange={setRelocateModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              Relocate Room
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Change allocated room for booking {selectedBooking?.bookingNumber}. Current Room: {selectedBooking?.room?.roomNumber}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRelocate} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Select New Room *</label>
              {availableRooms.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 rounded border border-amber-200 text-xs">
                  No other rooms are available during this stay period.
                </div>
              ) : (
                <select
                  required
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white font-mono"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType?.name} • ₹{Number(r.pricePerNight)}/night)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Reason for Relocation</label>
              <Input
                value={relocateReason}
                onChange={(e) => setRelocateReason(e.target.value)}
                placeholder="Guest requested upgrade, plumbing maintenance..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setRelocateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || availableRooms.length === 0}
                className="bg-[#362A22] hover:bg-[#43352B] text-white"
              >
                {submitting ? "Relocating..." : "Confirm Relocation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
