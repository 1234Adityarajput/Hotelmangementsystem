import { apiClient } from "@/lib/api-client";
import { ApiResponse, StaffAdvance } from "@/types";

export interface AdvanceStats {
  totalIssued: number;
  totalRecovered: number;
  totalOutstanding: number;
  statusCounts: {
    PENDING: number;
    PARTIALLY_REPAID: number;
    REPAID: number;
    WAIVED: number;
  };
}

export const advancesService = {
  async getStats(): Promise<AdvanceStats> {
    const res = await apiClient.get<ApiResponse<AdvanceStats>>("/advances/stats");
    return res.data.data;
  },

  async findAll(params?: {
    staffId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: StaffAdvance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/advances", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<StaffAdvance> {
    const res = await apiClient.get<ApiResponse<StaffAdvance>>(`/advances/${id}`);
    return res.data.data;
  },

  async issueAdvance(data: {
    staffId: string;
    amount: number;
    advanceDate: string;
    paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
    notes?: string;
  }): Promise<StaffAdvance> {
    const res = await apiClient.post<ApiResponse<StaffAdvance>>("/advances", data);
    return res.data.data;
  },

  async recordRepayment(
    id: string,
    data: { amount: number; notes?: string },
  ): Promise<StaffAdvance> {
    const res = await apiClient.post<ApiResponse<StaffAdvance>>(`/advances/${id}/repay`, data);
    return res.data.data;
  },
};
