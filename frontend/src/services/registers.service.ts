import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export const registersService = {
  async getRegister(params: {
    type: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    type: string;
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/registers", { params });
    return res.data.data;
  },
};
