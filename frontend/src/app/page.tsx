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
        <LoadingSpinner className="w-8 h-8 text-indigo-600" />
        <p className="text-sm text-slate-500">Querying live Neon PostgreSQL database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Hotel Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live operational metrics, revenue figures, and room statuses from Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
          <Link href="/bookings">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5">
              <span>New Booking</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Rooms & Occupancy */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Rooms
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.rooms.total || 0}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                {stats?.rooms.available || 0} Available
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                {stats?.rooms.occupied || 0} Occupied
              </Badge>
              {stats?.rooms.maintenance ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                  {stats.rooms.maintenance} Maint.
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Today's Stays */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Activity
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.stays.activeBookings || 0}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
              <span className="font-medium text-emerald-600">
                +{stats?.stays.todayCheckIns || 0} Check-ins
              </span>
              <span>•</span>
              <span className="font-medium text-slate-600">
                {stats?.stays.todayCheckOuts || 0} Check-outs
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today&apos;s Collections
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{(stats?.revenue.today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Monthly: ₹{(stats?.revenue.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Pending Receivables & Guests */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Invoices
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{(stats?.revenue.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Total Registered Guests: <span className="font-semibold text-slate-700">{stats?.guests.total || 0}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Room Type Occupancy Breakdown & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy by Room Type */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Room Type Inventory & Occupancy
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Breakdown by category across the hotel&apos;s room catalog
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {stats?.rooms.occupancyRate || 0}% Overall Occupancy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancy.map((rt) => (
                <div key={rt.roomTypeId} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{rt.roomTypeName}</span>
                      <span className="text-xs text-slate-400">({rt.capacity} Guests Max)</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {rt.occupied} / {rt.total} Occupied ({rt.occupancyRate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500"
                      style={{ width: `${rt.occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {rt.available} Available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      {rt.occupied} Occupied
                    </span>
                    {rt.maintenance > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Wrench className="w-3 h-3" />
                        {rt.maintenance} Maintenance
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Operational Shortcuts */}
        <Card className="border-slate-200 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Front Desk Actions
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Immediate front-desk workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/stays" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Check-In / Out Desk</div>
                    <div className="text-[11px] text-slate-500">Process arrivals & departures</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/guests" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Register Guest</div>
                    <div className="text-[11px] text-slate-500">Add ID documents & details</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/invoices" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Billing & Invoices</div>
                    <div className="text-[11px] text-slate-500">Generate checkout bills</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/rooms" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Room Status</div>
                    <div className="text-[11px] text-slate-500">Manage floors & maintenance</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Database: Neon PostgreSQL • Single Admin
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                Recent Bookings
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Latest customer reservations and stay records
              </CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No bookings recorded yet in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Booking #</th>
                      <th className="px-3 py-2 font-semibold">Guest</th>
                      <th className="px-3 py-2 font-semibold">Room</th>
                      <th className="px-3 py-2 font-semibold">Dates</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-indigo-600">
                          {b.bookingNumber}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          <div>{b.guestName}</div>
                          <div className="text-[10px] text-slate-400">{b.mobileNumber}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-slate-700">Room {b.roomNumber}</span>
                          <span className="text-[10px] text-slate-400 block">{b.roomType}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          {new Date(b.checkInDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} -{" "}
                          {new Date(b.expectedCheckOutDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              b.bookingStatus === "CHECKED_IN"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : b.bookingStatus === "RESERVED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : b.bookingStatus === "CHECKED_OUT"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {b.bookingStatus}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Live System Activities</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit log from live operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent system logs recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-[11px] truncate">
                        {act.description || `${act.action} ${act.entityType}`}
                      </p>
                      <span className="text-[10px] text-slate-400">
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
