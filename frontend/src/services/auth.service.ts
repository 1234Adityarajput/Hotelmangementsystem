import { apiClient } from "@/lib/api-client";
import { ApiResponse, AuthLoginResponse } from "@/types";

export const authService = {
  async login(emailOrUsername: string, password: string): Promise<AuthLoginResponse> {
    const res = await apiClient.post<ApiResponse<AuthLoginResponse>>("/auth/login", {
      email: emailOrUsername,
      password,
    });
    const data = res.data.data;
    if (data.accessToken && typeof window !== "undefined") {
      localStorage.setItem("hotel_admin_token", data.accessToken);
      localStorage.setItem("hotel_admin_user", JSON.stringify(data.admin));
    }
    return data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hotel_admin_token");
      localStorage.removeItem("hotel_admin_user");
    }
  },

  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hotel_admin_token");
    }
    return null;
  },

  getStoredUser(): any {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("hotel_admin_user");
      return u ? JSON.parse(u) : null;
    }
    return null;
  },

  async getAuthStatus(): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>("/auth/status");
    return res.data.data;
  },
};
