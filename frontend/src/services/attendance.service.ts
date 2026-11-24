import { apiClient } from "@/lib/api-client";
import { ApiResponse, Attendance, Staff } from "@/types";

export interface DailyRegisterResponse {
  date: string;
  stats: {
    totalStaff: number;
    marked: number;
    unmarked: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    weeklyOff: number;
  };
  register: {
    staff: Staff;
    attendance: Attendance | null;
    isMarked: boolean;
  }[];
}

export interface MonthlyStaffRow {
  staff: Staff;
  dailyRecords: Record<
    number,
    {
      id: string;
      status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';
      checkInTime?: string;
      checkOutTime?: string;
      workingHours: number;
      overtimeHours: number;
      notes?: string;
    } | null
  >;
  summary: {
    presentCount: number;
    absentCount: number;
    halfDayCount: number;
    leaveCount: number;
    weeklyOffCount: number;
    totalRecordedDays: number;
    totalWorkingHours: number;
    totalOvertimeHours: number;
    attendanceRate: number;
  };
}

export interface MonthlyMatrixResponse {
  year: number;
  month: number;
  daysInMonth: number;
  overallStats: {
    year: number;
    month: number;
    daysInMonth: number;
    totalStaff: number;
    totalPresent: number;
    totalAbsent: number;
    totalHalfDay: number;
    totalLeave: number;
    totalWeeklyOff: number;
    totalWorkingHours: number;
    totalOvertimeHours: number;
  };
  staffRows: MonthlyStaffRow[];
}

export interface BulkMarkAttendancePayload {
  attendanceDate: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';
  staffIds?: string[];
  department?: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

export const attendanceService = {
  async getDailyRegister(date?: string, department?: string): Promise<DailyRegisterResponse> {
    const res = await apiClient.get<ApiResponse<DailyRegisterResponse>>("/attendance/daily", {
      params: { date, department },
    });
    return res.data.data;
  },

  async getMonthlyMatrix(year: number, month: number, department?: string): Promise<MonthlyMatrixResponse> {
    const res = await apiClient.get<ApiResponse<MonthlyMatrixResponse>>("/attendance/matrix", {
      params: { year, month, department },
    });
    return res.data.data;
  },

  async getMonthly(year: number, month: number, staffId?: string): Promise<Attendance[]> {
    const res = await apiClient.get<ApiResponse<Attendance[]>>("/attendance/monthly", {
      params: { year, month, staffId },
    });
    return res.data.data;
  },

  async getStaffHistory(staffId: string, params?: any): Promise<{
    items: Attendance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>(`/attendance/staff/${staffId}`, { params });
    return res.data.data;
  },

  async markAttendance(data: {
    staffId: string;
    attendanceDate: string;
    attendanceStatus: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';
    checkInTime?: string;
    checkOutTime?: string;
    workingHours?: number;
    overtimeHours?: number;
    notes?: string;
  }): Promise<Attendance> {
    const res = await apiClient.post<ApiResponse<Attendance>>("/attendance", data);
    return res.data.data;
  },

  async bulkMarkAttendance(data: BulkMarkAttendancePayload): Promise<{
    success: boolean;
    count: number;
    attendanceDate: string;
    attendanceStatus: string;
  }> {
    const res = await apiClient.post<ApiResponse<any>>("/attendance/bulk", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const res = await apiClient.patch<ApiResponse<Attendance>>(`/attendance/${id}`, data);
    return res.data.data;
  },
};
