import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export interface ExecutiveReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  operations: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
    totalGuests: number;
    totalBookings: number;
    cancelledBookings: number;
    roomTypeOccupancy: {
      roomTypeName: string;
      totalRooms: number;
      occupiedRooms: number;
      occupancyRate: number;
    }[];
  };
  financials: {
    totalCollectedRevenue: number;
    inflowTransactionsCount: number;
    totalInvoiced: number;
    totalOutstandingReceivables: number;
    totalTaxCollected: number;
    totalDiscountsGiven: number;
    totalOperatingExpenses: number;
    expenseTransactionsCount: number;
    totalPayrollDisbursed: number;
    totalPayrollObligation: number;
    pendingPayrollBalance: number;
    netCashFlow: number;
    paymentsByMethod: {
      method: string;
      amount: number;
      count: number;
    }[];
    expensesByCategory: {
      category: string;
      amount: number;
      count: number;
    }[];
  };
  staff: {
    activeStaffCount: number;
  };
}

export const reportsService = {
  async getExecutiveReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ExecutiveReportData> {
    const res = await apiClient.get<ApiResponse<ExecutiveReportData>>("/reports/executive", {
      params,
    });
    return res.data.data;
  },
};
