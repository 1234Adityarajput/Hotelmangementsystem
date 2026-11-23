import { apiClient } from "@/lib/api-client";
import { ApiResponse, Item, ItemCategory, BookingItem } from "@/types";

export const itemsService = {
  // Categories
  async findAllCategories(): Promise<ItemCategory[]> {
    const res = await apiClient.get<ApiResponse<ItemCategory[]>>("/item-categories");
    return res.data.data;
  },

  async createCategory(data: any): Promise<ItemCategory> {
    const res = await apiClient.post<ApiResponse<ItemCategory>>("/item-categories", data);
    return res.data.data;
  },

  async updateCategory(id: string, data: any): Promise<ItemCategory> {
    const res = await apiClient.patch<ApiResponse<ItemCategory>>(`/item-categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/item-categories/${id}`);
    return res.data.data;
  },

  // Catalog Items
  async findAllItems(categoryId?: string, search?: string): Promise<Item[]> {
    const res = await apiClient.get<ApiResponse<Item[]>>("/items", {
      params: { categoryId, search },
    });
    return res.data.data;
  },

  async createItem(data: any): Promise<Item> {
    const res = await apiClient.post<ApiResponse<Item>>("/items", data);
    return res.data.data;
  },

  async updateItem(id: string, data: any): Promise<Item> {
    const res = await apiClient.patch<ApiResponse<Item>>(`/items/${id}`, data);
    return res.data.data;
  },

  async deleteItem(id: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/items/${id}`);
    return res.data.data;
  },

  // Booking Items
  async findBookingItems(bookingId: string): Promise<BookingItem[]> {
    const res = await apiClient.get<ApiResponse<BookingItem[]>>(`/booking-items/booking/${bookingId}`);
    return res.data.data;
  },

  async addBookingItem(data: any): Promise<BookingItem> {
    const res = await apiClient.post<ApiResponse<BookingItem>>("/booking-items", data);
    return res.data.data;
  },

  async deleteBookingItem(id: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(`/booking-items/${id}`);
    return res.data.data;
  },
};
