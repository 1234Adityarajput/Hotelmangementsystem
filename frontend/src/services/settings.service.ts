import { apiClient } from "@/lib/api-client";
import { ApiResponse, HotelSetting } from "@/types";

export interface SystemHealthData {
  status: string;
  database: {
    provider: string;
    status: string;
    latencyMs: number;
  };
  server: {
    uptimeSeconds: number;
    timestamp: string;
    nodeVersion: string;
    environment: string;
  };
  backupStatus: {
    strategy: string;
    pointInTimeRecovery: string;
    automatedDailyRetention: string;
  };
}

export const settingsService = {
  async getSettings(): Promise<HotelSetting> {
    const res = await apiClient.get<ApiResponse<HotelSetting>>("/settings");
    return res.data.data;
  },

  async updateSettings(data: Partial<HotelSetting>): Promise<HotelSetting> {
    const res = await apiClient.patch<ApiResponse<HotelSetting>>("/settings", data);
    return res.data.data;
  },

  async getHealth(): Promise<SystemHealthData> {
    const res = await apiClient.get<ApiResponse<SystemHealthData>>("/settings/health");
    return res.data.data;
  },
};
