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
}
