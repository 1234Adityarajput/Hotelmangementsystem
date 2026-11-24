import { apiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types";

export interface RegisterResponse {
  type: string;
  title?: string;
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: any;
}

export const registersService = {
  async getRegister(params: {
    type: string;
    search?: string;
    roomNumber?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<RegisterResponse> {
    const res = await apiClient.get<ApiResponse<RegisterResponse>>("/registers", { params });
    return res.data.data;
  },
};
