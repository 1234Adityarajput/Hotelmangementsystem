import { apiClient } from "@/lib/api-client";
import { ApiResponse, HealthResponse } from "@/types";

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<ApiResponse<HealthResponse>>("/health");
    // If backend returns wrapped response from TransformInterceptor:
    return response.data.data || (response.data as unknown as HealthResponse);
  },
};
