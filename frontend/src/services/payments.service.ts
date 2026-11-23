import { apiClient } from "@/lib/api-client";
import { ApiResponse, Payment } from "@/types";

export const paymentsService = {
  async findAll(params?: { status?: string; method?: string; bookingId?: string; invoiceId?: string; page?: number; limit?: number }): Promise<{
    items: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/payments", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Payment> {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data.data;
  },

  async findByBooking(bookingId: string): Promise<Payment[]> {
    const res = await apiClient.get<ApiResponse<Payment[]>>(`/payments/booking/${bookingId}`);
    return res.data.data;
  },

  async recordPayment(data: {
    bookingId: string;
    invoiceId?: string;
    paymentType: "ADVANCE" | "PARTIAL" | "FINAL" | "REFUND";
    paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
    amount: number;
    transactionReference?: string;
    paymentDate?: string;
    notes?: string;
  }): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>("/payments", data);
    return res.data.data;
  },
};
