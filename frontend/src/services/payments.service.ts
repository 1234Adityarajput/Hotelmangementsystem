import { apiClient } from "@/lib/api-client";
import { ApiResponse, Payment } from "@/types";

export interface PaymentStats {
  totalCollected: number;
  totalCount: number;
  todayCollected: number;
  todayCount: number;
  monthCollected: number;
  monthCount: number;
  advanceCollected: number;
  advanceCount: number;
  partialCollected: number;
  partialCount: number;
  finalCollected: number;
  finalCount: number;
  cashCollected: number;
  cashCount: number;
  upiCollected: number;
  upiCount: number;
  bankCollected: number;
  bankCount: number;
  otherCollected: number;
  otherCount: number;
  pendingBalanceTotal: number;
  pendingBalanceCount: number;
}

export interface PendingPaymentItem {
  id: string;
  recordType: "INVOICE" | "STAY_FOLIO";
  referenceNumber: string;
  bookingId: string;
  invoiceId?: string | null;
  guestName: string;
  mobileNumber: string;
  roomNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  createdAt: string;
}

export const paymentsService = {
  async findAll(params?: {
    status?: string;
    method?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    bookingId?: string;
    invoiceId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
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

  async getStats(): Promise<PaymentStats> {
    const res = await apiClient.get<ApiResponse<PaymentStats>>("/payments/stats");
    return res.data.data;
  },

  async getPendingPayments(): Promise<{
    items: PendingPaymentItem[];
    totalCount: number;
    totalOutstanding: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/payments/pending");
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
