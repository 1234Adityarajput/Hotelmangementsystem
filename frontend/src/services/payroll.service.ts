import { apiClient } from "@/lib/api-client";
import { ApiResponse, SalaryRecord, SalaryPayment } from "@/types";

export interface PayrollStats {
  totalNetPayable: number;
  totalPaid: number;
  totalBalance: number;
  statusCounts: {
    DRAFT: number;
    FINALIZED: number;
    PAID: number;
    CANCELLED: number;
  };
}

export const payrollService = {
  async getStats(month?: number, year?: number): Promise<PayrollStats> {
    const res = await apiClient.get<ApiResponse<PayrollStats>>("/payroll/stats", {
      params: { month, year },
    });
    return res.data.data;
  },

  async findAll(params?: {
    staffId?: string;
    month?: number;
    year?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: SalaryRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/payroll", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<SalaryRecord> {
    const res = await apiClient.get<ApiResponse<SalaryRecord>>(`/payroll/${id}`);
    return res.data.data;
  },

  async generatePayroll(data: {
    staffId: string;
    payrollMonth: number;
    payrollYear: number;
    configuredSalaryDays?: number;
    payableDays?: number;
    deductions?: number;
    advanceDeductions?: number;
    staffAdvanceId?: string;
  }): Promise<SalaryRecord> {
    const res = await apiClient.post<ApiResponse<SalaryRecord>>("/payroll/generate", data);
    return res.data.data;
  },

  async recordSalaryPayment(data: {
    salaryRecordId: string;
    paymentAmount: number;
    paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
    paymentDate: string;
    transactionReference?: string;
    notes?: string;
  }): Promise<{ payment: SalaryPayment; salaryRecord: SalaryRecord }> {
    const res = await apiClient.post<ApiResponse<any>>("/payroll/disburse", data);
    return res.data.data;
  },
};
