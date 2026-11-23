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
} from "lucide-react";
import { attendanceService, DailyRegisterResponse } from "@/services/attendance.service";
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
  { label: string; bg: string; text: string; border: string; code: string }
> = {
  PRESENT: { label: "Present", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", code: "P" },
  ABSENT: { label: "Absent", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", code: "A" },
  HALF_DAY: { label: "Half Day", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", code: "HD" },
  LEAVE: { label: "Leave", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", code: "L" },
  WEEKLY_OFF: { label: "Weekly Off", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", code: "WO" },
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [department, setDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyRegisterResponse | null>(null);

  // Quick action & modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [activeAttendance, setActiveAttendance] = useState<Attendance | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    status: "PRESENT" as "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF",
    checkInTime: "09:00 AM",
    checkOutTime: "06:00 PM",
    workingHours: 8,
    overtimeHours: 0,
    notes: "",
  });

  const fetchDailyRegister = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getDailyRegister(
        selectedDate,
        department !== "ALL" ? department : undefined,
      );
      setData(res);
    } catch (err) {
      toast.error("Failed to load daily attendance register");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyRegister();
  }, [selectedDate, department]);

  const handleQuickStatus = async (
    staff: Staff,
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF",
  ) => {
    try {
      await attendanceService.markAttendance({
        staffId: staff.id,
        attendanceDate: selectedDate,
        attendanceStatus: status,
        checkInTime: status === "PRESENT" ? "09:00 AM" : status === "HALF_DAY" ? "09:00 AM" : undefined,
        checkOutTime: status === "PRESENT" ? "06:00 PM" : status === "HALF_DAY" ? "01:00 PM" : undefined,
        workingHours: status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : 0,
        overtimeHours: 0,
      });
      toast.success(`${staff.fullName} marked as ${status}`);
      fetchDailyRegister();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  const handleOpenDetailedModal = (staff: Staff, attendance: Attendance | null) => {
    setActiveStaff(staff);
    setActiveAttendance(attendance);
    setForm({
      status: attendance?.attendanceStatus || "PRESENT",
      checkInTime: attendance?.checkInTime || "09:00 AM",
      checkOutTime: attendance?.checkOutTime || "06:00 PM",
      workingHours: attendance?.workingHours !== undefined && attendance?.workingHours !== null ? Number(attendance.workingHours) : 8,
      overtimeHours: attendance?.overtimeHours !== undefined ? Number(attendance.overtimeHours) : 0,
      notes: attendance?.notes || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveDetailed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    try {
      setSubmitting(true);
      await attendanceService.markAttendance({
        staffId: activeStaff.id,
        attendanceDate: selectedDate,
        attendanceStatus: form.status,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        workingHours: Number(form.workingHours),
        overtimeHours: Number(form.overtimeHours),
        notes: form.notes,
      });
      toast.success(`Attendance updated for ${activeStaff.fullName}`);
      setEditModalOpen(false);
      fetchDailyRegister();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRegister = (data?.register || []).filter((item) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff Attendance Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily check-in and check-out tracking, shift working hours, overtime records, and leave management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-xs bg-white border-slate-300"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="text-xs"
          >
            Today
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
            <span className="text-2xl font-bold text-slate-900">{data?.stats.totalStaff || 0}</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-sm bg-emerald-50/50">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Present</span>
            <span className="text-2xl font-bold text-emerald-700">{data?.stats.present || 0}</span>
          </CardContent>
        </Card>

        <Card className="border-rose-200 shadow-sm bg-rose-50/50">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Absent</span>
            <span className="text-2xl font-bold text-rose-700">{data?.stats.absent || 0}</span>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm bg-amber-50/50">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Half Day</span>
            <span className="text-2xl font-bold text-amber-700">{data?.stats.halfDay || 0}</span>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-sm bg-blue-50/50">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">Leave</span>
            <span className="text-2xl font-bold text-blue-700">{data?.stats.leave || 0}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-50">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Unmarked</span>
            <span className="text-2xl font-bold text-slate-700">{data?.stats.unmarked || 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Department:</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Front Office">Front Office</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Security">Security</option>
            <option value="Administration">Administration</option>
            <option value="Accounts">Accounts</option>
          </select>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Daily Register Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : filteredRegister.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No staff members found for the selected department.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Today Status</th>
                    <th className="px-4 py-3">Quick Mark</th>
                    <th className="px-4 py-3">Hours (Work / OT)</th>
                    <th className="px-4 py-3">Shift Timings</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegister.map((item) => {
                    const att = item.attendance;
                    const cfg = att ? STATUS_CONFIG[att.attendanceStatus] : null;

                    return (
                      <tr key={item.staff.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div>{item.staff.fullName}</div>
                          <div className="text-[11px] text-indigo-600 font-mono">
                            {item.staff.employeeCode}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{item.staff.designation}</div>
                          <div className="text-[11px] text-slate-400">{item.staff.department}</div>
                        </td>
                        <td className="px-4 py-3">
                          {cfg ? (
                            <Badge variant="outline" className={`text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              {cfg.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50 border-slate-200">
                              PENDING
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                          {(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WEEKLY_OFF"] as const).map((st) => {
                            const isCurrent = att?.attendanceStatus === st;
                            return (
                              <button
                                key={st}
                                onClick={() => handleQuickStatus(item.staff, st)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                  isCurrent
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                    : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                                title={`Mark as ${STATUS_CONFIG[st].label}`}
                              >
                                {STATUS_CONFIG[st].code}
                              </button>
                            );
                          })}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {att ? (
                            <span>
                              {Number(att.workingHours || 0)}h
                              {Number(att.overtimeHours) > 0 && (
                                <span className="text-amber-600 font-semibold ml-1">
                                  (+{Number(att.overtimeHours)}h OT)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          {att && att.checkInTime ? (
                            <span>
                              {att.checkInTime} → {att.checkOutTime || "Pending"}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetailedModal(item.staff, att)}
                            className="h-7 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Details, Timings & Overtime"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
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

      {/* Detailed Attendance Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Attendance Record ({activeStaff?.fullName})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-mono">
              {activeStaff?.employeeCode} • Date: {selectedDate}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDetailed} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Attendance Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="LEAVE">LEAVE</option>
                <option value="WEEKLY_OFF">WEEKLY OFF</option>
              </select>
            </div>

            {(form.status === "PRESENT" || form.status === "HALF_DAY") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Check-In Time</label>
                    <Input
                      value={form.checkInTime}
                      onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                      placeholder="09:00 AM"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Check-Out Time</label>
                    <Input
                      value={form.checkOutTime}
                      onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                      placeholder="06:00 PM"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Working Hours</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={form.workingHours}
                      onChange={(e) => setForm({ ...form, workingHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Overtime Hours</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={form.overtimeHours}
                      onChange={(e) => setForm({ ...form, overtimeHours: Number(e.target.value) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Remarks / Reason</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Reason for late check-in or leave..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving..." : "Save Attendance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
