import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-category.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateExpenseReference(): Promise<string> {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const prefix = `EXP-${yearMonth}-`;

    const lastExpense = await this.prisma.expense.findFirst({
      where: { expenseReference: { startsWith: prefix } },
      orderBy: { expenseReference: 'desc' },
      select: { expenseReference: true },
    });

    let nextNumber = 1;
    if (lastExpense?.expenseReference) {
      const parts = lastExpense.expenseReference.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  // Categories
  async findAllCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { expenses: true } },
      },
    });
  }

  async createCategory(dto: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Expense category "${dto.name}" already exists`);
    }

    return this.prisma.expenseCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { expenses: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Expense category with ID ${id} not found`);
    }

    const linkedCount = category._count?.expenses || 0;

    // If there are expenses linked to this category, safely reassign them to a fallback category
    if (linkedCount > 0) {
      let fallback = await this.prisma.expenseCategory.findFirst({
        where: {
          id: { not: id },
          name: { in: ['Miscellaneous Expenses', 'General Operations', 'Other Expenses'] },
        },
      });

      if (!fallback) {
        fallback = await this.prisma.expenseCategory.findFirst({
          where: { id: { not: id } },
        });
      }

      if (fallback) {
        await this.prisma.expense.updateMany({
          where: { expenseCategoryId: id },
          data: { expenseCategoryId: fallback.id },
        });
      } else {
        throw new BadRequestException('Cannot delete the only existing expense category while active expenses exist.');
      }
    }

    await this.prisma.expenseCategory.delete({
      where: { id },
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'EXPENSE_CATEGORY',
          entityId: id,
          action: 'DELETE',
          previousValues: {
            name: category.name,
            description: category.description,
            linkedExpensesCount: linkedCount,
          },
          description: `Deleted expense category "${category.name}"${linkedCount > 0 ? ` (${linkedCount} linked expenses reassigned to fallback category)` : ''}.`,
        },
      });
    } catch {
      // Non-blocking audit log
    }

    return {
      message: `Expense category "${category.name}" deleted successfully`,
      deletedCategoryId: id,
      reassignedExpensesCount: linkedCount,
    };
  }

  // Expenses
  async create(dto: CreateExpenseDto) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.expenseCategoryId },
    });
    if (!category) {
      throw new NotFoundException(`Expense category with ID ${dto.expenseCategoryId} not found`);
    }

    const expenseReference = await this.generateExpenseReference();
    const amount = Math.round(Number(dto.amount) * 100) / 100;

    const expense = await this.prisma.expense.create({
      data: {
        expenseReference,
        expenseCategoryId: dto.expenseCategoryId,
        description: dto.description,
        amount,
        paymentMethod: dto.paymentMethod,
        paymentDate: new Date(dto.paymentDate),
        transactionReference: dto.transactionReference,
        notes: dto.notes,
      },
      include: {
        category: true,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'EXPENSE',
        entityId: expense.id,
        action: 'CREATE',
        newValues: {
          expenseReference,
          category: category.name,
          amount,
          description: expense.description,
        },
        description: `Recorded expense of ₹${amount} (${expenseReference}) under ${category.name}`,
      },
    });

    return expense;
  }

  async findAll(query: QueryExpenseDto) {
    const { search, categoryId, paymentMethod, startDate, endDate, page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId && categoryId !== 'ALL') where.expenseCategoryId = categoryId;
    if (paymentMethod && paymentMethod !== ('ALL' as any)) where.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { expenseReference: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { transactionReference: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          category: true,
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    const amount = dto.amount !== undefined ? Math.round(Number(dto.amount) * 100) / 100 : existing.amount;

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        expenseCategoryId: dto.expenseCategoryId,
        description: dto.description,
        amount,
        paymentMethod: dto.paymentMethod,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        transactionReference: dto.transactionReference,
        notes: dto.notes,
      },
      include: { category: true },
    });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'EXPENSE',
        entityId: id,
        action: 'UPDATE',
        previousValues: { amount: existing.amount, description: existing.description },
        newValues: { amount: updated.amount, description: updated.description },
        description: `Updated expense record ${updated.expenseReference}`,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot full expense into AuditLog
      await tx.auditLog.create({
        data: {
          entityType: 'EXPENSE',
          entityId: id,
          action: 'DELETE',
          previousValues: {
            ...existing,
            categoryName: existing.category?.name || 'General Operations',
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted expense record ${existing.expenseReference} (₹${existing.amount}) under ${existing.category?.name || 'General'}. Preserved in audit history.`,
        },
      });

      // 2. Delete from database
      await tx.expense.delete({ where: { id } });

      return {
        success: true,
        message: `Expense ${existing.expenseReference} deleted successfully and archived in Monthly History.`,
        expenseReference: existing.expenseReference,
      };
    });
  }

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch active expenses for this month
    const activeExpenses = await this.prisma.expense.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    const enrichedActive = activeExpenses.map((e) => ({
      id: e.id,
      expenseReference: e.expenseReference,
      expenseCategoryId: e.expenseCategoryId,
      categoryName: e.category?.name || 'General Operations',
      description: e.description,
      amount: Number(e.amount),
      paymentMethod: e.paymentMethod,
      paymentDate: e.paymentDate.toISOString().split('T')[0],
      transactionReference: e.transactionReference,
      notes: e.notes,
      createdAt: e.createdAt,
      isDeleted: false,
    }));

    // 2. Fetch deleted expenses from AuditLog
    const deletedLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'EXPENSE',
        action: 'DELETE',
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    const deletedItems = deletedLogs.map((log) => {
      const prev: any = log.previousValues || {};
      const pDate = prev.paymentDate ? new Date(prev.paymentDate).toISOString().split('T')[0] : log.changedAt.toISOString().split('T')[0];
      return {
        id: log.entityId,
        expenseReference: prev.expenseReference || prev.reference || 'EXP-ARCHIVED',
        expenseCategoryId: prev.expenseCategoryId || '',
        categoryName: prev.categoryName || prev.category || 'General Operations',
        description: prev.description || 'Deleted Expense Record',
        amount: Number(prev.amount || 0),
        paymentMethod: prev.paymentMethod || 'CASH',
        paymentDate: pDate,
        transactionReference: prev.transactionReference || '',
        notes: prev.notes || '',
        createdAt: prev.createdAt || log.changedAt,
        deletedAt: log.changedAt,
        isDeleted: true,
      };
    });

    const allHistory = [...enrichedActive, ...deletedItems].sort(
      (a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime()
    );

    return {
      month,
      year,
      monthName: startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalCount: allHistory.length,
      activeCount: enrichedActive.length,
      deletedCount: deletedItems.length,
      totalAmount: allHistory.reduce((sum, r) => sum + (r.amount || 0), 0),
      items: allHistory,
    };
  }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayYear = new Date(now.getFullYear(), 0, 1);

    const [todayAgg, monthAgg, yearAgg, categoryAgg] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: firstDayMonth } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: firstDayYear } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const categories = await this.prisma.expenseCategory.findMany();
    const catMap = new Map<string, string>();
    categories.forEach((c) => catMap.set(c.id, c.name));

    return {
      todayAmount: Number(todayAgg._sum.amount || 0),
      todayCount: todayAgg._count.id,
      monthAmount: Number(monthAgg._sum.amount || 0),
      monthCount: monthAgg._count.id,
      yearAmount: Number(yearAgg._sum.amount || 0),
      yearCount: yearAgg._count.id,
      byCategory: categoryAgg.map((ca) => ({
        categoryId: ca.expenseCategoryId,
        categoryName: catMap.get(ca.expenseCategoryId) || 'Unknown',
        amount: Number(ca._sum.amount || 0),
        count: ca._count.id,
      })),
    };
  }
}
