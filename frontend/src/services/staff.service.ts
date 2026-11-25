import { apiClient } from "@/lib/api-client";
import { ApiResponse, Staff } from "@/types";

export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
  resigned: number;
  departments: { department: string; count: number }[];
}

export const staffService = {
  async getStats(): Promise<StaffStats> {
    const res = await apiClient.get<ApiResponse<StaffStats>>("/staff/stats");
    return res.data.data;
  },

  async findAll(params?: {
    search?: string;
    department?: string;
    employmentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Staff[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/staff", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Staff> {
    const res = await apiClient.get<ApiResponse<Staff>>(`/staff/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Staff>): Promise<Staff> {
    const res = await apiClient.post<ApiResponse<Staff>>("/staff", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Staff>): Promise<Staff> {
    const res = await apiClient.patch<ApiResponse<Staff>>(`/staff/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<{ message: string; staff?: Staff }> {
    const res = await apiClient.delete<ApiResponse<any>>(`/staff/${id}`);
    return res.data.data;
  },

  async getHistory(params?: { month?: number; year?: number }): Promise<{
    month: number;
    year: number;
    monthName: string;
    totalCount: number;
    activeCount: number;
    deletedCount: number;
    items: any[];
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/staff/history", { params });
    return res.data.data;
  },
};
