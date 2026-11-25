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
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import {
  DashboardStats,
  DashboardAnalytics,
  RecentBookingItem,
  RecentActivityItem,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuth } from "@/providers/auth-provider";

const DEFAULT_STATS: DashboardStats = {
  rooms: {
    total: 120,
    available: 84,
    occupied: 28,
    maintenance: 3,
    occupancyRate: 23.3,
  },
  stays: {
    todayCheckIns: 4,
    todayCheckOuts: 2,
    activeBookings: 6,
    currentlyStayingGuests: 35,
  },
  guests: {
    total: 12,
    currentlyStaying: 8,
    withDocuments: 10,
  },
  revenue: {
    today: 48500,
    monthly: 385000,
    pendingBalance: 12400,
    currency: "INR",
  },
  expenses: {
    today: 3200,
    monthly: 65000,
    total: 142000,
  },
  staff: {
    total: 14,
    todayAttendance: {
      present: 12,
      absent: 1,
      halfDay: 0,
      leave: 1,
      totalMarked: 13,
      attendanceRate: 92.3,
    },
  },
  payroll: {
    monthlyNetSalary: 115000,
    monthlyDisbursed: 115000,
    pendingBalance: 0,
  },
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";
  const [stats, setStats] = useState<DashboardStats | null>(DEFAULT_STATS);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
                {stats?.rooms.total || 0}
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
                {stats?.rooms.available || 0}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="success">Clean &amp; Ready</Badge>
                {stats?.rooms.maintenance ? (
                  <Badge variant="warning">{stats.rooms.maintenance} Maint.</Badge>
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
                {stats?.rooms.occupied || 0}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary">
                  {stats?.rooms.occupancyRate || 0}% Occupancy
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 4. Currently Staying Guests */}
          <Card className="hover:border-[#C4A06A]/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
              <CardTitle className="text-xs font-bold text-[#82747A] uppercase tracking-wider font-sans">
                4. In-House Guests
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#E9EFF3] text-[#627D91] border border-[#627D91]/20 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-[#59283A]">
                {stats?.stays.currentlyStayingGuests || 0}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                Currently staying guests
              </p>
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
                +{stats?.stays.todayCheckIns || 0}
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
                {stats?.stays.todayCheckOuts || 0}
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
                {isManager ? "••••••" : `₹${(stats?.revenue.today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
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
                {isManager ? "••••••" : `₹${(stats?.revenue.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
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
                {isManager ? "••••••" : `₹${(stats?.revenue.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
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
                {isManager ? "••••••" : `₹${(stats?.expenses.monthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : `This month (All-time: ₹${(stats?.expenses.total || 0).toLocaleString("en-IN")})`}
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
                {stats?.staff.total || 0}
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
                  {stats?.staff.todayAttendance.present || 0}
                </span>
                <span className="text-xs text-[#82747A]">
                  / {stats?.staff.total || 0} Present ({stats?.staff.todayAttendance.attendanceRate || 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                <span className="text-rose-700">{stats?.staff.todayAttendance.absent || 0} Absent</span>
                <span>•</span>
                <span className="text-amber-700">{stats?.staff.todayAttendance.halfDay || 0} Half-day</span>
                <span>•</span>
                <span className="text-blue-700">{stats?.staff.todayAttendance.leave || 0} Leave</span>
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
                {isManager ? "••••••" : `₹${(stats?.payroll.monthlyNetSalary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[11px] text-[#82747A] mt-1 font-medium">
                {isManager ? "Owner Confidential" : `Paid: ₹${(stats?.payroll.monthlyDisbursed || 0).toLocaleString("en-IN")} • Due: ₹${(stats?.payroll.pendingBalance || 0).toLocaleString("en-IN")}`}
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
                {analytics?.dailyRevenue.map((d) => {
                  const maxDaily = Math.max(...(analytics?.dailyRevenue.map((x) => x.revenue) || [1]), 1000);
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
                <Badge variant="secondary">Monthly Ledger</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-[#E8DDD8]">
                {analytics?.monthlyRevenue.map((m) => (
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
                  {stats?.rooms.occupancyRate || 0}% Property Occupancy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {analytics?.roomOccupancy.map((ro) => (
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
                    {analytics?.guestStats.totalGuests || 0}
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
                    {analytics?.guestStats.currentlyStaying || 0}
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
                    {analytics?.guestStats.withDocuments || 0} / {analytics?.guestStats.totalGuests || 0}
                  </span>
                </div>
                <div className="w-full bg-[#E8DDD8] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#32765B] h-full rounded-full"
                    style={{
                      width: `${
                        (analytics?.guestStats.totalGuests || 0) > 0
                          ? Math.round(
                              ((analytics?.guestStats.withDocuments || 0) /
                                (analytics?.guestStats.totalGuests || 1)) *
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
                    +{analytics?.guestStats.newThisMonth || 0}
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
                <Badge variant={Number(analytics?.incomeExpenseAnalysis.netCashFlow || 0) >= 0 ? "success" : "destructive"}>
                  {Number(analytics?.incomeExpenseAnalysis.netCashFlow || 0) >= 0 ? "Net Positive" : "Deficit"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#E7F1E9]/50 border border-[#32765B]/20">
                <span className="font-bold text-[#32765B]">Monthly Gross Revenue:</span>
                <span className="font-mono font-bold text-sm text-[#32765B]">
                  ₹{(analytics?.incomeExpenseAnalysis.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#F8E8E5]/50 border border-[#B54C44]/20">
                <span className="font-bold text-[#B54C44]">(-) Operational Hotel Expenses:</span>
                <span className="font-mono font-bold text-sm text-[#B54C44]">
                  ₹{(analytics?.incomeExpenseAnalysis.expenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#F5F0EA] border border-[#C4A06A]/30">
                <span className="font-bold text-[#8B6A3D]">(-) Staff Payroll Disbursals:</span>
                <span className="font-mono font-bold text-sm text-[#8B6A3D]">
                  ₹{(analytics?.incomeExpenseAnalysis.payroll || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E8DDD8] flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-bold text-[#59283A] block">
                    Net Operating Cash Flow
                  </span>
                  <span className="text-[10px] text-[#82747A]">
                    Operating Margin: {analytics?.incomeExpenseAnalysis.operatingMargin || 0}%
                  </span>
                </div>
                <span
                  className={`font-serif text-xl font-bold ${
                    Number(analytics?.incomeExpenseAnalysis.netCashFlow || 0) >= 0
                      ? "text-[#32765B]"
                      : "text-[#B54C44]"
                  }`}
                >
                  ₹{(analytics?.incomeExpenseAnalysis.netCashFlow || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
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
                  {analytics?.staffAttendanceSummary.presentPercentage || 0}% Present Today
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#E7F1E9] rounded-lg border border-[#32765B]/20">
                  <span className="font-bold text-lg text-[#32765B] block">
                    {analytics?.staffAttendanceSummary.present || 0}
                  </span>
                  <span className="text-[10px] text-[#32765B] uppercase font-bold">Present</span>
                </div>
                <div className="p-2.5 bg-[#F8E8E5] rounded-lg border border-[#B54C44]/20">
                  <span className="font-bold text-lg text-[#B54C44] block">
                    {analytics?.staffAttendanceSummary.absent || 0}
                  </span>
                  <span className="text-[10px] text-[#B54C44] uppercase font-bold">Absent</span>
                </div>
                <div className="p-2.5 bg-[#F6EDDC] rounded-lg border border-[#A97832]/20">
                  <span className="font-bold text-lg text-[#A97832] block">
                    {analytics?.staffAttendanceSummary.halfDay || 0}
                  </span>
                  <span className="text-[10px] text-[#A97832] uppercase font-bold">Half Day</span>
                </div>
                <div className="p-2.5 bg-[#E9EFF3] rounded-lg border border-[#627D91]/20">
                  <span className="font-bold text-lg text-[#627D91] block">
                    {analytics?.staffAttendanceSummary.leave || 0}
                  </span>
                  <span className="text-[10px] text-[#627D91] uppercase font-bold">On Leave</span>
                </div>
              </div>

              <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] text-xs space-y-2">
                <div className="flex justify-between items-center text-[#82747A]">
                  <span>Total Active Personnel:</span>
                  <span className="font-bold text-[#59283A]">
                    {analytics?.staffAttendanceSummary.activeStaff || 0} Staff
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#82747A]">
                  <span>Unmarked in Roster:</span>
                  <span className="font-bold text-[#A97832]">
                    {analytics?.staffAttendanceSummary.unmarked || 0} Staff
                  </span>
                </div>
                <div className="w-full bg-[#E8DDD8] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#32765B] h-full rounded-full transition-all"
                    style={{ width: `${analytics?.staffAttendanceSummary.presentPercentage || 0}%` }}
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
    </div>
  );
}
