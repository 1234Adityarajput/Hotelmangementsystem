import { apiClient } from "@/lib/api-client";
import { ApiResponse, Invoice } from "@/types";

export const billingService = {
  async findAll(params?: { status?: string; bookingId?: string; search?: string; page?: number; limit?: number }): Promise<{
    items: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/invoices", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Invoice> {
    const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return res.data.data;
  },

  async findByBooking(bookingId: string): Promise<Invoice[]> {
    const res = await apiClient.get<ApiResponse<Invoice[]>>(`/invoices/booking/${bookingId}`);
    return res.data.data;
  },

  async generateInvoice(data: {
    bookingId: string;
    discountType?: "PERCENTAGE" | "FIXED";
    discountValue?: number;
    taxPercentage?: number;
    invoiceDate?: string;
  }): Promise<Invoice> {
    const res = await apiClient.post<ApiResponse<Invoice>>("/invoices/generate", data);
    return res.data.data;
  },

  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/cancel`, { reason });
    return res.data.data;
  },
};
