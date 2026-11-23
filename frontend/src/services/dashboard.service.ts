import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  DashboardStats,
  DashboardAnalytics,
  RecentBookingItem,
  RecentActivityItem,
} from "@/types";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return res.data.data;
  },

  async getAnalytics(): Promise<DashboardAnalytics> {
    const res = await apiClient.get<ApiResponse<DashboardAnalytics>>("/dashboard/analytics");
    return res.data.data;
  },

  async getRecentBookings(limit = 6): Promise<RecentBookingItem[]> {
    const res = await apiClient.get<ApiResponse<RecentBookingItem[]>>(`/dashboard/recent-bookings?limit=${limit}`);
    return res.data.data;
  },

  async getRecentActivities(limit = 10): Promise<RecentActivityItem[]> {
    const res = await apiClient.get<ApiResponse<RecentActivityItem[]>>(`/dashboard/recent-activities?limit=${limit}`);
    return res.data.data;
  },

  async getOccupancyStats(): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>("/dashboard/occupancy-stats");
    return res.data.data;
  },
};
