"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Filter,
  Search,
  Edit2,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  FileSpreadsheet,
  CheckCheck,
  SunMedium,
  Coffee,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import {
  attendanceService,
  DailyRegisterResponse,
  MonthlyMatrixResponse,
  MonthlyStaffRow,
} from "@/services/attendance.service";
import { staffService } from "@/services/staff.service";
import { Attendance, Staff } from "@/types";
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

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; code: string; color: string }
> = {
  PRESENT: {
    label: "Present",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    code: "P",
    color: "#059669",
  },
  ABSENT: {
    label: "Absent",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    code: "A",
    color: "#E11D48",
  },
  HALF_DAY: {
    label: "Half Day",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    code: "HD",
    color: "#D97706",
  },
  LEAVE: {
    label: "Leave",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    code: "L",
    color: "#2563EB",
  },
  WEEKLY_OFF: {
    label: "Weekly Off",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    code: "WO",
    color: "#7C3AED",
  },
};

const DEPARTMENTS = [
  "ALL",
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Kitchen & Culinary",
  "Maintenance & Engineering",
  "Security",
  "Administration",
  "Accounts & Finance",
  "Spa & Wellness",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendancePage() {
  // Main Navigation Tabs: 'daily' | 'monthly' | 'history'
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "history">("daily");

  // Daily View State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [dailyData, setDailyData] = useState<DailyRegisterResponse | null>(null);

  // Monthly Matrix View State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyDepartment, setMonthlyDepartment] = useState("ALL");
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyMatrixResponse | null>(null);

  // Individual Staff History State
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [staffHistoryDateRange, setStaffHistoryDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [staffHistory, setStaffHistory] = useState<Attendance[]>([]);

  // Detailed Single Attendance Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [activeAttendance, setActiveAttendance] = useState<Attendance | null>(null);
  const [activeAttendanceDate, setActiveAttendanceDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    status: "PRESENT" as "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF",
    checkInTime: "09:00 AM",
    checkOutTime: "06:00 PM",
    workingHours: 8,
    overtimeHours: 0,
    notes: "",
  });

  // Bulk Attendance Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    attendanceDate: new Date().toISOString().split("T")[0],
    attendanceStatus: "PRESENT" as "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF",
    department: "ALL",
    checkInTime: "09:00 AM",
    checkOutTime: "06:00 PM",
    notes: "Bulk marked by Administrator",
  });

  // Load Active Staff list once for selectors
  useEffect(() => {
    staffService
      .findAll({ limit: 100, employmentStatus: "ACTIVE" })
      .then((res) => {
        setAllStaff(res.items || []);
        if (res.items.length > 0 && !selectedStaffId) {
          setSelectedStaffId(res.items[0].id);
        }
      })
      .catch((err) => console.warn("Staff fetch error:", err));
  }, []);

  // Fetch Daily Register Data
  const fetchDailyRegister = async () => {
    try {
      setLoadingDaily(true);
      const res = await attendanceService.getDailyRegister(
        selectedDate,
        department !== "ALL" ? department : undefined,
      );
      setDailyData(res);
    } catch (err) {
      toast.error("Failed to load daily attendance register");
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyRegister();
    }
  }, [selectedDate, department, activeTab]);

  // Fetch Monthly Matrix Data
  const fetchMonthlyMatrix = async () => {
    try {
      setLoadingMonthly(true);
      const res = await attendanceService.getMonthlyMatrix(
        selectedYear,
        selectedMonth,
        monthlyDepartment !== "ALL" ? monthlyDepartment : undefined,
      );
      setMonthlyData(res);
    } catch (err) {
      toast.error("Failed to load monthly attendance records");
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (activeTab === "monthly") {
      fetchMonthlyMatrix();
    }
  }, [selectedYear, selectedMonth, monthlyDepartment, activeTab]);

  // Fetch Individual Staff History
  const fetchStaffHistory = async () => {
    if (!selectedStaffId) return;
    try {
      setLoadingHistory(true);
      const res = await attendanceService.getStaffHistory(selectedStaffId, {
        startDate: staffHistoryDateRange.startDate,
        endDate: staffHistoryDateRange.endDate,
        status: historyStatusFilter !== "ALL" ? historyStatusFilter : undefined,
        limit: 100,
      });
      setStaffHistory(res.items || []);
    } catch (err) {
      toast.error("Failed to load staff attendance history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && selectedStaffId) {
      fetchStaffHistory();
    }
  }, [selectedStaffId, staffHistoryDateRange, historyStatusFilter, activeTab]);

  // Quick 1-Click Status Mark for Daily Tab
  const handleQuickStatus = async (
    staff: Staff,
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF",
    targetDate: string = selectedDate,
  ) => {
    try {
      await attendanceService.markAttendance({
        staffId: staff.id,
        attendanceDate: targetDate,
        attendanceStatus: status,
        checkInTime: status === "PRESENT" ? "09:00 AM" : status === "HALF_DAY" ? "09:00 AM" : undefined,
        checkOutTime: status === "PRESENT" ? "06:00 PM" : status === "HALF_DAY" ? "01:00 PM" : undefined,
        workingHours: status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : 0,
        overtimeHours: 0,
        notes: `Quick marked as ${STATUS_CONFIG[status].label}`,
      });
      toast.success(`${staff.fullName} marked as ${STATUS_CONFIG[status].label}`);
      if (activeTab === "daily") fetchDailyRegister();
      if (activeTab === "monthly") fetchMonthlyMatrix();
      if (activeTab === "history") fetchStaffHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  // Open Detailed Edit Modal
  const handleOpenDetailedModal = (
    staff: Staff,
    attendance: Attendance | null,
    targetDate: string = selectedDate,
  ) => {
    setActiveStaff(staff);
    setActiveAttendance(attendance);
    setActiveAttendanceDate(targetDate);
    setEditForm({
      status: attendance?.attendanceStatus || "PRESENT",
      checkInTime: attendance?.checkInTime || "09:00 AM",
      checkOutTime: attendance?.checkOutTime || "06:00 PM",
      workingHours:
        attendance?.workingHours !== undefined && attendance?.workingHours !== null
          ? Number(attendance.workingHours)
          : 8,
      overtimeHours: attendance?.overtimeHours !== undefined ? Number(attendance.overtimeHours) : 0,
      notes: attendance?.notes || "",
    });
    setEditModalOpen(true);
  };

  // Save Detailed Modal
  const handleSaveDetailed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    try {
      setSubmitting(true);
      await attendanceService.markAttendance({
        staffId: activeStaff.id,
        attendanceDate: activeAttendanceDate || selectedDate,
        attendanceStatus: editForm.status,
        checkInTime: editForm.checkInTime,
        checkOutTime: editForm.checkOutTime,
        workingHours: Number(editForm.workingHours),
        overtimeHours: Number(editForm.overtimeHours),
        notes: editForm.notes,
      });
      toast.success(`Attendance updated for ${activeStaff.fullName}`);
      setEditModalOpen(false);
      if (activeTab === "daily") fetchDailyRegister();
      if (activeTab === "monthly") fetchMonthlyMatrix();
      if (activeTab === "history") fetchStaffHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Attendance Submit
  const handleConfirmBulkMark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await attendanceService.bulkMarkAttendance({
        attendanceDate: bulkForm.attendanceDate,
        attendanceStatus: bulkForm.attendanceStatus,
        department: bulkForm.department !== "ALL" ? bulkForm.department : undefined,
        checkInTime: bulkForm.attendanceStatus === "PRESENT" ? bulkForm.checkInTime : undefined,
        checkOutTime: bulkForm.attendanceStatus === "PRESENT" ? bulkForm.checkOutTime : undefined,
        notes: bulkForm.notes,
      });
      toast.success(`Bulk attendance recorded for ${res.count} staff members!`);
      setBulkModalOpen(false);
      if (activeTab === "daily") fetchDailyRegister();
      if (activeTab === "monthly") fetchMonthlyMatrix();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process bulk attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Date Navigation Helpers
  const handleDateShift = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleMonthShift = (delta: number) => {
    let nextMonth = selectedMonth + delta;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  // Filtered Register for Daily Tab
  const filteredDailyRegister = (dailyData?.register || []).filter((item) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      item.staff.fullName.toLowerCase().includes(s) ||
      item.staff.employeeCode.toLowerCase().includes(s) ||
      item.staff.department.toLowerCase().includes(s) ||
      item.staff.designation.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E3D9CA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08A60] bg-[#EEE7DA] px-2.5 py-0.5 rounded-full">
              Workforce Operations • Module 10
            </span>
            <span className="text-xs text-[#79695B]">• Daily & Monthly Staff Attendance</span>
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#362A22] mt-1">
            Staff Attendance Management
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Admin manual attendance management, daily check-in / check-out times, overtime tracking, and full monthly records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => {
              setBulkForm((prev) => ({
                ...prev,
                attendanceDate: selectedDate,
              }));
              setBulkModalOpen(true);
            }}
            className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 text-xs h-9 px-3.5 shadow-sm"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Bulk Mark Attendance</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs border-[#E3D9CA] text-[#79695B] hover:text-[#362A22]"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
            <span>Print Sheet</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#E3D9CA] pb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "daily"
                ? "bg-[#362A22] text-white shadow-sm border-b-2 border-[#B08A60]"
                : "text-[#79695B] hover:text-[#362A22] hover:bg-[#EEE7DA]/50"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "monthly"
                ? "bg-[#362A22] text-white shadow-sm border-b-2 border-[#B08A60]"
                : "text-[#79695B] hover:text-[#362A22] hover:bg-[#EEE7DA]/50"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Monthly Records & Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-[#362A22] text-white shadow-sm border-b-2 border-[#B08A60]"
                : "text-[#79695B] hover:text-[#362A22] hover:bg-[#EEE7DA]/50"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Employee Attendance Dossier</span>
          </button>
        </div>

        {/* Status Legend */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#79695B]">
          <span className="font-semibold text-[#362A22]">Legend:</span>
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <span key={k} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span>{cfg.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE REGISTER                                          */}
      {/* ========================================================================= */}
      {activeTab === "daily" && (
        <div className="space-y-5">
          {/* Daily Date Selector & Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm">
            {/* Date Nav Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateShift(-1)}
                className="h-8 w-8 p-0 border-[#E3D9CA]"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#79695B]" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 h-8 text-xs font-mono font-medium border-[#E3D9CA] bg-[#F7F4EE]/50 focus:bg-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateShift(1)}
                className="h-8 w-8 p-0 border-[#E3D9CA]"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#79695B]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="h-8 px-2.5 text-xs border-[#E3D9CA] text-[#362A22]"
              >
                Today
              </Button>
              <span className="text-xs font-serif font-bold text-[#362A22] ml-2 hidden sm:inline">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Department Filter & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#79695B]">Dept:</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="text-xs border border-[#E3D9CA] rounded-md px-2.5 py-1.5 bg-[#F7F4EE] text-[#362A22] focus:outline-none focus:ring-1 focus:ring-[#B08A60]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#79695B] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search staff name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-[#E3D9CA]"
                />
              </div>
            </div>
          </div>

          {/* 6 KPI Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="border-[#E3D9CA] shadow-sm bg-white">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-[#79695B] block">Total Staff</span>
                <span className="text-2xl font-bold font-serif text-[#362A22]">
                  {dailyData?.stats.totalStaff || 0}
                </span>
                <span className="text-[10px] text-[#948779] block mt-0.5">Active Workforce</span>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 shadow-sm bg-emerald-50/40">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present</span>
                <span className="text-2xl font-bold font-serif text-emerald-700">
                  {dailyData?.stats.present || 0}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">On Duty Today</span>
              </CardContent>
            </Card>

            <Card className="border-rose-200 shadow-sm bg-rose-50/40">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent</span>
                <span className="text-2xl font-bold font-serif text-rose-700">
                  {dailyData?.stats.absent || 0}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Unexcused</span>
              </CardContent>
            </Card>

            <Card className="border-amber-200 shadow-sm bg-amber-50/40">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Half Day</span>
                <span className="text-2xl font-bold font-serif text-amber-700">
                  {dailyData?.stats.halfDay || 0}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">4h Shift</span>
              </CardContent>
            </Card>

            <Card className="border-blue-200 shadow-sm bg-blue-50/40">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Approved Leave</span>
                <span className="text-2xl font-bold font-serif text-blue-700">
                  {dailyData?.stats.leave || 0}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Sanctioned</span>
              </CardContent>
            </Card>

            <Card className="border-purple-200 shadow-sm bg-purple-50/40">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Weekly Off</span>
                <span className="text-2xl font-bold font-serif text-purple-700">
                  {dailyData?.stats.weeklyOff || 0}
                </span>
                <span className="text-[10px] text-purple-600 block mt-0.5">Roster Rests</span>
              </CardContent>
            </Card>
          </div>

          {/* Daily Attendance Register Table */}
          <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#EAE3D8] bg-[#F7F4EE]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#362A22]">
                  Daily Roster for {selectedDate}
                </CardTitle>
                <CardDescription className="text-xs text-[#79695B]">
                  Click on any status pill to quick-mark attendance or edit individual shift hours.
                </CardDescription>
              </div>

              {dailyData && dailyData.stats.unmarked > 0 && (
                <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                  {dailyData.stats.unmarked} staff pending attendance
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {loadingDaily ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner className="w-8 h-8 text-[#B08A60] mb-2" />
                  <span className="text-xs text-[#79695B]">Loading daily staff register...</span>
                </div>
              ) : filteredDailyRegister.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[#B08A60] opacity-40" />
                  <p className="font-semibold text-[#362A22]">No staff members found matching criteria.</p>
                  <p>Check your department or search filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role & Dept</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Quick Actions (P / A / HD / L / WO)</th>
                        <th className="px-4 py-3">Working Hours</th>
                        <th className="px-4 py-3">Shift Timings</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {filteredDailyRegister.map((item) => {
                        const att = item.attendance;
                        const cfg = att ? STATUS_CONFIG[att.attendanceStatus] : null;

                        return (
                          <tr key={item.staff.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                            <td className="px-4 py-3 font-medium text-[#362A22]">
                              <div className="font-semibold">{item.staff.fullName}</div>
                              <div className="text-[11px] text-[#B08A60] font-mono">
                                {item.staff.employeeCode}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#362A22]">{item.staff.designation}</div>
                              <div className="text-[11px] text-[#79695B]">{item.staff.department}</div>
                            </td>
                            <td className="px-4 py-3">
                              {cfg ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                >
                                  {cfg.label}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-[#79695B] bg-[#F7F4EE] border-[#E3D9CA]"
                                >
                                  UNMARKED
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WEEKLY_OFF"] as const).map((st) => {
                                  const isCurrent = att?.attendanceStatus === st;
                                  const statusCfg = STATUS_CONFIG[st];
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleQuickStatus(item.staff, st)}
                                      className={`h-6 px-2 rounded text-[10px] font-bold border transition-all ${
                                        isCurrent
                                          ? "bg-[#362A22] text-white border-[#362A22] shadow-xs"
                                          : "bg-white hover:bg-[#EEE7DA] text-[#79695B] border-[#E3D9CA]"
                                      }`}
                                      title={`Mark as ${statusCfg.label}`}
                                    >
                                      {statusCfg.code}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {att ? (
                                <span>
                                  <strong className="text-[#362A22]">{Number(att.workingHours || 0)}h</strong>
                                  {Number(att.overtimeHours) > 0 && (
                                    <span className="text-amber-700 font-semibold ml-1.5 bg-amber-50 px-1 py-0.5 rounded text-[10px]">
                                      +{Number(att.overtimeHours)}h OT
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[#948779]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#79695B] text-[11px]">
                              {att && att.checkInTime ? (
                                <span className="font-mono">
                                  {att.checkInTime} → {att.checkOutTime || "Pending"}
                                </span>
                              ) : (
                                <span className="text-[#948779]">Not recorded</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#79695B] text-[11px] max-w-[150px] truncate">
                              {att?.notes || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetailedModal(item.staff, att, selectedDate)}
                                className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                                title="Edit Check-In, Check-Out, and Hours"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                <span>Edit</span>
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
      {/* TAB 2: MONTHLY RECORDS & MATRIX                                           */}
      {/* ========================================================================= */}
      {activeTab === "monthly" && (
        <div className="space-y-5">
          {/* Month & Department Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthShift(-1)}
                className="h-8 w-8 p-0 border-[#E3D9CA]"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#79695B]" />
              </Button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-8 text-xs font-semibold border border-[#E3D9CA] rounded-md px-2.5 bg-[#F7F4EE] text-[#362A22]"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-8 text-xs font-mono font-semibold border border-[#E3D9CA] rounded-md px-2 bg-[#F7F4EE] text-[#362A22]"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthShift(1)}
                className="h-8 w-8 p-0 border-[#E3D9CA]"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#79695B]" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                }}
                className="h-8 px-2.5 text-xs border-[#E3D9CA] text-[#362A22]"
              >
                Current Month
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#79695B]">Department:</span>
              <select
                value={monthlyDepartment}
                onChange={(e) => setMonthlyDepartment(e.target.value)}
                className="text-xs border border-[#E3D9CA] rounded-md px-2.5 py-1.5 bg-[#F7F4EE] text-[#362A22] focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly KPI Stats Strip */}
          {monthlyData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="border-[#E3D9CA] shadow-sm bg-white">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Staff Enrolled</span>
                  <span className="text-2xl font-bold font-serif text-[#362A22]">
                    {monthlyData.overallStats.totalStaff}
                  </span>
                  <span className="text-[10px] text-[#948779] block mt-0.5">
                    {monthlyData.daysInMonth} Days in Month
                  </span>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 shadow-sm bg-emerald-50/40">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Present</span>
                  <span className="text-2xl font-bold font-serif text-emerald-700">
                    {monthlyData.overallStats.totalPresent}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Duty Days</span>
                </CardContent>
              </Card>

              <Card className="border-rose-200 shadow-sm bg-rose-50/40">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Absences</span>
                  <span className="text-2xl font-bold font-serif text-rose-700">
                    {monthlyData.overallStats.totalAbsent}
                  </span>
                  <span className="text-[10px] text-rose-600 block mt-0.5">Unexcused</span>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-sm bg-amber-50/40">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Half Days</span>
                  <span className="text-2xl font-bold font-serif text-amber-700">
                    {monthlyData.overallStats.totalHalfDay}
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">Half Shifts</span>
                </CardContent>
              </Card>

              <Card className="border-blue-200 shadow-sm bg-blue-50/40">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Leaves</span>
                  <span className="text-2xl font-bold font-serif text-blue-700">
                    {monthlyData.overallStats.totalLeave}
                  </span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Sanctioned</span>
                </CardContent>
              </Card>

              <Card className="border-[#E3D9CA] shadow-sm bg-[#F7F4EE]">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Total Overtime</span>
                  <span className="text-2xl font-bold font-serif text-[#362A22]">
                    {monthlyData.overallStats.totalOvertimeHours}h
                  </span>
                  <span className="text-[10px] text-[#79695B] block mt-0.5">
                    {monthlyData.overallStats.totalWorkingHours}h total worked
                  </span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Attendance Matrix Grid */}
          <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#EAE3D8] bg-[#F7F4EE]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#362A22]">
                  Monthly Matrix: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription className="text-xs text-[#79695B]">
                  Click on any day cell to view or modify an employee&apos;s record for that specific date.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#79695B]">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> P: Present
                <span className="w-2 h-2 rounded-full bg-rose-600 ml-2" /> A: Absent
                <span className="w-2 h-2 rounded-full bg-amber-600 ml-2" /> HD: Half Day
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-2" /> L: Leave
                <span className="w-2 h-2 rounded-full bg-purple-600 ml-2" /> WO: Off
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMonthly ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner className="w-8 h-8 text-[#B08A60] mb-2" />
                  <span className="text-xs text-[#79695B]">Generating monthly attendance matrix...</span>
                </div>
              ) : !monthlyData || monthlyData.staffRows.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-[#B08A60] opacity-40" />
                  <p className="font-semibold text-[#362A22]">No staff attendance data found for this month.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[10px] font-semibold sticky top-0 z-20 shadow-xs border-b border-[#E3D9CA]">
                      <tr>
                        <th className="px-3 py-2.5 sticky left-0 bg-[#F7F4EE] z-30 min-w-[160px] border-r border-[#E3D9CA]">
                          Staff Member
                        </th>
                        {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => (
                          <th key={d} className="px-1.5 py-2 text-center min-w-[28px] border-r border-[#EAE3D8]">
                            {d}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-emerald-800 bg-emerald-50/50">P</th>
                        <th className="px-2 py-2 text-center text-rose-800 bg-rose-50/50">A</th>
                        <th className="px-2 py-2 text-center text-amber-800 bg-amber-50/50">HD</th>
                        <th className="px-2 py-2 text-center text-blue-800 bg-blue-50/50">L</th>
                        <th className="px-2 py-2 text-center text-purple-800 bg-purple-50/50">WO</th>
                        <th className="px-2.5 py-2 text-center font-bold text-[#362A22]">Hours</th>
                        <th className="px-2.5 py-2 text-center font-bold text-amber-700">OT</th>
                        <th className="px-3 py-2 text-center font-bold text-[#362A22]">Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {monthlyData.staffRows.map((row) => (
                        <tr key={row.staff.id} className="hover:bg-[#F7F4EE]/50 transition-colors">
                          {/* Frozen Left Staff Info */}
                          <td className="px-3 py-2 sticky left-0 bg-white hover:bg-[#F7F4EE]/50 z-10 border-r border-[#E3D9CA]">
                            <div className="font-semibold text-[#362A22] truncate max-w-[150px]">
                              {row.staff.fullName}
                            </div>
                            <div className="text-[10px] text-[#79695B] font-mono flex items-center gap-1">
                              <span className="text-[#B08A60] font-bold">{row.staff.employeeCode}</span>
                              <span>• {row.staff.department}</span>
                            </div>
                          </td>

                          {/* Days 1..N Cells */}
                          {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => {
                            const rec = row.dailyRecords[d];
                            const cfg = rec ? STATUS_CONFIG[rec.status] : null;
                            const targetDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

                            return (
                              <td
                                key={d}
                                onClick={() => handleOpenDetailedModal(row.staff, rec as any, targetDateStr)}
                                className="px-0.5 py-1 text-center cursor-pointer border-r border-[#EAE3D8] hover:bg-[#EEE7DA]"
                                title={`${row.staff.fullName} - Day ${d}: ${cfg ? cfg.label : "Unmarked"}`}
                              >
                                {cfg ? (
                                  <span
                                    className={`inline-block w-5 h-5 text-[10px] font-bold rounded flex items-center justify-center ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                                  >
                                    {cfg.code}
                                  </span>
                                ) : (
                                  <span className="inline-block w-5 h-5 text-[10px] text-[#C4B9AA] flex items-center justify-center">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Summary Totals */}
                          <td className="px-2 py-2 text-center font-bold font-mono text-emerald-700 bg-emerald-50/30">
                            {row.summary.presentCount}
                          </td>
                          <td className="px-2 py-2 text-center font-bold font-mono text-rose-700 bg-rose-50/30">
                            {row.summary.absentCount}
                          </td>
                          <td className="px-2 py-2 text-center font-bold font-mono text-amber-700 bg-amber-50/30">
                            {row.summary.halfDayCount}
                          </td>
                          <td className="px-2 py-2 text-center font-bold font-mono text-blue-700 bg-blue-50/30">
                            {row.summary.leaveCount}
                          </td>
                          <td className="px-2 py-2 text-center font-bold font-mono text-purple-700 bg-purple-50/30">
                            {row.summary.weeklyOffCount}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-bold text-[#362A22]">
                            {row.summary.totalWorkingHours}h
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-bold text-amber-700">
                            {row.summary.totalOvertimeHours > 0 ? `${row.summary.totalOvertimeHours}h` : "-"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-1.5 py-0.5 ${
                                row.summary.attendanceRate >= 85
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : row.summary.attendanceRate >= 65
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {row.summary.attendanceRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE ATTENDANCE DOSSIER                                        */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-5">
          {/* Employee & Date Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#79695B]">Select Staff:</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="text-xs font-semibold border border-[#E3D9CA] rounded-md px-2.5 py-1.5 bg-[#F7F4EE] text-[#362A22] min-w-[220px]"
              >
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeCode}) • {s.department}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-[#79695B] ml-2">From:</span>
              <Input
                type="date"
                value={staffHistoryDateRange.startDate}
                onChange={(e) =>
                  setStaffHistoryDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-36 h-8 text-xs border-[#E3D9CA]"
              />

              <span className="text-xs font-semibold text-[#79695B]">To:</span>
              <Input
                type="date"
                value={staffHistoryDateRange.endDate}
                onChange={(e) =>
                  setStaffHistoryDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-36 h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#79695B]">Status:</span>
              {["ALL", "PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WEEKLY_OFF"].map((st) => (
                <button
                  key={st}
                  onClick={() => setHistoryStatusFilter(st)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    historyStatusFilter === st
                      ? "bg-[#362A22] text-white font-semibold"
                      : "bg-[#F7F4EE] text-[#79695B] hover:bg-[#EEE7DA] border border-[#E3D9CA]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Staff Profile Dossier Card */}
          {(() => {
            const currentStaff = allStaff.find((s) => s.id === selectedStaffId);
            if (!currentStaff) return null;

            const presentCount = staffHistory.filter((h) => h.attendanceStatus === "PRESENT").length;
            const absentCount = staffHistory.filter((h) => h.attendanceStatus === "ABSENT").length;
            const halfDayCount = staffHistory.filter((h) => h.attendanceStatus === "HALF_DAY").length;
            const leaveCount = staffHistory.filter((h) => h.attendanceStatus === "LEAVE").length;
            const totalHours = staffHistory.reduce((sum, h) => sum + Number(h.workingHours || 0), 0);
            const totalOT = staffHistory.reduce((sum, h) => sum + Number(h.overtimeHours || 0), 0);

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-[#E3D9CA] shadow-sm bg-white md:col-span-1">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#362A22] text-[#EEE7DA] flex items-center justify-center font-serif font-bold text-base shadow-inner">
                        {currentStaff.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#362A22]">
                          {currentStaff.fullName}
                        </h3>
                        <p className="font-mono text-[11px] text-[#B08A60] font-semibold">
                          {currentStaff.employeeCode}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F2EADF] text-xs space-y-1.5 text-[#79695B]">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <strong className="text-[#362A22]">{currentStaff.department}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Designation:</span>
                        <strong className="text-[#362A22]">{currentStaff.designation}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Salary:</span>
                        <strong className="text-[#362A22] font-mono">
                          ₹{Number(currentStaff.monthlySalary).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile:</span>
                        <span className="font-mono text-[#362A22]">{currentStaff.mobileNumber}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Card className="border-emerald-200 shadow-sm bg-emerald-50/40">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present Days</span>
                      <span className="text-2xl font-bold font-serif text-emerald-700">{presentCount}</span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">In Date Range</span>
                    </CardContent>
                  </Card>

                  <Card className="border-rose-200 shadow-sm bg-rose-50/40">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent Days</span>
                      <span className="text-2xl font-bold font-serif text-rose-700">{absentCount}</span>
                      <span className="text-[10px] text-rose-600 block mt-0.5">Unexcused</span>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 shadow-sm bg-amber-50/40">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Half Days</span>
                      <span className="text-2xl font-bold font-serif text-amber-700">{halfDayCount}</span>
                      <span className="text-[10px] text-amber-600 block mt-0.5">4h Shifts</span>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 shadow-sm bg-blue-50/40">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Leaves Taken</span>
                      <span className="text-2xl font-bold font-serif text-blue-700">{leaveCount}</span>
                      <span className="text-[10px] text-blue-600 block mt-0.5">Approved</span>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E3D9CA] shadow-sm bg-[#F7F4EE]">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#79695B] block">Total Overtime</span>
                      <span className="text-2xl font-bold font-serif text-[#362A22]">{totalOT}h</span>
                      <span className="text-[10px] text-[#79695B] block mt-0.5">{totalHours}h worked</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* History Ledger Table */}
          <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#EAE3D8] bg-[#F7F4EE]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#362A22]">
                  Attendance History Log ({staffHistory.length} records)
                </CardTitle>
                <CardDescription className="text-xs text-[#79695B]">
                  Chronological log of check-in, check-out, working hours, and notes.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner className="w-8 h-8 text-[#B08A60] mb-2" />
                  <span className="text-xs text-[#79695B]">Loading attendance history...</span>
                </div>
              ) : staffHistory.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#79695B] space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-[#B08A60] opacity-40" />
                  <p className="font-semibold text-[#362A22]">No attendance records found for this period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Check-In Time</th>
                        <th className="px-4 py-3">Check-Out Time</th>
                        <th className="px-4 py-3">Working Hours</th>
                        <th className="px-4 py-3">Overtime</th>
                        <th className="px-4 py-3">Remarks / Reason</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {staffHistory.map((h) => {
                        const cfg = STATUS_CONFIG[h.attendanceStatus];
                        const dateFormatted = new Date(h.attendanceDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        const currentStaff = allStaff.find((s) => s.id === selectedStaffId);

                        return (
                          <tr key={h.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[#362A22] font-mono">
                              {dateFormatted}
                            </td>
                            <td className="px-4 py-3">
                              {cfg && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                >
                                  {cfg.label}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#362A22]">
                              {h.checkInTime || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#362A22]">
                              {h.checkOutTime || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#362A22]">
                              {Number(h.workingHours || 0)}h
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {Number(h.overtimeHours) > 0 ? (
                                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                  +{Number(h.overtimeHours)}h OT
                                </span>
                              ) : (
                                <span className="text-[#948779]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#79695B] max-w-[200px] truncate">
                              {h.notes || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {currentStaff && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDetailedModal(
                                      currentStaff,
                                      h,
                                      new Date(h.attendanceDate).toISOString().split("T")[0],
                                    )
                                  }
                                  className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED ATTENDANCE MODAL (CHECK-IN / OUT / HOURS / NOTES)                */}
      {/* ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded w-fit">
              Attendance Record Correction
            </span>
            <DialogTitle className="text-lg font-serif font-bold text-[#362A22] mt-1">
              {activeStaff?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B] font-mono">
              {activeStaff?.employeeCode} • Date: {activeAttendanceDate || selectedDate}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDetailed} className="space-y-3.5 pt-2 text-xs">
            {/* Status Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Attendance Status *</label>
              <select
                value={editForm.status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setEditForm((prev) => ({
                    ...prev,
                    status: newStatus,
                    workingHours: newStatus === "PRESENT" ? 8 : newStatus === "HALF_DAY" ? 4 : 0,
                    overtimeHours: newStatus === "PRESENT" ? prev.overtimeHours : 0,
                    checkInTime: newStatus === "PRESENT" || newStatus === "HALF_DAY" ? prev.checkInTime || "09:00 AM" : "",
                    checkOutTime: newStatus === "PRESENT" ? prev.checkOutTime || "06:00 PM" : newStatus === "HALF_DAY" ? "01:00 PM" : "",
                  }));
                }}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                <option value="PRESENT">PRESENT (Full Duty)</option>
                <option value="ABSENT">ABSENT (Unexcused)</option>
                <option value="HALF_DAY">HALF DAY (Half Shift - 4 Hours)</option>
                <option value="LEAVE">LEAVE (Approved Leave / Casual / Medical)</option>
                <option value="WEEKLY_OFF">WEEKLY OFF (Scheduled Rest)</option>
              </select>
            </div>

            {/* Check-in & Check-out Timings */}
            {(editForm.status === "PRESENT" || editForm.status === "HALF_DAY") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#362A22]">Check-In Time</label>
                    <Input
                      value={editForm.checkInTime}
                      onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                      placeholder="09:00 AM"
                      className="h-8 text-xs font-mono border-[#E3D9CA]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#362A22]">Check-Out Time</label>
                    <Input
                      value={editForm.checkOutTime}
                      onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                      placeholder="06:00 PM"
                      className="h-8 text-xs font-mono border-[#E3D9CA]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#362A22]">Working Hours</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={editForm.workingHours}
                      onChange={(e) => setEditForm({ ...editForm, workingHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-[#362A22] border-[#E3D9CA]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#362A22]">Overtime Hours (OT)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={editForm.overtimeHours}
                      onChange={(e) => setEditForm({ ...editForm, overtimeHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-amber-700 border-[#E3D9CA]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Remarks / Reason */}
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Remarks / Reason for Leave</label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="e.g. Approved medical leave / late entry with manager approval"
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs border-[#E3D9CA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
              >
                {submitting ? "Saving Record..." : "Save Attendance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* BULK ATTENDANCE MODAL                                                     */}
      {/* ========================================================================= */}
      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-[#B08A60]" />
              <DialogTitle className="text-lg font-serif font-bold text-[#362A22]">
                Bulk Mark Staff Attendance
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#79695B]">
              Quickly mark attendance for all employees or a selected department on a given date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmBulkMark} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Attendance Date *</label>
              <Input
                type="date"
                required
                value={bulkForm.attendanceDate}
                onChange={(e) => setBulkForm({ ...bulkForm, attendanceDate: e.target.value })}
                className="h-8 text-xs font-mono border-[#E3D9CA]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Apply to Department *</label>
              <select
                value={bulkForm.department}
                onChange={(e) => setBulkForm({ ...bulkForm, department: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Active Hotel Staff" : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Status to Mark *</label>
              <select
                value={bulkForm.attendanceStatus}
                onChange={(e) => setBulkForm({ ...bulkForm, attendanceStatus: e.target.value as any })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
              >
                <option value="PRESENT">PRESENT (Standard 8h Shift)</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY (4h Shift)</option>
                <option value="LEAVE">LEAVE</option>
                <option value="WEEKLY_OFF">WEEKLY OFF</option>
              </select>
            </div>

            {bulkForm.attendanceStatus === "PRESENT" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Default Check-In</label>
                  <Input
                    value={bulkForm.checkInTime}
                    onChange={(e) => setBulkForm({ ...bulkForm, checkInTime: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Default Check-Out</label>
                  <Input
                    value={bulkForm.checkOutTime}
                    onChange={(e) => setBulkForm({ ...bulkForm, checkOutTime: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-[#362A22]">Internal Notes</label>
              <Input
                value={bulkForm.notes}
                onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkModalOpen(false)}
                className="text-xs border-[#E3D9CA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
              >
                {submitting ? "Processing Bulk..." : "Confirm & Apply Bulk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
