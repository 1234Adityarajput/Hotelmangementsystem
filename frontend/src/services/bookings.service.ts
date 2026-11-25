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

  async remove(id: string): Promise<{ success: boolean; message: string; bookingNumber: string }> {
    const res = await apiClient.delete<ApiResponse<any>>(`/bookings/${id}`);
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
    const res = await apiClient.get<ApiResponse<any>>("/bookings/history", { params });
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

  async getCompletedStays(params?: { search?: string; page?: number; limit?: number }): Promise<{
    items: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/stays/completed", { params });
    return res.data.data;
  },

  async getCheckoutSummary(id: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/stays/${id}/checkout-summary`);
    return res.data.data;
  },

  async checkIn(
    id: string,
    data?: { checkInTime?: string; advanceAmount?: number; advancePaymentMethod?: string }
  ): Promise<Booking> {
    const res = await apiClient.post<ApiResponse<Booking>>(`/stays/${id}/check-in`, data || {});
    return res.data.data;
  },

  async checkOut(id: string, data?: any): Promise<{ booking: Booking; invoice: any; checkoutFolio: any }> {
    const res = await apiClient.post<ApiResponse<any>>(`/stays/${id}/check-out`, data || {});
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

export const staysService = bookingsService;
