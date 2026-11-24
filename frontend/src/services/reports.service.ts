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

export interface ReportTypeItem {
  id: string;
  title: string;
  description: string;
}

export interface ReportTypesCatalog {
  hotelReports: ReportTypeItem[];
  staffReports: ReportTypeItem[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: "text" | "currency" | "badge" | "date";
}

export interface ReportResponse {
  reportType: string;
  reportTitle: string;
  category: "HOTEL" | "STAFF" | "EXECUTIVE";
  description: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: Record<string, string | number>;
  columns: ReportColumn[];
  rows: any[];
  summary?: Record<string, any>;
}

export interface QueryReportParams {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const reportsService = {
  async getReportTypes(): Promise<ReportTypesCatalog> {
    const res = await apiClient.get<ApiResponse<ReportTypesCatalog>>("/reports/report-types");
    return res.data.data;
  },

  async getExecutiveReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ExecutiveReportData> {
    const res = await apiClient.get<ApiResponse<ExecutiveReportData>>("/reports/executive", {
      params,
    });
    return res.data.data;
  },

  async generateReport(
    reportType: string,
    params?: QueryReportParams
  ): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>(`/reports/${reportType}`, {
      params,
    });
    return res.data.data;
  },
};
