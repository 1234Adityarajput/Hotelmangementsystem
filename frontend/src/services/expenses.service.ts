import { apiClient } from "@/lib/api-client";
import { ApiResponse, Expense, ExpenseCategory } from "@/types";

export interface ExpenseStats {
  todayAmount: number;
  todayCount: number;
  monthAmount: number;
  monthCount: number;
  yearAmount: number;
  yearCount: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
  }[];
}

export interface ExpenseHistoryItem {
  id: string;
  expenseReference: string;
  expenseCategoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference?: string;
  notes?: string;
  createdAt: string;
  deletedAt?: string;
  isDeleted: boolean;
}

export interface MonthlyExpenseHistoryResponse {
  month: number;
  year: number;
  monthName: string;
  totalCount: number;
  activeCount: number;
  deletedCount: number;
  totalAmount: number;
  items: ExpenseHistoryItem[];
}

export const expensesService = {
  async getStats(): Promise<ExpenseStats> {
    const res = await apiClient.get<ApiResponse<ExpenseStats>>("/expenses/stats");
    return res.data.data;
  },

  async findAll(params?: {
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<ApiResponse<any>>("/expenses", { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Expense> {
    const res = await apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return res.data.data;
  },

  async create(data: {
    expenseCategoryId: string;
    description: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
    paymentDate: string;
    transactionReference?: string;
    notes?: string;
  }): Promise<Expense> {
    const res = await apiClient.post<ApiResponse<Expense>>("/expenses", data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    const res = await apiClient.patch<ApiResponse<Expense>>(`/expenses/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiResponse<any>>(`/expenses/${id}`);
    return res.data.data;
  },

  async findAllCategories(): Promise<ExpenseCategory[]> {
    const res = await apiClient.get<ApiResponse<ExpenseCategory[]>>("/expenses/categories");
    return res.data.data;
  },

  async createCategory(data: { name: string; description?: string }): Promise<ExpenseCategory> {
    const res = await apiClient.post<ApiResponse<ExpenseCategory>>("/expenses/categories", data);
    return res.data.data;
  },

  async getHistory(params?: { month?: number; year?: number }): Promise<MonthlyExpenseHistoryResponse> {
    const res = await apiClient.get<ApiResponse<MonthlyExpenseHistoryResponse>>("/expenses/history", { params });
    return res.data.data;
  },
};
