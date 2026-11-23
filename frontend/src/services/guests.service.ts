import { apiClient } from "@/lib/api-client";
import { ApiResponse, Guest, GuestDocument, AdditionalGuest } from "@/types";

export const guestsService = {
  async findAll(params?: { search?: string; page?: number; limit?: number }): Promise<{
    items: Guest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/guests", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Guest> {
    const res = await apiClient.get<ApiResponse<Guest>>(`/guests/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Guest>): Promise<Guest> {
    const res = await apiClient.post<ApiResponse<Guest>>("/guests", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Guest>): Promise<Guest> {
    const res = await apiClient.patch<ApiResponse<Guest>>(`/guests/${id}`, data);
    return res.data.data;
  },

  async addDocument(
    guestId: string,
    data: { documentType: string; documentNumber: string; documentFileReference: string }
  ): Promise<GuestDocument> {
    const res = await apiClient.post<ApiResponse<GuestDocument>>(`/guests/${guestId}/documents`, data);
    return res.data.data;
  },

  async deleteDocument(guestId: string, docId: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/guests/${guestId}/documents/${docId}`);
    return res.data.data;
  },

  async addCoGuest(guestId: string, data: AdditionalGuest): Promise<Guest> {
    const res = await apiClient.post<ApiResponse<Guest>>(`/guests/${guestId}/co-guests`, data);
    return res.data.data;
  },

  async deleteCoGuest(guestId: string, coGuestId: string): Promise<Guest> {
    const res = await apiClient.delete<ApiResponse<Guest>>(`/guests/${guestId}/co-guests/${coGuestId}`);
    return res.data.data;
  },
};
