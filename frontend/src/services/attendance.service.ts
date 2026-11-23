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

export const attendanceService = {
  async getDailyRegister(date?: string, department?: string): Promise<DailyRegisterResponse> {
    const res = await apiClient.get<ApiResponse<DailyRegisterResponse>>("/attendance/daily", {
      params: { date, department },
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

  async update(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const res = await apiClient.patch<ApiResponse<Attendance>>(`/attendance/${id}`, data);
    return res.data.data;
  },
};
