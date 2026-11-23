import { apiClient } from "@/lib/api-client";
import { ApiResponse, Room, RoomType } from "@/types";

export const roomsService = {
  async findAll(params?: { status?: string; roomTypeId?: string; floor?: number; search?: string; page?: number; limit?: number }): Promise<{
    items: Room[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/rooms", { params });
    return res.data.data;
  },

  async findAvailable(params?: { checkIn?: string; checkOut?: string; roomTypeId?: string }): Promise<Room[]> {
    const res = await apiClient.get<ApiResponse<Room[]>>("/rooms/available", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Room> {
    const res = await apiClient.get<ApiResponse<Room>>(`/rooms/${id}`);
    return res.data.data;
  },

  async create(data: any): Promise<Room> {
    const res = await apiClient.post<ApiResponse<Room>>("/rooms", data);
    return res.data.data;
  },

  async update(id: string, data: any): Promise<Room> {
    const res = await apiClient.patch<ApiResponse<Room>>(`/rooms/${id}`, data);
    return res.data.data;
  },

  async updateStatus(id: string, status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"): Promise<Room> {
    const res = await apiClient.patch<ApiResponse<Room>>(`/rooms/${id}/status`, { status });
    return res.data.data;
  },

  async remove(id: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/rooms/${id}`);
    return res.data.data;
  },

  // Room Types
  async findAllTypes(): Promise<RoomType[]> {
    const res = await apiClient.get<ApiResponse<RoomType[]>>("/room-types");
    return res.data.data;
  },

  async createType(data: any): Promise<RoomType> {
    const res = await apiClient.post<ApiResponse<RoomType>>("/room-types", data);
    return res.data.data;
  },

  async updateType(id: string, data: any): Promise<RoomType> {
    const res = await apiClient.patch<ApiResponse<RoomType>>(`/room-types/${id}`, data);
    return res.data.data;
  },

  async removeType(id: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/room-types/${id}`);
    return res.data.data;
  },
};
