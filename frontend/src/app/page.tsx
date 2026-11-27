"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BedDouble,
  Users,
  CreditCard,
  DoorOpen,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Wrench,
  Hotel,
  UserCheck,
  CalendarCheck2,
  HandCoins,
  Banknote,
  WalletCards,
  ArrowDownRight,
  Calendar,
  FileText,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Search,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { bookingsService } from "@/services/bookings.service";
import {
  DashboardStats,
  DashboardAnalytics,
  RecentBookingItem,
  RecentActivityItem,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuth } from "@/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [s, a, b, act] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getAnalytics(),
        dashboardService.getRecentBookings(6),
        dashboardService.getRecentActivities(8),
      ]);
      setStats(s);
      setAnalytics(a);
      setRecentBookings(b);
      setRecentActivities(act);
    } catch (err: any) {
      toast.error("Failed to fetch dashboard metrics from live database");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // In-House Guests Modal State
  const [inHouseModalOpen, setInHouseModalOpen] = useState(false);
  const [inHouseStays, setInHouseStays] = useState<any[]>([]);
  const [inHouseLoading, setInHouseLoading] = useState(false);
  const [inHouseSearch, setInHouseSearch] = useState("");

  const handleOpenInHouseModal = async () => {
    setInHouseModalOpen(true);
    try {
      setInHouseLoading(true);
      const res = await bookingsService.getActiveStays();
      setInHouseStays(res || []);
    } catch (err: any) {
      toast.error("Failed to load in-house guest records");
    } finally {
      setInHouseLoading(false);
    }
  };

  const filteredInHouseStays = inHouseStays.filter((b: any) => {
    if (!inHouseSearch.trim()) return true;
    const q = inHouseSearch.toLowerCase();
    const guest = b.primaryGuest;
    const room = b.room;
    const docs = (guest?.documents || []).map((d: any) => `${d.idType} ${d.documentNumber}`).join(" ").toLowerCase();
    return (
      (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
      (guest?.fullName && guest.fullName.toLowerCase().includes(q)) ||
      (guest?.guestCode && guest.guestCode.toLowerCase().includes(q)) ||
      (guest?.mobileNumber && guest.mobileNumber.toLowerCase().includes(q)) ||
      (guest?.alternateMobileNumber && guest.alternateMobileNumber.toLowerCase().includes(q)) ||
      (guest?.email && guest.email.toLowerCase().includes(q)) ||
      (guest?.address && guest.address.toLowerCase().includes(q)) ||
      (guest?.city && guest.city.toLowerCase().includes(q)) ||
      (guest?.state && guest.state.toLowerCase().includes(q)) ||
      (guest?.postalCode && guest.postalCode.toLowerCase().includes(q)) ||
      (room?.roomNumber && room.roomNumber.toLowerCase().includes(q)) ||
      (room?.roomType?.name && room.roomType.name.toLowerCase().includes(q)) ||
      docs.includes(q)
    );
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <LoadingSpinner size="lg" text="Connecting to Database & Loading Live Dashboard..." subtext="Retrieving real-time room inventory, checked-in guests, revenue & staff ledgers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* =====================================================================
          1. TOP EXECUTIVE WELCOME & OPERATIONS BANNER
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#C4A06A] tracking-widest uppercase bg-[#F5F0EA] px-2.5 py-0.5 rounded-full border border-[#C4A06A]/30">
              {isManager ? "👔 Hotel Manager Operations Console" : "👑 Executive Hotel Console"}
            </span>
            <span className="text-xs text-[#82747A]">• {isManager ? "Front Office & Workforce" : "Live Operations Overview"}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#59283A]">
            Hotel Operations &amp; Business Dashboard
          </h2>
          <p className="text-xs text-[#82747A] mt-1">
            Complete executive overview of room inventory, front desk flows, revenue analytics, hotel expenses, and workforce payroll.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 border-[#E8DDD8] text-[#59283A] hover:bg-[#EFE8E0]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#C4A06A]" : ""}`} />
            <span>Refresh Live Data</span>
          </Button>
          <Link href="/bookings">
            <Button size="sm" className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 shadow-sm">
              <span>New Reservation</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C4A06A]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* =====================================================================
          2. DASHBOARD INFORMATION — 13 MANDATORY KPI CARDS
          ===================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base font-bold text-[#59283A] flex items-center gap-2">
            <Hotel className="w-4 h-4 text-[#C4A06A]" />
            <span>Core Operational &amp; Financial Information</span>
          </h3>
          <span className="text-[11px] text-[#82747A]">13 Live Database Indicators</span>
        </div>

        {/* Row 1: Rooms & Guest Capacity (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 1. Total Rooms */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                1. Total Rooms
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#C4A06A] border border-[#C4A06A]/20 flex items-center justify-center">
                <BedDouble className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-[#59283A]">
                {stats?.rooms?.total || 0}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                Physical property room count
              </p>
            </CardContent>
          </Card>

          {/* 2. Available Rooms */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                2. Available Rooms
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#E7F1E9] text-[#32765B] border border-[#32765B]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-[#32765B]">
                {stats?.rooms?.available || 0}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="success">Clean &amp; Ready</Badge>
                {stats?.rooms?.maintenance ? (
                  <Badge variant="warning">{stats?.rooms?.maintenance} Maint.</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* 3. Occupied Rooms */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                3. Occupied Rooms
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#59283A] border border-[#E8DDD8] flex items-center justify-center">
                <DoorOpen className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-[#59283A]">
                {stats?.rooms?.occupied || 0}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary">
                  {stats?.rooms?.occupancyRate || 0}% Occupancy
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 4. Currently Staying Guests */}
          <Card
            onClick={handleOpenInHouseModal}
            className="hover:border-[#C4A06A] hover:shadow-md transition-all cursor-pointer group bg-white border-[#E8DDD8]"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] group-hover:text-[#59283A] uppercase tracking-wider font-sans transition-colors">
                4. In-House Guests
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#E9EFF3] text-[#627D91] group-hover:bg-[#59283A] group-hover:text-[#C4A06A] border border-[#627D91]/20 flex items-center justify-center transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-[#59283A] group-hover:text-[#C4A06A] transition-colors">
                {stats?.stays?.currentlyStayingGuests || 0}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-[#82747A] font-medium">
                  Currently staying guests
                </p>
                <span className="text-[10px] text-[#C4A06A] font-bold group-hover:underline flex items-center gap-0.5">
                  View Dossiers →
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Front Desk Check-in / Out & Revenue & Expenses (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 5. Today's Check-ins */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                5. Today&apos;s Check-ins
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#E7F1E9] text-[#32765B] flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-[#32765B]">
                +{stats?.stays?.todayCheckIns || 0}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                Scheduled arrivals today
              </p>
            </CardContent>
          </Card>

          {/* 6. Today's Check-outs */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                6. Today&apos;s Check-outs
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#82747A] flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-[#59283A]">
                {stats?.stays?.todayCheckOuts || 0}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                Expected departures today
              </p>
            </CardContent>
          </Card>

          {/* 7. Today's Revenue */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                7. Today&apos;s Revenue
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F6EDDC] text-[#A97832] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#59283A]">
                {isManager ? "••••••" : `₹${(stats?.revenue?.today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#32765B] mt-1 font-semibold">
                {isManager ? "Owner Confidential" : "Live payments collected"}
              </p>
            </CardContent>
          </Card>

          {/* 8. Monthly Revenue */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                8. Monthly Revenue
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#C4A06A] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#59283A]">
                {isManager ? "••••••" : `₹${(stats?.revenue?.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : "Month-to-date inflows"}
              </p>
            </CardContent>
          </Card>

          {/* 9. Pending Guest Payments */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                9. Pending Invoices
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F8E8E5] text-[#B54C44] flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#B54C44]">
                {isManager ? "••••••" : `₹${(stats?.revenue?.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : "Uncollected guest dues"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Expenses, Staff & Payroll (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 10. Total Hotel Expenses */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                10. Total Expenses
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#82747A] flex items-center justify-center">
                <WalletCards className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-[#59283A]">
                {isManager ? "••••••" : `₹${(stats?.expenses?.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : `This month (All-time: ₹${(stats?.expenses?.total || 0).toLocaleString("en-IN")})`}
              </p>
            </CardContent>
          </Card>

          {/* 11. Total Staff Members */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                11. Total Staff
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#C4A06A] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-[#59283A]">
                {stats?.staff?.total || 0}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                Active hotel personnel
              </p>
            </CardContent>
          </Card>

          {/* 12. Today's Staff Attendance */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                12. Today&apos;s Attendance
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#E7F1E9] text-[#32765B] flex items-center justify-center">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#32765B]">
                  {stats?.staff?.todayAttendance?.present || 0}
                </span>
                <span className="text-xs text-[#82747A]">
                  / {stats?.staff?.total || 0} Present ({stats?.staff?.todayAttendance?.attendanceRate || 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="text-rose-700">{stats?.staff?.todayAttendance?.absent || 0} Absent</span>
                <span>•</span>
                <span className="text-amber-700">{stats?.staff?.todayAttendance?.halfDay || 0} Half-day</span>
                <span>•</span>
                <span className="text-blue-700">{stats?.staff?.todayAttendance?.leave || 0} Leave</span>
              </div>
            </CardContent>
          </Card>

          {/* 13. Monthly Salary Summary */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                13. Salary Summary
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#F5F0EA] text-[#C4A06A] flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-2xl font-bold text-[#59283A]">
                {isManager ? "••••••" : `₹${(stats?.payroll?.monthlyNetSalary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : `Paid: ₹${(stats?.payroll?.monthlyDisbursed || 0).toLocaleString("en-IN")} • Due: ₹${(stats?.payroll?.pendingBalance || 0).toLocaleString("en-IN")}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =====================================================================
          3. DEDICATED ANALYTICS SECTION (6 MANDATORY ANALYTICS BREAKDOWNS)
          ===================================================================== */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8DDD8]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#59283A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C4A06A]" />
              <span>Operational &amp; Financial Analytics</span>
            </h3>
            <p className="text-xs text-[#82747A] mt-0.5">
              Deep operational intelligence, historical revenue trends, income/expense ratio, and attendance compliance.
            </p>
          </div>
          <span className="text-xs bg-[#F5F0EA] text-[#8B6A3D] border border-[#C4A06A]/30 px-3 py-1 rounded-full font-bold">
            6 Specialized Analytics Panels
          </span>
        </div>

        {/* Analytics Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ANALYTICS 1: Daily Revenue Overview */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 1: Daily Revenue Overview (Last 7 Days)
                  </CardTitle>
                  <CardDescription>
                    Daily cash flow receipts and payment transaction volumes
                  </CardDescription>
                </div>
                <Badge variant="gold">7-Day Trend</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {analytics?.dailyRevenue?.map((d) => {
                  const maxDaily = Math.max(...(analytics?.dailyRevenue?.map((x) => x.revenue) || [1]), 1000);
                  const pct = Math.round((d.revenue / maxDaily) * 100);
                  return (
                    <div key={d.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#59283A] w-24">
                          {d.day}, {d.date}
                        </span>
                        <span className="text-[11px] text-[#82747A]">
                          {d.transactions} {d.transactions === 1 ? "txn" : "txns"}
                        </span>
                        <span className="font-bold text-[#59283A] font-mono">
                          ₹{d.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-[#E8DDD8] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#C4A06A] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, d.revenue > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ANALYTICS 2: Monthly Revenue Overview */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 2: Monthly Revenue &amp; Expenses (6 Months)
                  </CardTitle>
                  <CardDescription>
                    Historical revenue collections versus operating expenditures
                  </CardDescription>
                </div>
                <Badge
                  variant={isManager ? "outline" : "secondary"}
                  className={isManager ? "border-[#C4A06A] text-[#8B6A3D] bg-[#F5F0EA]" : ""}
                >
                  {isManager ? "Owner Confidential" : "Monthly Ledger"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isManager ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-[#F5F0EA]/40 rounded-xl border border-dashed border-[#C4A06A]/40 my-1">
                  <div className="w-12 h-12 rounded-full bg-[#59283A]/10 flex items-center justify-center text-[#59283A]">
                    <ShieldCheck className="w-6 h-6 text-[#C4A06A]" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif text-2xl font-bold tracking-widest text-[#59283A]">
                      ••••••••••••
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#A97832]">
                      Owner Confidential
                    </div>
                    <p className="text-[11px] text-[#82747A] max-w-sm mt-1">
                      Historical revenue collections and operating expenditures are confidential to Executive Hotel Owner.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#E8DDD8]">
                  {analytics?.monthlyRevenue?.map((m) => (
                    <div key={m.month} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <span className="font-bold text-[#59283A] w-20">{m.month}</span>
                      <div className="text-center">
                        <span className="text-[10px] text-[#82747A] uppercase block">Revenue</span>
                        <span className="font-bold text-[#32765B] font-mono">
                          ₹{m.revenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-[#82747A] uppercase block">Expenses</span>
                        <span className="font-bold text-[#B54C44] font-mono">
                          ₹{m.expenses.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#82747A] uppercase block">Net Margin</span>
                        <span
                          className={`font-bold font-mono ${
                            m.netProfit >= 0 ? "text-[#32765B]" : "text-[#B54C44]"
                          }`}
                        >
                          {m.netProfit >= 0 ? "+" : ""}₹{m.netProfit.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid Row 2: Occupancy & Guest Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ANALYTICS 3: Room Occupancy Statistics */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 3: Room Occupancy Statistics
                  </CardTitle>
                  <CardDescription>
                    Capacity utilization, room category breakdown &amp; availability
                  </CardDescription>
                </div>
                <Badge variant="gold">
                  {stats?.rooms?.occupancyRate || 0}% Property Occupancy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {analytics?.roomOccupancy?.map((ro) => (
                  <div key={ro.roomTypeId} className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div>
                        <span className="font-bold text-[#59283A]">{ro.roomTypeName}</span>
                        <span className="text-[11px] text-[#82747A] ml-1.5">({ro.capacity} Pax Max)</span>
                      </div>
                      <span className="font-bold text-[#59283A] font-mono">
                        {ro.occupied} / {ro.total} Rooms ({ro.occupancyRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E8DDD8] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C4A06A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${ro.occupancyRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-[#82747A]">
                      <span className="text-[#32765B] font-medium">• {ro.available} Available</span>
                      <span className="text-[#59283A] font-medium">• {ro.occupied} Occupied</span>
                      <span className="text-[#A97832] font-medium">• {ro.maintenance} Maintenance</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ANALYTICS 4: Guest Statistics */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 4: Guest Statistics &amp; Demographics
                  </CardTitle>
                  <CardDescription>
                    Guest verification ratio, in-house residency &amp; acquisition
                  </CardDescription>
                </div>
                <Badge variant="secondary">KYC Compliant</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#C4A06A]/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#82747A] block">
                    Total Registered Guests
                  </span>
                  <span className="font-serif text-3xl font-bold text-[#59283A]">
                    {analytics?.guestStats?.totalGuests || 0}
                  </span>
                  <span className="text-[10px] text-[#C4A06A] font-semibold mt-0.5 block">
                    Lifetime Directory
                  </span>
                </div>

                <div className="p-3.5 bg-[#E7F1E9] rounded-xl border border-[#32765B]/30 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#32765B] block">
                    Currently Staying
                  </span>
                  <span className="font-serif text-3xl font-bold text-[#32765B]">
                    {analytics?.guestStats?.currentlyStaying || 0}
                  </span>
                  <span className="text-[10px] text-[#32765B] font-semibold mt-0.5 block">
                    Active In-House Pax
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#82747A] font-medium">Guests with Identity (KYC) Docs:</span>
                  <span className="font-bold text-[#59283A]">
                    {analytics?.guestStats?.withDocuments || 0} / {analytics?.guestStats?.totalGuests || 0}
                  </span>
                </div>
                <div className="w-full bg-[#E8DDD8] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#32765B] h-full rounded-full"
                    style={{
                      width: `${
                        (analytics?.guestStats?.totalGuests || 0) > 0
                          ? Math.round(
                              ((analytics?.guestStats?.withDocuments || 0) /
                                (analytics?.guestStats?.totalGuests || 1)) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-[#82747A]">New Guest Registrations this month:</span>
                  <span className="font-bold text-[#C4A06A]">
                    +{analytics?.guestStats?.newThisMonth || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid Row 3: Income/Expense Analysis & Staff Attendance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ANALYTICS 5: Income and Expense Analysis */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 5: Income &amp; Expense Analysis
                  </CardTitle>
                  <CardDescription>
                    Current monthly cash inflows, operating expenses, payroll &amp; net cash flow
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    isManager
                      ? "outline"
                      : Number(analytics?.incomeExpenseAnalysis?.netCashFlow || 0) >= 0
                      ? "success"
                      : "destructive"
                  }
                  className={isManager ? "border-[#C4A06A] text-[#8B6A3D] bg-[#F5F0EA]" : ""}
                >
                  {isManager
                    ? "Owner Confidential"
                    : Number(analytics?.incomeExpenseAnalysis?.netCashFlow || 0) >= 0
                    ? "Net Positive"
                    : "Deficit"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {isManager ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-[#F5F0EA]/40 rounded-xl border border-dashed border-[#C4A06A]/40 my-1">
                  <div className="w-12 h-12 rounded-full bg-[#59283A]/10 flex items-center justify-center text-[#59283A]">
                    <ShieldCheck className="w-6 h-6 text-[#C4A06A]" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif text-2xl font-bold tracking-widest text-[#59283A]">
                      ••••••••••••
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#A97832]">
                      Owner Confidential
                    </div>
                    <p className="text-[11px] text-[#82747A] max-w-sm mt-1">
                      Current monthly cash inflows, operating expenses, and net cash flow are confidential to Executive Hotel Owner.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#E7F1E9]/50 border border-[#32765B]/20">
                    <span className="font-bold text-[#32765B]">Monthly Gross Revenue:</span>
                    <span className="font-mono font-bold text-sm text-[#32765B]">
                      ₹{(analytics?.incomeExpenseAnalysis?.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#F8E8E5]/50 border border-[#B54C44]/20">
                    <span className="font-bold text-[#B54C44]">(-) Operational Hotel Expenses:</span>
                    <span className="font-mono font-bold text-sm text-[#B54C44]">
                      ₹{(analytics?.incomeExpenseAnalysis?.expenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#F5F0EA] border border-[#C4A06A]/30">
                    <span className="font-bold text-[#8B6A3D]">(-) Staff Payroll Disbursals:</span>
                    <span className="font-mono font-bold text-sm text-[#8B6A3D]">
                      ₹{(analytics?.incomeExpenseAnalysis?.payroll || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E8DDD8] flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#59283A] block">
                        Net Operating Cash Flow
                      </span>
                      <span className="text-[10px] text-[#82747A]">
                        Operating Margin: {analytics?.incomeExpenseAnalysis?.operatingMargin || 0}%
                      </span>
                    </div>
                    <span
                      className={`font-serif text-xl font-bold ${
                        Number(analytics?.incomeExpenseAnalysis?.netCashFlow || 0) >= 0
                          ? "text-[#32765B]"
                          : "text-[#B54C44]"
                      }`}
                    >
                      ₹{(analytics?.incomeExpenseAnalysis?.netCashFlow || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ANALYTICS 6: Staff Attendance Summary */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8DDD8]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    Analytics 6: Staff Attendance Summary
                  </CardTitle>
                  <CardDescription>
                    Daily roster attendance compliance and workforce presence
                  </CardDescription>
                </div>
                <Badge variant="gold">
                  {analytics?.staffAttendanceSummary?.presentPercentage || 0}% Present Today
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#E7F1E9] rounded-lg border border-[#32765B]/20">
                  <span className="font-bold text-lg text-[#32765B] block">
                    {analytics?.staffAttendanceSummary?.present || 0}
                  </span>
                  <span className="text-[10px] text-[#32765B] uppercase font-bold">Present</span>
                </div>
                <div className="p-2.5 bg-[#F8E8E5] rounded-lg border border-[#B54C44]/20">
                  <span className="font-bold text-lg text-[#B54C44] block">
                    {analytics?.staffAttendanceSummary?.absent || 0}
                  </span>
                  <span className="text-[10px] text-[#B54C44] uppercase font-bold">Absent</span>
                </div>
                <div className="p-2.5 bg-[#E9EFF3] rounded-lg border border-[#627D91]/20">
                  <span className="font-bold text-lg text-[#627D91] block">
                    {analytics?.staffAttendanceSummary?.leave || 0}
                  </span>
                  <span className="text-[10px] text-[#627D91] uppercase font-bold">On Leave</span>
                </div>
              </div>

              <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] text-xs space-y-2">
                <div className="flex justify-between items-center text-[#82747A]">
                  <span>Total Active Personnel:</span>
                  <span className="font-bold text-[#59283A]">
                    {analytics?.staffAttendanceSummary?.activeStaff || 0} Staff
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#82747A]">
                  <span>Unmarked in Roster:</span>
                  <span className="font-bold text-[#A97832]">
                    {analytics?.staffAttendanceSummary?.unmarked || 0} Staff
                  </span>
                </div>
                <div className="w-full bg-[#E8DDD8] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#32765B] h-full rounded-full transition-all"
                    style={{ width: `${analytics?.staffAttendanceSummary?.presentPercentage || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =====================================================================
          4. RECENT RESERVATIONS & LIVE AUDIT TRAIL STREAM
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Recent Bookings Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8DDD8]">
            <div>
              <CardTitle>Recent Reservations</CardTitle>
              <CardDescription>
                Latest customer reservations and front-desk booking entries
              </CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-xs text-[#C4A06A] hover:text-[#59283A]">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#82747A]">
                No bookings recorded yet in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-[#82747A] uppercase bg-[#F5F0EA] border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Booking #</th>
                      <th className="px-5 py-3 font-semibold">Guest</th>
                      <th className="px-5 py-3 font-semibold">Room</th>
                      <th className="px-5 py-3 font-semibold">Dates</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#EFE8E0]/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#C4A06A]">
                          {b.bookingNumber}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#59283A]">
                          <div className="font-bold">{b.guestName}</div>
                          <div className="text-[10px] text-[#82747A]">{b.mobileNumber}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[#59283A]">Room {b.roomNumber}</span>
                          <span className="text-[10px] text-[#82747A] block">{b.roomType}</span>
                        </td>
                        <td className="px-5 py-3.5 text-[#82747A] whitespace-nowrap">
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
                        <td className="px-5 py-3.5 text-right font-bold text-[#59283A]">
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

        {/* Live System Activity Audit Trail */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#E8DDD8]">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C4A06A]" />
              <span>Live Audit Stream</span>
            </CardTitle>
            <CardDescription>
              Chronological state mutations &amp; events
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#82747A]">
                No recent system activity recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2.5 border-b border-[#E8DDD8] last:border-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full bg-[#C4A06A] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#59283A] text-[11px] truncate">
                        {act.description || `${act.action} ${act.entityType}`}
                      </p>
                      <span className="text-[10px] text-[#82747A]">
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

      {/* ========================================================================= */}
      {/* IN-HOUSE GUESTS REGISTRATION DOSSIER MODAL                                */}
      {/* ========================================================================= */}
      <Dialog open={inHouseModalOpen} onOpenChange={setInHouseModalOpen}>
        <DialogContent className="max-w-5xl bg-white max-h-[92vh] overflow-hidden flex flex-col border-[#E8DDD8] shadow-2xl p-0">
          <DialogHeader className="p-5 border-b border-[#E8DDD8] bg-[#F5F0EA]/50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#59283A] text-[#C4A06A] px-2 py-0.5 rounded">
                    Hotel Radha Palace • Live Stay Register
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50">
                    Active In-House Folios
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1.5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C4A06A]" />
                  <span>Currently Staying Guests (Checked-In Roster)</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Complete registration records, room allocation, stay duration, identity proof &amp; contact dossier of all guests currently staying in the hotel.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge className="bg-[#59283A] text-white px-3 py-1 text-xs font-semibold shadow-xs">
                  {inHouseStays.length} Stays • {inHouseStays.reduce((sum, b) => sum + (b.numberOfGuests || 1), 0)} Total Pax
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInHouseModal}
                  disabled={inHouseLoading}
                  className="h-8 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5"
                  title="Refresh live in-house guest data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#C4A06A] ${inHouseLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Quick Search inside Modal */}
            <div className="relative mt-3.5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E7079]" />
              <Input
                placeholder="Search in-house guests by name, mobile, email, room #, booking #, ID number, city..."
                value={inHouseSearch}
                onChange={(e) => setInHouseSearch(e.target.value)}
                className="pl-9 h-9 text-xs border-[#E8DDD8] bg-white rounded-lg shadow-2xs"
              />
            </div>
          </DialogHeader>

          {/* Modal Body: Guest Cards */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#F5F0EA]/20 space-y-4">
            {inHouseLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <LoadingSpinner size="md" text="Loading active in-house guest records..." />
              </div>
            ) : filteredInHouseStays.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DDD8] p-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F5F0EA] flex items-center justify-center mx-auto text-[#C4A06A]">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="text-base font-serif font-bold text-[#59283A]">
                  {inHouseSearch ? "No Guests Match Your Search" : "No Guests Currently Checked In"}
                </h4>
                <p className="text-xs text-[#82747A] max-w-md mx-auto">
                  {inHouseSearch
                    ? `No currently staying guests found matching "${inHouseSearch}". Try searching by a different name, room number or mobile.`
                    : "There are currently 0 active in-house stays recorded in the hotel. Check in guests from the Front Desk Check-In & Check-Out section."}
                </p>
                <div className="pt-2">
                  <Link href="/stays">
                    <Button size="sm" className="bg-[#59283A] hover:bg-[#472130] text-white text-xs">
                      Go to Front Desk Stays →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInHouseStays.map((stay: any) => {
                  const guest = stay.primaryGuest;
                  const room = stay.room;
                  const docs = guest?.documents || [];

                  return (
                    <div
                      key={stay.id}
                      className="bg-white rounded-2xl border border-[#E8DDD8] hover:border-[#C4A06A] shadow-xs hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Top Bar: Room + Status + Booking Reference */}
                      <div className="bg-[#F5F0EA]/70 px-5 py-3 border-b border-[#E8DDD8] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-serif font-bold text-base text-[#59283A] bg-white px-3 py-1 rounded-lg border border-[#C4A06A]/30 shadow-2xs">
                            Room {room?.roomNumber || "N/A"}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-[#59283A] block">
                              {room?.roomType?.name || "Standard Room"} • Floor {room?.floor || "1"}
                            </span>
                            <span className="text-[10px] font-mono text-[#C4A06A]">
                              Ref: {stay.bookingNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            CHECKED IN • IN-HOUSE
                          </span>
                          <span className="text-[11px] text-[#82747A] font-medium hidden sm:inline">
                            Check-In: {stay.actualCheckInAt ? new Date(stay.actualCheckInAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : stay.checkInDate}
                          </span>
                        </div>
                      </div>

                      {/* Main Dossier Grid */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                        {/* Column 1: Primary Guest Identity */}
                        <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-[#E8DDD8] pb-4 md:pb-0 md:pr-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#C4A06A]">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Primary Guest Dossier</span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[#59283A] text-[#C4A06A] flex items-center justify-center font-serif font-bold text-base shrink-0 shadow-xs">
                              {guest?.fullName ? guest.fullName.substring(0, 2).toUpperCase() : "GT"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[#59283A] leading-tight truncate">
                                {guest?.fullName || "Unnamed Guest"}
                              </h4>
                              <div className="text-[10px] font-mono text-[#82747A] mt-0.5">
                                Code: {guest?.guestCode || "N/A"}
                              </div>
                              <div className="text-[11px] text-[#82747A] mt-1 flex items-center gap-2 flex-wrap">
                                <span className="bg-[#F5F0EA] px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#59283A]">
                                  {guest?.gender || "Gender Unspecified"}
                                </span>
                                <span>•</span>
                                <span>{guest?.country || "India"}</span>
                                {guest?.dateOfBirth && (
                                  <>
                                    <span>•</span>
                                    <span>DOB: {new Date(guest.dateOfBirth).toLocaleDateString("en-IN")}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Identity Document / KYC Info */}
                          <div className="pt-2 border-t border-[#E8DDD8]/60 space-y-1.5">
                            <div className="text-[10px] font-bold uppercase text-[#8E7079]">
                              ID Proof (Registration Time)
                            </div>
                            {docs.length > 0 ? (
                              docs.map((doc: any, i: number) => (
                                <div key={i} className="p-2 rounded-lg bg-[#F5F0EA]/60 border border-[#E8DDD8] flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold text-[11px] text-[#59283A] block">
                                      {doc.idType?.replace(/_/g, " ") || "Government ID"}
                                    </span>
                                    <span className="font-mono text-[10px] text-[#82747A]">
                                      {doc.documentNumber || "No number recorded"}
                                    </span>
                                  </div>
                                  <BadgeCheck className="w-4 h-4 text-[#32765B]" />
                                </div>
                              ))
                            ) : (
                              <div className="text-[11px] text-[#82747A] italic bg-[#F5F0EA]/40 p-2 rounded-lg border border-dashed border-[#E8DDD8]">
                                No physical ID document attached at registration.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Contact & Residential Details */}
                        <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-[#E8DDD8] pb-4 md:pb-0 md:pr-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#C4A06A]">
                            <Phone className="w-3.5 h-3.5" />
                            <span>Contact &amp; Address Details</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#F5F0EA] text-[#59283A] flex items-center justify-center shrink-0">
                                <Phone className="w-3 h-3 text-[#C4A06A]" />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#82747A]">Primary Mobile</div>
                                <a
                                  href={`tel:${guest?.mobileNumber}`}
                                  className="font-bold text-xs text-[#59283A] hover:text-[#C4A06A] transition-colors"
                                >
                                  {guest?.mobileNumber || "N/A"}
                                </a>
                              </div>
                            </div>

                            {guest?.alternateMobileNumber && (
                              <div className="flex items-center gap-2 pl-8">
                                <span className="text-[10px] text-[#82747A]">Alt:</span>
                                <span className="text-xs font-medium text-[#59283A]">{guest.alternateMobileNumber}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#F5F0EA] text-[#59283A] flex items-center justify-center shrink-0">
                                <Mail className="w-3 h-3 text-[#C4A06A]" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] text-[#82747A]">Email Address</div>
                                <div className="font-medium text-xs text-[#59283A] truncate">
                                  {guest?.email || "No email registered"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 pt-1 border-t border-[#E8DDD8]/60">
                              <div className="w-6 h-6 rounded-md bg-[#F5F0EA] text-[#59283A] flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-3 h-3 text-[#C4A06A]" />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#82747A]">Residential Address</div>
                                <p className="text-[11px] text-[#59283A] leading-relaxed">
                                  {guest?.address || "Address not provided"}
                                </p>
                                {(guest?.city || guest?.state || guest?.postalCode) && (
                                  <div className="text-[10px] text-[#82747A] font-semibold mt-0.5">
                                    {[guest.city, guest.state, guest.postalCode].filter(Boolean).join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Stay Duration, Tariff & Navigation */}
                        <div className="space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#C4A06A]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Stay Timeline &amp; Tariff</span>
                            </div>

                            <div className="space-y-1.5 p-3 rounded-xl bg-[#F5F0EA]/50 border border-[#E8DDD8]">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-[#82747A]">Stay Duration:</span>
                                <span className="font-bold text-[#59283A]">
                                  {stay.numberOfNights} Night(s) • {stay.numberOfGuests || 1} Pax
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-[#82747A]">Room Rate:</span>
                                <span className="font-bold text-[#59283A] font-mono">
                                  ₹{Number(stay.roomRatePerNight).toLocaleString("en-IN")}/night
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-[#82747A]">Advance Paid:</span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  ₹{Number(stay.advanceAmount || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-[#E8DDD8]">
                                <span className="text-[#82747A]">Expected Departure:</span>
                                <span className="font-bold text-[#59283A]">
                                  {new Date(stay.expectedCheckOutDate).toLocaleDateString("en-IN")} ({stay.expectedCheckOutTime || "11:00 AM"})
                                </span>
                              </div>
                            </div>

                            {stay.notes && (
                              <div className="text-[11px] text-[#82747A] italic bg-[#F5F0EA]/30 p-2 rounded-lg border border-[#E8DDD8]">
                                <span className="font-semibold text-[#59283A] not-italic">Notes: </span>
                                &quot;{stay.notes}&quot;
                              </div>
                            )}

                            {/* Additional Guests if any */}
                            {stay.bookingGuests && stay.bookingGuests.length > 0 && (
                              <div className="pt-1">
                                <div className="text-[10px] font-bold text-[#8E7079] uppercase mb-1">
                                  Accompanying Guests ({stay.bookingGuests.length})
                                </div>
                                <div className="space-y-1">
                                  {stay.bookingGuests.map((bg: any, bIdx: number) => (
                                    <div key={bIdx} className="text-[11px] text-[#59283A] flex items-center justify-between p-1.5 rounded bg-white border border-[#E8DDD8]">
                                      <span className="font-semibold">{bg.guest?.fullName}</span>
                                      <span className="text-[10px] text-[#82747A]">{bg.guest?.mobileNumber}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-2 flex items-center gap-2">
                            <Link href="/stays" className="flex-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-[11px] border-[#59283A]/30 text-[#59283A] hover:bg-[#59283A]/10 font-medium flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <ExternalLink className="w-3 h-3 text-[#C4A06A]" />
                                <span>Stay Folio</span>
                              </Button>
                            </Link>
                            <Link href="/guests" className="flex-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-[11px] border-[#C4A06A]/40 text-[#59283A] hover:bg-[#C4A06A]/10 font-medium flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <UserCheck className="w-3 h-3 text-[#C4A06A]" />
                                <span>Guest Profile</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
