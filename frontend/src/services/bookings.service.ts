import { apiClient } from "@/lib/api-client";
import { ApiResponse, Booking } from "@/types";

export const bookingsService = {
  async findAll(params?: { status?: string; roomId?: string; guestId?: string; search?: string; page?: number; limit?: number }): Promise<{
    items: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/bookings", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Booking> {
    const res = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return res.data.data;
  },

  async create(data: any): Promise<Booking> {
    const res = await apiClient.post<ApiResponse<Booking>>("/bookings", data);
    return res.data.data;
  },

  async update(id: string, data: any): Promise<Booking> {
    const res = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}`, data);
    return res.data.data;
  },

  async cancel(id: string, reason?: string): Promise<Booking> {
    const res = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
    return res.data.data;
  },

  // Stays & Operational Check-in / Check-out
  async getTodayCheckIns(): Promise<Booking[]> {
    const res = await apiClient.get<ApiResponse<Booking[]>>("/stays/today-check-ins");
    return res.data.data;
  },

  async getTodayCheckOuts(): Promise<Booking[]> {
    const res = await apiClient.get<ApiResponse<Booking[]>>("/stays/today-check-outs");
    return res.data.data;
  },

  async getActiveStays(): Promise<Booking[]> {
    const res = await apiClient.get<ApiResponse<Booking[]>>("/stays/active");
    return res.data.data;
  },

  async checkIn(id: string): Promise<Booking> {
    const res = await apiClient.post<ApiResponse<Booking>>(`/stays/${id}/check-in`);
    return res.data.data;
  },

  async checkOut(id: string): Promise<Booking> {
    const res = await apiClient.post<ApiResponse<Booking>>(`/stays/${id}/check-out`);
    return res.data.data;
  },

  async relocate(id: string, newRoomId: string, reason?: string): Promise<Booking> {
    const res = await apiClient.post<ApiResponse<Booking>>(`/stays/${id}/relocate`, {
      newRoomId,
      reason,
    });
    return res.data.data;
  },
};
