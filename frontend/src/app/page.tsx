"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BedDouble,
  Users,
  CreditCard,
  CalendarCheck,
  DoorOpen,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Activity,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Wrench,
  Hotel,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { DashboardStats, RecentBookingItem, RecentActivityItem } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [s, b, a, o] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentBookings(5),
        dashboardService.getRecentActivities(8),
        dashboardService.getOccupancyStats(),
      ]);
      setStats(s);
      setRecentBookings(b);
      setRecentActivities(a);
      setOccupancy(o);
    } catch (err: any) {
      toast.error("Failed to fetch dashboard metrics from live database");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner className="w-8 h-8 text-[#B08A60]" />
        <p className="text-sm font-medium text-[#79695B]">Querying live Neon PostgreSQL database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#B08A60] tracking-widest uppercase">
              Operations Console
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#362A22]">
            Hotel Operations Dashboard
          </h2>
          <p className="text-xs text-[#79695B] mt-1">
            Real-time live operational metrics, revenue performance, and room inventory from Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 border-[#E3D9CA] text-[#362A22] hover:bg-[#F2EADF]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
          <Link href="/bookings">
            <Button size="sm" className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm">
              <span>New Reservation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Rooms & Occupancy */}
        <Card className="hover:border-[#B08A60]/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-[#79695B] uppercase tracking-wider font-sans">
              Total Rooms
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#B08A60] border border-[#B08A60]/20 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#362A22]">
              {stats?.rooms.total || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <Badge variant="success">
                {stats?.rooms.available || 0} Available
              </Badge>
              <Badge variant="secondary">
                {stats?.rooms.occupied || 0} Occupied
              </Badge>
              {stats?.rooms.maintenance ? (
                <Badge variant="warning">
                  {stats.rooms.maintenance} Maint.
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Today's Stays */}
        <Card className="hover:border-[#B08A60]/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-[#79695B] uppercase tracking-wider font-sans">
              Today&apos;s Activity
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#E7F1E9] text-[#32765B] border border-[#32765B]/20 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#362A22]">
              {stats?.stays.activeBookings || 0}
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-xs text-[#79695B]">
              <span className="font-semibold text-[#32765B]">
                +{stats?.stays.todayCheckIns || 0} Check-ins
              </span>
              <span>•</span>
              <span className="font-medium text-[#79695B]">
                {stats?.stays.todayCheckOuts || 0} Check-outs
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card className="hover:border-[#B08A60]/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-[#79695B] uppercase tracking-wider font-sans">
              Today&apos;s Collections
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#F6EDDC] text-[#A97832] border border-[#A97832]/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#362A22]">
              ₹{(stats?.revenue.today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#79695B] mt-2 font-medium">
              Month to Date: <span className="font-bold text-[#362A22]">₹{(stats?.revenue.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </p>
          </CardContent>
        </Card>

        {/* Pending Receivables & Guests */}
        <Card className="hover:border-[#B08A60]/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-[#79695B] uppercase tracking-wider font-sans">
              Pending Invoices
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-[#F8E8E5] text-[#B54C44] border border-[#B54C44]/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold text-[#362A22]">
              ₹{(stats?.revenue.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#79695B] mt-2 font-medium">
              Registered Guests: <span className="font-bold text-[#362A22]">{stats?.guests.total || 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Room Type Occupancy Breakdown & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy by Room Type */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Room Type Inventory &amp; Occupancy</CardTitle>
                <CardDescription>
                  Breakdown by category across the hotel&apos;s physical room inventory
                </CardDescription>
              </div>
              <Badge variant="gold">
                {stats?.rooms.occupancyRate || 0}% Overall Occupancy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancy.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#79695B]">
                  No room categories configured yet.
                </div>
              ) : (
                occupancy.map((rt) => (
                  <div key={rt.roomTypeId} className="p-4 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#362A22]">{rt.roomTypeName}</span>
                        <span className="text-xs text-[#79695B]">({rt.capacity} Guests Max)</span>
                      </div>
                      <span className="text-xs font-bold text-[#362A22]">
                        {rt.occupied} / {rt.total} Occupied ({rt.occupancyRate}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-[#EAE3D8] h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#B08A60] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${rt.occupancyRate}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-[#79695B]">
                      <span className="flex items-center gap-1 font-medium text-[#32765B]">
                        <span className="w-2 h-2 rounded-full bg-[#32765B]" />
                        {rt.available} Available
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#362A22]">
                        <span className="w-2 h-2 rounded-full bg-[#362A22]" />
                        {rt.occupied} Occupied
                      </span>
                      {rt.maintenance > 0 && (
                        <span className="flex items-center gap-1 text-[#A97832] font-medium">
                          <Wrench className="w-3 h-3" />
                          {rt.maintenance} Maintenance
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Operational Shortcuts */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle>Front Desk Actions</CardTitle>
            <CardDescription>
              Immediate front-desk operations &amp; quick dispatch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/stays" className="block">
              <div className="p-3.5 rounded-xl border border-[#E3D9CA] hover:border-[#B08A60] hover:bg-[#F2EADF] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E7F1E9] text-[#32765B] flex items-center justify-center font-bold">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#362A22] group-hover:text-[#B08A60] transition-colors">
                      Check-In / Out Desk
                    </div>
                    <div className="text-[11px] text-[#79695B]">Process arrivals &amp; key returns</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#79695B] group-hover:text-[#B08A60] transition-colors" />
              </div>
            </Link>

            <Link href="/guests" className="block">
              <div className="p-3.5 rounded-xl border border-[#E3D9CA] hover:border-[#B08A60] hover:bg-[#F2EADF] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF6F0] text-[#B08A60] flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#362A22] group-hover:text-[#B08A60] transition-colors">
                      Register Guest
                    </div>
                    <div className="text-[11px] text-[#79695B]">Add KYC documents &amp; profiles</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#79695B] group-hover:text-[#B08A60] transition-colors" />
              </div>
            </Link>

            <Link href="/invoices" className="block">
              <div className="p-3.5 rounded-xl border border-[#E3D9CA] hover:border-[#B08A60] hover:bg-[#F2EADF] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F6EDDC] text-[#A97832] flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#362A22] group-hover:text-[#B08A60] transition-colors">
                      Billing &amp; Invoices
                    </div>
                    <div className="text-[11px] text-[#79695B]">Generate checkout bills &amp; folios</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#79695B] group-hover:text-[#B08A60] transition-colors" />
              </div>
            </Link>

            <Link href="/rooms" className="block">
              <div className="p-3.5 rounded-xl border border-[#E3D9CA] hover:border-[#B08A60] hover:bg-[#F2EADF] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E9EFF3] text-[#627D91] flex items-center justify-center font-bold">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#362A22] group-hover:text-[#B08A60] transition-colors">
                      Room Status
                    </div>
                    <div className="text-[11px] text-[#79695B]">Manage floors &amp; maintenance</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#79695B] group-hover:text-[#B08A60] transition-colors" />
              </div>
            </Link>
          </CardContent>
          <div className="p-4 bg-[#F7F4EE] border-t border-[#E3D9CA] text-[11px] text-[#79695B] text-center font-medium">
            Neon Serverless PostgreSQL • Single Admin Operating System
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Recent Reservations</CardTitle>
              <CardDescription>
                Latest guest bookings and active stay records
              </CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-xs text-[#B08A60] hover:text-[#362A22]">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#79695B]">
                No bookings recorded yet in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-[#79695B] uppercase bg-[#F7F4EE] border-y border-[#E3D9CA]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Booking #</th>
                      <th className="px-5 py-3 font-semibold">Guest</th>
                      <th className="px-5 py-3 font-semibold">Room</th>
                      <th className="px-5 py-3 font-semibold">Dates</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F2EADF]/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#B08A60]">
                          {b.bookingNumber}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#362A22]">
                          <div className="font-bold">{b.guestName}</div>
                          <div className="text-[10px] text-[#79695B]">{b.mobileNumber}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[#362A22]">Room {b.roomNumber}</span>
                          <span className="text-[10px] text-[#79695B] block">{b.roomType}</span>
                        </td>
                        <td className="px-5 py-3.5 text-[#79695B] whitespace-nowrap">
                          {new Date(b.checkInDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} -{" "}
                          {new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              b.bookingStatus === "CHECKED_IN"
                                ? "success"
                                : b.bookingStatus === "RESERVED"
                                ? "gold"
                                : b.bookingStatus === "CHECKED_OUT"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {b.bookingStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-[#362A22]">
                          ₹{b.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Audit Trail */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B08A60]" />
              <span>Live Audit Stream</span>
            </CardTitle>
            <CardDescription>
              Chronological ledger of operational state mutations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#79695B]">
                No recent system logs recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2.5 border-b border-[#EAE3D8] last:border-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full bg-[#B08A60] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#362A22] text-[11px] truncate">
                        {act.description || `${act.action} ${act.entityType}`}
                      </p>
                      <span className="text-[10px] text-[#79695B]">
                        {new Date(act.changedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
