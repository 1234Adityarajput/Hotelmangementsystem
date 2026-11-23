import { apiClient } from "@/lib/api-client";
import { ApiResponse, AuditLog } from "@/types";

export const auditLogsService = {
  async findAll(params?: {
    entityType?: string;
    action?: string;
    entityId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/audit-logs", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<AuditLog> {
    const res = await apiClient.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
    return res.data.data;
  },
};
