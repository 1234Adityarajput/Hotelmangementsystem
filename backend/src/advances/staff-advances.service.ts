import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IssueAdvanceDto } from './dto/issue-advance.dto';
import { RepayAdvanceDto } from './dto/repay-advance.dto';
import { QueryAdvanceDto } from './dto/query-advance.dto';

@Injectable()
export class StaffAdvancesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateAdvanceReference(): Promise<string> {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const prefix = `ADV-${yearMonth}-`;

    const lastAdvance = await this.prisma.staffAdvance.findFirst({
      where: { advanceReference: { startsWith: prefix } },
      orderBy: { advanceReference: 'desc' },
      select: { advanceReference: true },
    });

    let nextNumber = 1;
    if (lastAdvance?.advanceReference) {
      const parts = lastAdvance.advanceReference.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async issueAdvance(dto: IssueAdvanceDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${dto.staffId} not found`);
    }

    if (staff.employmentStatus !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot issue advance to staff member with status ${staff.employmentStatus}`,
      );
    }

    const advanceReference = await this.generateAdvanceReference();
    const amount = Math.round(Number(dto.amount) * 100) / 100;

    const advance = await this.prisma.staffAdvance.create({
      data: {
        staffId: dto.staffId,
        advanceReference,
        amount,
        advanceDate: new Date(dto.advanceDate),
        paymentMethod: dto.paymentMethod,
        repaymentStatus: 'PENDING',
        recoveredAmount: 0.00,
        balanceAmount: amount,
        notes: dto.notes,
      },
      include: {
        staff: true,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'STAFF_ADVANCE',
        entityId: advance.id,
        action: 'CREATE',
        newValues: {
          advanceReference,
          staff: staff.fullName,
          amount,
          balance: amount,
        },
        description: `Disbursed advance of ₹${amount} (${advanceReference}) to ${staff.fullName}`,
      },
    });

