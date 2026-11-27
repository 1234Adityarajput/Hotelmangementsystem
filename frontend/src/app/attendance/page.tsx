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
  Download,
  History,
  Trash2,
  Archive,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ExcelJS from "exceljs";
import {
  attendanceService,
  DailyRegisterResponse,
  MonthlyMatrixResponse,
  MonthlyStaffRow,
  AttendanceHistoryItem,
  MonthlyAttendanceHistoryResponse,
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

  // Delete Attendance State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{
    staff: Staff;
    attendance: Attendance;
    date: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Monthly Attendance History & Archive Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<MonthlyAttendanceHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "DELETED">("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

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

  // Delete Handlers
  const handleOpenDelete = (staff: Staff, att: Attendance, date: string) => {
    setRecordToDelete({ staff, attendance: att, date });
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      const res = await attendanceService.delete(recordToDelete.attendance.id);
      toast.success(res.message || `Attendance for ${recordToDelete.staff.fullName} deleted and archived`);
      setDeleteModalOpen(false);
      setRecordToDelete(null);
      if (activeTab === "daily") fetchDailyRegister();
      if (activeTab === "monthly") fetchMonthlyMatrix();
      if (activeTab === "history") fetchStaffHistory();
      if (historyModalOpen) fetchHistory(historyMonth, historyYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete attendance record");
    } finally {
      setIsDeleting(false);
    }
  };

  // History & Archive Handlers
  const fetchHistory = async (m?: number, y?: number) => {
    try {
      setHistoryLoading(true);
      const res = await attendanceService.getHistory({
        month: m || historyMonth,
        year: y || historyYear,
      });
      setHistoryData(res);
    } catch (err: any) {
      toast.error("Failed to load staff attendance history");
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
      toast.info("Generating Excel report for Staff Attendance...");

      let exportItems: AttendanceHistoryItem[] = [];
      let scopeTitle = "";

      if (scope === "MONTH") {
        const histRes = await attendanceService.getHistory({ month: historyMonth, year: historyYear });
        exportItems = histRes.items || [];
        scopeTitle = histRes.monthName || `${MONTH_NAMES[historyMonth - 1]}_${historyYear}`;
      } else {
        const histRes = await attendanceService.getHistory({
          month: new Date(selectedDate).getMonth() + 1,
          year: new Date(selectedDate).getFullYear(),
        });
        exportItems = histRes.items || [];
        scopeTitle = `${MONTH_NAMES[new Date(selectedDate).getMonth()]}_${new Date(selectedDate).getFullYear()}`;
      }

      if (exportItems.length === 0) {
        toast.warning("No attendance records found to export for selected scope");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hotel Radha Palace";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Attendance Records");

      // Title Banner
      worksheet.mergeCells("A1:N1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "HOTEL RADHA PALACE — STAFF ATTENDANCE REGISTER";
      titleCell.font = { name: "Georgia", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF59283A" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 32;

      worksheet.mergeCells("A2:N2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Export Scope: ${scopeTitle} | Total Records: ${exportItems.length} | Generated: ${new Date().toLocaleString("en-IN")}`;
      subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF59283A" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F0EA" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(2).height = 20;

      // Headers
      const headers = [
        "S.No",
        "Employee Code",
        "Staff Name",
        "Department",
        "Designation",
        "Attendance Date",
        "Status",
        "Check-In",
        "Check-Out",
        "Working Hours (h)",
        "Overtime (h)",
        "Notes",
        "Lifecycle",
        "Archived Date",
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

      exportItems.forEach((att: AttendanceHistoryItem, idx: number) => {
        const dateStr = att.attendanceDate ? new Date(att.attendanceDate).toLocaleDateString("en-IN") : "—";
        const row = worksheet.addRow([
          idx + 1,
          att.employeeCode || "—",
          att.staffName || "—",
          att.department || "—",
          att.designation || "—",
          dateStr,
          att.attendanceStatus || "PRESENT",
          att.checkInTime || "—",
          att.checkOutTime || "—",
          Number(att.workingHours || 0),
          Number(att.overtimeHours || 0),
          att.notes || "—",
          att.isDeleted ? "DELETED / ARCHIVED" : "ACTIVE RECORD",
          att.deletedAt ? new Date(att.deletedAt).toLocaleDateString("en-IN") : "—",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const isDeletedRow = att.isDeleted;

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
            colNum === 6 ||
            colNum === 7 ||
            colNum === 8 ||
            colNum === 9 ||
            colNum === 13 ||
            colNum === 14
          ) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (colNum === 10 || colNum === 11) {
            cell.alignment = { vertical: "middle", horizontal: "right" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });
      });

      worksheet.columns = [
        { width: 8 },  // S.No
        { width: 16 }, // Employee Code
        { width: 24 }, // Staff Name
        { width: 20 }, // Department
        { width: 24 }, // Designation
        { width: 16 }, // Date
        { width: 14 }, // Status
        { width: 14 }, // Check-In
        { width: 14 }, // Check-Out
        { width: 18 }, // Working Hours
        { width: 14 }, // Overtime
        { width: 26 }, // Notes
        { width: 20 }, // Lifecycle
        { width: 18 }, // Archived Date
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Hotel_Radha_Palace_Attendance_${scopeTitle.replace(/\s+/g, "_")}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Attendance report exported successfully (${exportItems.length} records)`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to generate Excel export");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredHistoryItems = (historyData?.items || []).filter((item) => {
    if (historyFilter === "ACTIVE" && item.isDeleted) return false;
    if (historyFilter === "DELETED" && !item.isDeleted) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.staffName && item.staffName.toLowerCase().includes(q)) ||
      (item.employeeCode && item.employeeCode.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q)) ||
      (item.designation && item.designation.toLowerCase().includes(q)) ||
      (item.attendanceStatus && item.attendanceStatus.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.attendanceDate && item.attendanceDate.includes(q))
    );
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4A06A] bg-[#F5F0EA] px-2.5 py-0.5 rounded-full">
              Workforce Operations • Module 10
            </span>
            <span className="text-xs text-[#82747A]">• Daily & Monthly Staff Attendance</span>
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#59283A] mt-1">
            Staff Attendance Management
          </h2>
          <p className="text-xs text-[#82747A] mt-0.5">
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
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5 text-xs h-9 px-3.5 shadow-sm"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Bulk Mark Attendance</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenHistoryModal}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Attendance History</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportExcel("ALL")}
            disabled={isExporting}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] flex items-center gap-1.5"
            title="Download complete attendance records as Excel spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs border-[#E8DDD8] text-[#82747A] hover:text-[#59283A]"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
            <span>Print Sheet</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "daily"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "monthly"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Monthly Records & Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-[#59283A] text-white shadow-sm border-b-2 border-[#C4A06A]"
                : "text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]/50"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C4A06A]" />
            <span>Employee Attendance Dossier</span>
          </button>
        </div>

        {/* Status Legend */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#82747A]">
          <span className="font-semibold text-[#59283A]">Legend:</span>
          {Object.entries(STATUS_CONFIG)
            .filter(([k]) => k !== "HALF_DAY")
            .map(([k, cfg]) => (
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
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
            {/* Date Nav Controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateShift(-1)}
                className="h-8 w-8 p-0 border-[#E8DDD8]"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#82747A]" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 h-8 text-xs font-mono font-medium border-[#E8DDD8] bg-[#F5F0EA]/50 focus:bg-white"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateShift(1)}
                className="h-8 w-8 p-0 border-[#E8DDD8]"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#82747A]" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="h-8 px-2.5 text-xs border-[#E8DDD8] text-[#59283A]"
              >
                Today
              </Button>
              <span className="text-xs font-serif font-bold text-[#59283A] ml-2 hidden sm:inline">
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
              <span className="text-xs font-semibold text-[#82747A]">Dept:</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="text-xs border border-[#E8DDD8] rounded-md px-2.5 py-1.5 bg-[#F5F0EA] text-[#59283A] focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Departments" : d}
                  </option>
                ))}
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#82747A] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search staff name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-[#E8DDD8]"
                />
              </div>
            </div>
          </div>

          {/* 5 KPI Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="border-[#E8DDD8] shadow-sm bg-white">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-[#82747A] block">Total Staff</span>
                <span className="text-2xl font-bold font-serif text-[#59283A]">
                  {dailyData?.stats.totalStaff || 0}
                </span>
                <span className="text-[10px] text-[#8E7079] block mt-0.5">Active Workforce</span>
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
          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#59283A]">
                  Daily Roster for {selectedDate}
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
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
                  <LoadingSpinner text="Loading Attendance Ledgers..." subtext="Retrieving employee muster roll and shift logs..." />
                  <span className="text-xs text-[#82747A]">Loading daily staff register...</span>
                </div>
              ) : filteredDailyRegister.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[#C4A06A] opacity-40" />
                  <p className="font-semibold text-[#59283A]">No staff members found matching criteria.</p>
                  <p>Check your department or search filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role & Dept</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Quick Actions (P / A / L / WO)</th>
                        <th className="px-4 py-3">Working Hours</th>
                        <th className="px-4 py-3">Shift Timings</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {filteredDailyRegister.map((item) => {
                        const att = item.attendance;
                        const cfg = att ? STATUS_CONFIG[att.attendanceStatus] : null;

                        return (
                          <tr key={item.staff.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                            <td className="px-4 py-3 font-medium text-[#59283A]">
                              <div className="font-semibold">{item.staff.fullName}</div>
                              <div className="text-[11px] text-[#C4A06A] font-mono">
                                {item.staff.employeeCode}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#59283A]">{item.staff.designation}</div>
                              <div className="text-[11px] text-[#82747A]">{item.staff.department}</div>
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
                                  className="text-[10px] text-[#82747A] bg-[#F5F0EA] border-[#E8DDD8]"
                                >
                                  UNMARKED
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {(["PRESENT", "ABSENT", "LEAVE", "WEEKLY_OFF"] as const).map((st) => {
                                  const isCurrent = att?.attendanceStatus === st;
                                  const statusCfg = STATUS_CONFIG[st];
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleQuickStatus(item.staff, st)}
                                      className={`h-6 px-2 rounded text-[10px] font-bold border transition-all ${
                                        isCurrent
                                          ? "bg-[#59283A] text-white border-[#59283A] shadow-xs"
                                          : "bg-white hover:bg-[#F5F0EA] text-[#82747A] border-[#E8DDD8]"
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
                                  <strong className="text-[#59283A]">{Number(att.workingHours || 0)}h</strong>
                                  {Number(att.overtimeHours) > 0 && (
                                    <span className="text-amber-700 font-semibold ml-1.5 bg-amber-50 px-1 py-0.5 rounded text-[10px]">
                                      +{Number(att.overtimeHours)}h OT
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[#8E7079]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#82747A] text-[11px]">
                              {att && att.checkInTime ? (
                                <span className="font-mono">
                                  {att.checkInTime} → {att.checkOutTime || "Pending"}
                                </span>
                              ) : (
                                <span className="text-[#8E7079]">Not recorded</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#82747A] text-[11px] max-w-[150px] truncate">
                              {att?.notes || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDetailedModal(item.staff, att, selectedDate)}
                                  className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#EFE8E0]"
                                  title="Edit Check-In, Check-Out, and Hours"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                                  <span>Edit</span>
                                </Button>
                                {att && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDelete(item.staff, att, selectedDate)}
                                    className="h-7 px-2 text-xs text-[#B54C44] hover:bg-rose-50 hover:text-rose-700"
                                    title="Delete attendance record and preserve snapshot in audit history"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                                    <span>Delete</span>
                                  </Button>
                                )}
                              </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthShift(-1)}
                className="h-8 w-8 p-0 border-[#E8DDD8]"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#82747A]" />
              </Button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-8 text-xs font-semibold border border-[#E8DDD8] rounded-md px-2.5 bg-[#F5F0EA] text-[#59283A]"
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
                className="h-8 text-xs font-mono font-semibold border border-[#E8DDD8] rounded-md px-2 bg-[#F5F0EA] text-[#59283A]"
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
                className="h-8 w-8 p-0 border-[#E8DDD8]"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#82747A]" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                }}
                className="h-8 px-2.5 text-xs border-[#E8DDD8] text-[#59283A]"
              >
                Current Month
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#82747A]">Department:</span>
              <select
                value={monthlyDepartment}
                onChange={(e) => setMonthlyDepartment(e.target.value)}
                className="text-xs border border-[#E8DDD8] rounded-md px-2.5 py-1.5 bg-[#F5F0EA] text-[#59283A] focus:outline-none"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="border-[#E8DDD8] shadow-sm bg-white">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#82747A] block">Staff Enrolled</span>
                  <span className="text-2xl font-bold font-serif text-[#59283A]">
                    {monthlyData.overallStats.totalStaff}
                  </span>
                  <span className="text-[10px] text-[#8E7079] block mt-0.5">
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

              <Card className="border-blue-200 shadow-sm bg-blue-50/40">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Leaves</span>
                  <span className="text-2xl font-bold font-serif text-blue-700">
                    {monthlyData.overallStats.totalLeave}
                  </span>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Sanctioned</span>
                </CardContent>
              </Card>

              <Card className="border-[#E8DDD8] shadow-sm bg-[#F5F0EA]">
                <CardContent className="p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#82747A] block">Total Overtime</span>
                  <span className="text-2xl font-bold font-serif text-[#59283A]">
                    {monthlyData.overallStats.totalOvertimeHours}h
                  </span>
                  <span className="text-[10px] text-[#82747A] block mt-0.5">
                    {monthlyData.overallStats.totalWorkingHours}h total worked
                  </span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Attendance Matrix Grid */}
          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#59283A]">
                  Monthly Matrix: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  Click on any day cell to view or modify an employee&apos;s record for that specific date.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#82747A]">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> P: Present
                <span className="w-2 h-2 rounded-full bg-rose-600 ml-2" /> A: Absent
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-2" /> L: Leave
                <span className="w-2 h-2 rounded-full bg-purple-600 ml-2" /> WO: Off
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMonthly ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner text="Loading Attendance Ledgers..." subtext="Retrieving employee muster roll and shift logs..." />
                  <span className="text-xs text-[#82747A]">Generating monthly attendance matrix...</span>
                </div>
              ) : !monthlyData || monthlyData.staffRows.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-[#C4A06A] opacity-40" />
                  <p className="font-semibold text-[#59283A]">No staff attendance data found for this month.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[10px] font-semibold sticky top-0 z-20 shadow-xs border-b border-[#E8DDD8]">
                      <tr>
                        <th className="px-3 py-2.5 sticky left-0 bg-[#F5F0EA] z-30 min-w-[160px] border-r border-[#E8DDD8]">
                          Staff Member
                        </th>
                        {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((d) => (
                          <th key={d} className="px-1.5 py-2 text-center min-w-[28px] border-r border-[#E8DDD8]">
                            {d}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-emerald-800 bg-emerald-50/50">P</th>
                        <th className="px-2 py-2 text-center text-rose-800 bg-rose-50/50">A</th>
                        <th className="px-2 py-2 text-center text-blue-800 bg-blue-50/50">L</th>
                        <th className="px-2 py-2 text-center text-purple-800 bg-purple-50/50">WO</th>
                        <th className="px-2.5 py-2 text-center font-bold text-[#59283A]">Hours</th>
                        <th className="px-2.5 py-2 text-center font-bold text-amber-700">OT</th>
                        <th className="px-3 py-2 text-center font-bold text-[#59283A]">Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {monthlyData.staffRows.map((row) => (
                        <tr key={row.staff.id} className="hover:bg-[#F5F0EA]/50 transition-colors">
                          {/* Frozen Left Staff Info */}
                          <td className="px-3 py-2 sticky left-0 bg-white hover:bg-[#F5F0EA]/50 z-10 border-r border-[#E8DDD8]">
                            <div className="font-semibold text-[#59283A] truncate max-w-[150px]">
                              {row.staff.fullName}
                            </div>
                            <div className="text-[10px] text-[#82747A] font-mono flex items-center gap-1">
                              <span className="text-[#C4A06A] font-bold">{row.staff.employeeCode}</span>
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
                                className="px-0.5 py-1 text-center cursor-pointer border-r border-[#E8DDD8] hover:bg-[#F5F0EA]"
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
                          <td className="px-2 py-2 text-center font-bold font-mono text-blue-700 bg-blue-50/30">
                            {row.summary.leaveCount}
                          </td>
                          <td className="px-2 py-2 text-center font-bold font-mono text-purple-700 bg-purple-50/30">
                            {row.summary.weeklyOffCount}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-bold text-[#59283A]">
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
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#82747A]">Select Staff:</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="text-xs font-semibold border border-[#E8DDD8] rounded-md px-2.5 py-1.5 bg-[#F5F0EA] text-[#59283A] min-w-[220px]"
              >
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeCode}) • {s.department}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-[#82747A] ml-2">From:</span>
              <Input
                type="date"
                value={staffHistoryDateRange.startDate}
                onChange={(e) =>
                  setStaffHistoryDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-36 h-8 text-xs border-[#E8DDD8]"
              />

              <span className="text-xs font-semibold text-[#82747A]">To:</span>
              <Input
                type="date"
                value={staffHistoryDateRange.endDate}
                onChange={(e) =>
                  setStaffHistoryDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-36 h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#82747A]">Status:</span>
              {["ALL", "PRESENT", "ABSENT", "LEAVE", "WEEKLY_OFF"].map((st) => (
                <button
                  key={st}
                  onClick={() => setHistoryStatusFilter(st)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    historyStatusFilter === st
                      ? "bg-[#59283A] text-white font-semibold"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
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
            const leaveCount = staffHistory.filter((h) => h.attendanceStatus === "LEAVE").length;
            const totalHours = staffHistory.reduce((sum, h) => sum + Number(h.workingHours || 0), 0);
            const totalOT = staffHistory.reduce((sum, h) => sum + Number(h.overtimeHours || 0), 0);

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-[#E8DDD8] shadow-sm bg-white md:col-span-1">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#59283A] text-[#F5F0EA] flex items-center justify-center font-serif font-bold text-base shadow-inner">
                        {currentStaff.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#59283A]">
                          {currentStaff.fullName}
                        </h3>
                        <p className="font-mono text-[11px] text-[#C4A06A] font-semibold">
                          {currentStaff.employeeCode}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EFE8E0] text-xs space-y-1.5 text-[#82747A]">
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <strong className="text-[#59283A]">{currentStaff.department}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Designation:</span>
                        <strong className="text-[#59283A]">{currentStaff.designation}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Salary:</span>
                        <strong className="text-[#59283A] font-mono">
                          ₹{Number(currentStaff.monthlySalary).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile:</span>
                        <span className="font-mono text-[#59283A]">{currentStaff.mobileNumber}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

                  <Card className="border-blue-200 shadow-sm bg-blue-50/40">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Leaves Taken</span>
                      <span className="text-2xl font-bold font-serif text-blue-700">{leaveCount}</span>
                      <span className="text-[10px] text-blue-600 block mt-0.5">Approved</span>
                    </CardContent>
                  </Card>

                  <Card className="border-[#E8DDD8] shadow-sm bg-[#F5F0EA]">
                    <CardContent className="p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#82747A] block">Total Overtime</span>
                      <span className="text-2xl font-bold font-serif text-[#59283A]">{totalOT}h</span>
                      <span className="text-[10px] text-[#82747A] block mt-0.5">{totalHours}h worked</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* History Ledger Table */}
          <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-[#E8DDD8] bg-[#F5F0EA]/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif font-bold text-[#59283A]">
                  Attendance History Log ({staffHistory.length} records)
                </CardTitle>
                <CardDescription className="text-xs text-[#82747A]">
                  Chronological log of check-in, check-out, working hours, and notes.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="p-16 flex flex-col justify-center items-center">
                  <LoadingSpinner text="Loading Attendance Ledgers..." subtext="Retrieving employee muster roll and shift logs..." />
                  <span className="text-xs text-[#82747A]">Loading attendance history...</span>
                </div>
              ) : staffHistory.length === 0 ? (
                <div className="p-16 text-center text-xs text-[#82747A] space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-[#C4A06A] opacity-40" />
                  <p className="font-semibold text-[#59283A]">No attendance records found for this period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
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
                    <tbody className="divide-y divide-[#E8DDD8]">
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
                          <tr key={h.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[#59283A] font-mono">
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
                            <td className="px-4 py-3 font-mono text-[#59283A]">
                              {h.checkInTime || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#59283A]">
                              {h.checkOutTime || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#59283A]">
                              {Number(h.workingHours || 0)}h
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {Number(h.overtimeHours) > 0 ? (
                                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                  +{Number(h.overtimeHours)}h OT
                                </span>
                              ) : (
                                <span className="text-[#8E7079]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#82747A] max-w-[200px] truncate">
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
                                  className="h-7 px-2 text-[#82747A] hover:text-[#C4A06A] hover:bg-[#EFE8E0]"
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
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded w-fit">
              Attendance Record Correction
            </span>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A] mt-1">
              {activeStaff?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] font-mono">
              {activeStaff?.employeeCode} • Date: {activeAttendanceDate || selectedDate}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDetailed} className="space-y-3.5 pt-2 text-xs">
            {/* Status Selection */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Attendance Status *</label>
              <select
                value={editForm.status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setEditForm((prev) => ({
                    ...prev,
                    status: newStatus,
                    workingHours: newStatus === "PRESENT" ? 8 : 0,
                    overtimeHours: newStatus === "PRESENT" ? prev.overtimeHours : 0,
                    checkInTime: newStatus === "PRESENT" ? prev.checkInTime || "09:00 AM" : "",
                    checkOutTime: newStatus === "PRESENT" ? prev.checkOutTime || "06:00 PM" : "",
                  }));
                }}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                <option value="PRESENT">PRESENT (Full Duty)</option>
                <option value="ABSENT">ABSENT (Unexcused)</option>
                <option value="LEAVE">LEAVE (Approved Leave / Casual / Medical)</option>
                <option value="WEEKLY_OFF">WEEKLY OFF (Scheduled Rest)</option>
              </select>
            </div>

            {/* Check-in & Check-out Timings */}
            {editForm.status === "PRESENT" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#59283A]">Check-In Time</label>
                    <Input
                      value={editForm.checkInTime}
                      onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                      placeholder="09:00 AM"
                      className="h-8 text-xs font-mono border-[#E8DDD8]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#59283A]">Check-Out Time</label>
                    <Input
                      value={editForm.checkOutTime}
                      onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                      placeholder="06:00 PM"
                      className="h-8 text-xs font-mono border-[#E8DDD8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#59283A]">Working Hours</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={editForm.workingHours}
                      onChange={(e) => setEditForm({ ...editForm, workingHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-[#59283A] border-[#E8DDD8]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#59283A]">Overtime Hours (OT)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={editForm.overtimeHours}
                      onChange={(e) => setEditForm({ ...editForm, overtimeHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-amber-700 border-[#E8DDD8]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Remarks / Reason */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Remarks / Reason for Leave</label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="e.g. Approved medical leave / late entry with manager approval"
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
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
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-[#C4A06A]" />
              <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
                Bulk Mark Staff Attendance
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#82747A]">
              Quickly mark attendance for all employees or a selected department on a given date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmBulkMark} className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Attendance Date *</label>
              <Input
                type="date"
                required
                value={bulkForm.attendanceDate}
                onChange={(e) => setBulkForm({ ...bulkForm, attendanceDate: e.target.value })}
                className="h-8 text-xs font-mono border-[#E8DDD8]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Apply to Department *</label>
              <select
                value={bulkForm.department}
                onChange={(e) => setBulkForm({ ...bulkForm, department: e.target.value })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Active Hotel Staff" : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Status to Mark *</label>
              <select
                value={bulkForm.attendanceStatus}
                onChange={(e) => setBulkForm({ ...bulkForm, attendanceStatus: e.target.value as any })}
                className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white text-[#59283A]"
              >
                <option value="PRESENT">PRESENT (Standard 8h Shift)</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LEAVE">LEAVE</option>
                <option value="WEEKLY_OFF">WEEKLY OFF</option>
              </select>
            </div>

            {bulkForm.attendanceStatus === "PRESENT" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Default Check-In</label>
                  <Input
                    value={bulkForm.checkInTime}
                    onChange={(e) => setBulkForm({ ...bulkForm, checkInTime: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Default Check-Out</label>
                  <Input
                    value={bulkForm.checkOutTime}
                    onChange={(e) => setBulkForm({ ...bulkForm, checkOutTime: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Internal Notes</label>
              <Input
                value={bulkForm.notes}
                onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
                className="h-8 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkModalOpen(false)}
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
                {submitting ? "Processing Bulk..." : "Confirm & Apply Bulk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (AUDIT ARCHIVED)                                */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="text-center sm:text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-[#F8E8E5] border border-[#F2D1CB] text-[#B54C44] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A]">
              Delete Attendance Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A] mt-1">
              Are you sure you want to delete the attendance record for{" "}
              <strong className="text-[#59283A] font-semibold">
                {recordToDelete?.staff.fullName}
              </strong>
              {recordToDelete?.staff.employeeCode && ` (${recordToDelete.staff.employeeCode})`}
              {recordToDelete?.date && ` on ${recordToDelete.date}`}?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 bg-[#F5F0EA]/70 rounded-xl border border-[#E8DDD8] text-xs text-[#59283A] space-y-2.5 my-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#32765B] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#2E5E44]">Permanent History Preserved:</strong> This employee&apos;s shift timings, working hours, and attendance status snapshot will be permanently archived in <strong>Monthly History &amp; Audit Logs</strong>.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Trash2 className="w-4 h-4 text-[#B54C44] mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <strong className="text-[#963730]">Active Roster Reset:</strong> The record will be removed from your daily attendance register and monthly roster, resetting the employee to UNMARKED for this date.
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
                setRecordToDelete(null);
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
                  <span>Yes, Delete Attendance</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* FULL MONTH ATTENDANCE HISTORY & ARCHIVE MODAL                             */}
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
                  <span className="text-xs text-[#82747A]">• Full Month Workforce Attendance &amp; Audit Logs</span>
                </div>
                <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C4A06A]" />
                  <span>Attendance History &amp; Monthly Records</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Review complete month staff attendance shifts, overtime hours, and deleted attendance archives.
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
                  <div className="text-[10px] uppercase font-bold text-[#8E7079]">Total Records</div>
                  <div className="text-lg font-serif font-bold text-[#59283A]">
                    {historyData?.totalCount || 0}
                  </div>
                </div>
                <CalendarCheck className="w-5 h-5 text-[#C4A06A]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#32765B]">Active / Marked</div>
                  <div className="text-lg font-serif font-bold text-[#32765B]">
                    {historyData?.activeCount || 0}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#32765B]" />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#B54C44]">Deleted / Reset</div>
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
                placeholder="Search history by staff name, code, department, status, notes..."
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
                title="Download this month's complete attendance records"
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
                <LoadingSpinner size="md" text="Loading attendance history records..." />
              </div>
            ) : filteredHistoryItems.length === 0 ? (
              <div className="text-center py-12 text-[#82747A] text-xs">
                No attendance records or deletion activity found for {historyData?.monthName || "this month"}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistoryItems.map((item: any, idx: number) => {
                  const cfg = STATUS_CONFIG[item.attendanceStatus] || STATUS_CONFIG.PRESENT;
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        item.isDeleted
                          ? "border-[#B54C44]/30 bg-[#F8E8E5]/20 hover:border-[#B54C44]"
                          : "border-[#E8DDD8] hover:border-[#C4A06A]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                            item.isDeleted
                              ? "bg-[#B54C44]/10 text-[#B54C44]"
                              : "bg-[#59283A]/10 text-[#59283A]"
                          }`}
                        >
                          {item.staffName ? item.staffName.substring(0, 2).toUpperCase() : "AT"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#59283A]">
                              {item.staffName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F0EA] text-[#C4A06A] border border-[#E8DDD8]">
                              {item.employeeCode}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-semibold px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                            >
                              {cfg.label}
                            </Badge>
                          </div>

                          <div className="text-xs text-[#82747A] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{item.department}</span>
                            <span>•</span>
                            <span>{item.designation}</span>
                            <span>•</span>
                            <span className="font-medium text-[#59283A]">
                              Date: {new Date(item.attendanceDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#8E7079] mt-1 flex items-center gap-2 flex-wrap">
                            {item.checkInTime ? (
                              <span className="font-mono">
                                Shift: {item.checkInTime} → {item.checkOutTime || "Pending"}
                              </span>
                            ) : (
                              <span>Shift: Not recorded</span>
                            )}
                            <span>•</span>
                            <span className="font-mono">
                              Hours: <strong>{Number(item.workingHours || 0)}h</strong>
                              {Number(item.overtimeHours) > 0 && ` (+${item.overtimeHours}h OT)`}
                            </span>
                            {item.notes && (
                              <>
                                <span>•</span>
                                <span className="italic truncate max-w-[200px]">&quot;{item.notes}&quot;</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                        {item.isDeleted ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#B54C44]/10 text-[#B54C44] border border-[#B54C44]/20">
                              <Archive className="w-3 h-3" />
                              DELETED / ARCHIVED
                            </span>
                            {item.deletedAt && (
                              <div className="text-[10px] text-[#8E7079] mt-0.5">
                                {new Date(item.deletedAt).toLocaleString("en-IN")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#32765B]/10 text-[#32765B] border border-[#32765B]/20">
                              <CheckCircle2 className="w-3 h-3" />
                              ACTIVE RECORD
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleOpenDelete(
                                  {
                                    id: item.staffId,
                                    fullName: item.staffName,
                                    employeeCode: item.employeeCode,
                                    department: item.department,
                                    designation: item.designation,
                                  } as any,
                                  {
                                    id: item.id,
                                    attendanceDate: item.attendanceDate,
                                    attendanceStatus: item.attendanceStatus,
                                  } as any,
                                  item.attendanceDate
                                );
                              }}
                              className="h-7 px-2 text-xs text-[#B54C44] hover:bg-rose-50 hover:text-rose-700"
                              title="Delete this attendance record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
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
