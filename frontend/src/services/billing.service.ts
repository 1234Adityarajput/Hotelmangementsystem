import { apiClient } from "@/lib/api-client";
import { ApiResponse, Invoice, BillingComponentBreakdown, ActiveFoliosResponse } from "@/types";

export const billingService = {
  async findAll(params?: {
    status?: string;
    bookingId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
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

  async getActiveFolios(search?: string): Promise<ActiveFoliosResponse> {
    const res = await apiClient.get<ApiResponse<ActiveFoliosResponse>>("/invoices/active-folios", {
      params: { search },
    });
    return res.data.data;
  },

  async getLiveBillingFolio(bookingId: string, taxPercentage?: number): Promise<BillingComponentBreakdown> {
    const res = await apiClient.get<ApiResponse<BillingComponentBreakdown>>(`/invoices/live/${bookingId}`, {
      params: { taxPercentage },
    });
    return res.data.data;
  },

  async quickPostCharge(data: {
    bookingId: string;
    itemName: string;
    unitPrice: number;
    quantity: number;
    category?: string;
    itemId?: string;
    notes?: string;
  }): Promise<{ message: string; bookingItem: any; updatedFolio: BillingComponentBreakdown }> {
    const res = await apiClient.post<ApiResponse<any>>("/invoices/quick-post-charge", data);
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

  async remove(id: string): Promise<{ success: boolean; message: string; invoiceNumber?: string; itemName?: string }> {
    const res = await apiClient.delete<ApiResponse<any>>(`/invoices/${id}`);
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
    const res = await apiClient.get<ApiResponse<any>>("/invoices/history", { params });
    return res.data.data;
  },
};