    return advance;
  }

  async recordRepayment(id: string, dto: RepayAdvanceDto) {
    const advance = await this.prisma.staffAdvance.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!advance) {
      throw new NotFoundException(`Advance record with ID ${id} not found`);
    }

    if (advance.repaymentStatus === 'REPAID') {
      throw new BadRequestException('Advance is already fully repaid');
    }

    const currentBalance = Number(advance.balanceAmount);
    const repayAmount = Math.round(Number(dto.amount) * 100) / 100;

    if (repayAmount > currentBalance) {
      throw new BadRequestException(
        `Repayment amount (₹${repayAmount}) cannot exceed remaining balance (₹${currentBalance})`,
      );
    }

    const newRecovered = Math.round((Number(advance.recoveredAmount) + repayAmount) * 100) / 100;
    const newBalance = Math.round((Number(advance.amount) - newRecovered) * 100) / 100;
    const newStatus = newBalance <= 0 ? 'REPAID' : 'PARTIALLY_REPAID';

    const updated = await this.prisma.staffAdvance.update({
      where: { id },
      data: {
        recoveredAmount: newRecovered,
        balanceAmount: newBalance,
        repaymentStatus: newStatus,
        notes: dto.notes ? `${advance.notes || ''} | Repayment: ${dto.notes}`.trim() : advance.notes,
      },
      include: { staff: true },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'STAFF_ADVANCE',
        entityId: id,
        action: 'UPDATE',
        previousValues: { recovered: advance.recoveredAmount, balance: advance.balanceAmount, status: advance.repaymentStatus },
        newValues: { recovered: newRecovered, balance: newBalance, status: newStatus },
        description: `Recorded advance repayment of ₹${repayAmount} for ${advance.staff.fullName} (${advance.advanceReference}). Remaining balance: ₹${newBalance}`,
      },
    });

    return updated;
  }

  async findAll(query: QueryAdvanceDto) {
    const { staffId, status, startDate, endDate, page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (staffId) where.staffId = staffId;
    if (status && status !== ('ALL' as any)) where.repaymentStatus = status;

    if (startDate && endDate) {
      where.advanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.staffAdvance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { advanceDate: 'desc' },
        include: {
          staff: true,
          salaryRecord: true,
        },
      }),
      this.prisma.staffAdvance.count({ where }),
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
    const advance = await this.prisma.staffAdvance.findUnique({
      where: { id },
      include: {
        staff: true,
        salaryRecord: true,
      },
    });

    if (!advance) {
      throw new NotFoundException(`Advance record with ID ${id} not found`);
    }

    return advance;
  }

  async getStats() {
    const [totalIssuedAgg, totalRecoveredAgg, countByStatus] = await Promise.all([
      this.prisma.staffAdvance.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.staffAdvance.aggregate({
        _sum: { recoveredAmount: true, balanceAmount: true },
      }),
      this.prisma.staffAdvance.groupBy({
        by: ['repaymentStatus'],
        _count: { id: true },
      }),
    ]);

    const totalIssued = Number(totalIssuedAgg._sum.amount || 0);
    const totalRecovered = Number(totalRecoveredAgg._sum.recoveredAmount || 0);
    const totalOutstanding = Number(totalRecoveredAgg._sum.balanceAmount || 0);

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PARTIALLY_REPAID: 0,
      REPAID: 0,
      WAIVED: 0,
    };
    countByStatus.forEach((c) => {
      statusCounts[c.repaymentStatus] = c._count.id;
    });

    return {
      totalIssued,
      totalRecovered,
      totalOutstanding,
      statusCounts,
    };
  }

  async delete(id: string) {
    const existing = await this.prisma.staffAdvance.findUnique({
      where: { id },
      include: {
        staff: true,
        salaryRecord: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Advance record with ID ${id} not found`);
    }

    if (existing.salaryRecordId) {
      const pPeriod = existing.salaryRecord
        ? `${existing.salaryRecord.payrollMonth}/${existing.salaryRecord.payrollYear}`
        : existing.salaryRecordId;
      throw new BadRequestException(
        `Cannot delete advance voucher ${existing.advanceReference}: It is linked to processed payroll record for period ${pPeriod}`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot full advance details into AuditLog for permanent history preservation
      await tx.auditLog.create({
        data: {
          entityType: 'STAFF_ADVANCE',
          entityId: id,
          action: 'DELETE',
          previousValues: {
            ...existing,
            staffName: existing.staff.fullName,
            employeeCode: existing.staff.employeeCode,
            department: existing.staff.department,
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted advance voucher ${existing.advanceReference} (₹${existing.amount}) for ${existing.staff.fullName} (${existing.staff.employeeCode}). Permanent record preserved in audit history.`,
        },
      });

      // 2. Delete advance record from active database
      await tx.staffAdvance.delete({ where: { id } });

      return {
        success: true,
        message: `Advance voucher ${existing.advanceReference} for ${existing.staff.fullName} permanently deleted and archived in Monthly History.`,
        advanceReference: existing.advanceReference,
        staffName: existing.staff.fullName,
      };
    });
  }

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch active advances for this month
    const activeAdvances = await this.prisma.staffAdvance.findMany({
      where: {
        advanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        staff: true,
      },
      orderBy: { advanceDate: 'desc' },
    });

    const enrichedActive = activeAdvances.map((a) => ({
      id: a.id,
      advanceReference: a.advanceReference,
      staffId: a.staffId,
      staffName: a.staff.fullName,
      employeeCode: a.staff.employeeCode,
      department: a.staff.department,
      amount: Number(a.amount),
      advanceDate: a.advanceDate.toISOString().split('T')[0],
      paymentMethod: a.paymentMethod,
      repaymentStatus: a.repaymentStatus,
      recoveredAmount: Number(a.recoveredAmount),
      balanceAmount: Number(a.balanceAmount),
      notes: a.notes,
      createdAt: a.createdAt,
      isDeleted: false,
    }));

    // 2. Fetch deleted advances from AuditLog for this month
    const deletedLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'STAFF_ADVANCE',
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
      const advDate = prev.advanceDate ? new Date(prev.advanceDate).toISOString().split('T')[0] : log.changedAt.toISOString().split('T')[0];
      return {
        id: log.entityId,
        advanceReference: prev.advanceReference || 'ADV-ARCHIVED',
        staffId: prev.staffId,
        staffName: prev.staffName || 'Archived Employee',
        employeeCode: prev.employeeCode || 'EMP-ARCHIVED',
        department: prev.department || 'General',
        amount: Number(prev.amount || 0),
        advanceDate: advDate,
        paymentMethod: prev.paymentMethod || 'CASH',
        repaymentStatus: prev.repaymentStatus || 'PENDING',
        recoveredAmount: Number(prev.recoveredAmount || 0),
        balanceAmount: Number(prev.balanceAmount || 0),
        notes: prev.notes,
        createdAt: prev.createdAt || log.changedAt,
        deletedAt: log.changedAt,
        isDeleted: true,
      };
    });

    const allHistory = [...enrichedActive, ...deletedItems].sort(
      (a, b) =>
        new Date(b.advanceDate || b.createdAt).getTime() -
        new Date(a.advanceDate || a.createdAt).getTime()
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
}
