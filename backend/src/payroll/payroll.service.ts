import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { RecordSalaryPaymentDto } from './dto/record-salary-payment.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private async generatePaymentReference(): Promise<string> {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const prefix = `SAL-${yearMonth}-`;

    const lastPayment = await this.prisma.salaryPayment.findFirst({
      where: { paymentReference: { startsWith: prefix } },
      orderBy: { paymentReference: 'desc' },
      select: { paymentReference: true },
    });

    let nextNumber = 1;
    if (lastPayment?.paymentReference) {
      const parts = lastPayment.paymentReference.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async generatePayroll(dto: GeneratePayrollDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${dto.staffId} not found`);
    }

    // Check unique constraint for staffId + payrollMonth + payrollYear
    const existing = await this.prisma.salaryRecord.findUnique({
      where: {
        staffId_payrollMonth_payrollYear: {
          staffId: dto.staffId,
          payrollMonth: dto.payrollMonth,
          payrollYear: dto.payrollYear,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Payroll record already generated for ${staff.fullName} for ${dto.payrollMonth}/${dto.payrollYear} (Status: ${existing.payrollStatus})`,
      );
    }

    // 1. Fetch attendance records for this employee in this month
    const startDate = new Date(Date.UTC(dto.payrollYear, dto.payrollMonth - 1, 1));
    const endDate = new Date(Date.UTC(dto.payrollYear, dto.payrollMonth, 1));

    const attendances = await this.prisma.attendance.findMany({
      where: {
        staffId: dto.staffId,
        attendanceDate: { gte: startDate, lt: endDate },
      },
    });

    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let overtimeHours = 0;

    attendances.forEach((a) => {
      if (a.attendanceStatus === 'PRESENT') presentDays += 1;
      else if (a.attendanceStatus === 'ABSENT') absentDays += 1;
      else if (a.attendanceStatus === 'HALF_DAY') halfDays += 1;
      else if (a.attendanceStatus === 'LEAVE') paidLeaves += 1;
      overtimeHours += Number(a.overtimeHours || 0);
    });

    const configuredSalaryDays = dto.configuredSalaryDays || 30;

    // Payable days calculation
    let payableDays =
      dto.payableDays !== undefined
        ? Number(dto.payableDays)
        : presentDays + halfDays * 0.5 + paidLeaves;

    // If no attendance recorded yet (e.g. at month end), default to configured days if full month
    if (attendances.length === 0 && dto.payableDays === undefined) {
      payableDays = configuredSalaryDays;
      presentDays = configuredSalaryDays;
    }

    payableDays = Math.min(configuredSalaryDays, Math.max(0, Math.round(payableDays * 100) / 100));

    // Monetary Calculations (Decimal 2 precision)
    const monthlyBasicSalary = Number(staff.monthlySalary);
    const dailyRate = monthlyBasicSalary / configuredSalaryDays;
    const earnedBasic = Math.round(dailyRate * payableDays * 100) / 100;

    // Overtime: 1.5x hourly rate (standard 8-hour workday)
    const hourlyRate = dailyRate / 8;
    const overtimeAmount = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;

    const grossSalary = Math.round((earnedBasic + overtimeAmount) * 100) / 100;
    const deductions = Math.round(Number(dto.deductions || 0) * 100) / 100;

    // Validate Advance Deductions
    let advanceDeductions = Math.round(Number(dto.advanceDeductions || 0) * 100) / 100;
    let targetAdvance: any = null;

    if (advanceDeductions > 0 || dto.staffAdvanceId) {
      if (dto.staffAdvanceId) {
        targetAdvance = await this.prisma.staffAdvance.findUnique({
          where: { id: dto.staffAdvanceId },
        });
      } else {
        targetAdvance = await this.prisma.staffAdvance.findFirst({
          where: { staffId: dto.staffId, balanceAmount: { gt: 0 } },
          orderBy: { advanceDate: 'asc' },
        });
      }

      if (targetAdvance) {
        const advBal = Number(targetAdvance.balanceAmount);
        if (advanceDeductions > advBal) {
          advanceDeductions = advBal;
        }
      } else {
        advanceDeductions = 0;
      }
    }

    if (advanceDeductions + deductions > grossSalary) {
      throw new BadRequestException(
        `Total deductions (₹${deductions + advanceDeductions}) cannot exceed gross salary (₹${grossSalary})`,
      );
    }

    const netSalary = Math.round((grossSalary - deductions - advanceDeductions) * 100) / 100;
    const totalPaid = 0.00;
    const balanceAmount = netSalary;

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.salaryRecord.create({
        data: {
          staffId: dto.staffId,
          payrollMonth: dto.payrollMonth,
          payrollYear: dto.payrollYear,
          monthlyBasicSalary,
          configuredSalaryDays,
          payableDays,
          presentDays,
          absentDays,
          halfDays,
          paidLeaves,
          unpaidLeaves,
          overtimeHours,
          overtimeAmount,
          grossSalary,
          deductions,
          advanceDeductions,
          netSalary,
          totalPaid,
          balanceAmount,
          payrollStatus: 'FINALIZED',
          finalizedAt: new Date(),
        },
        include: {
          staff: true,
        },
      });

      // Update linked staff advance if applicable
      if (targetAdvance && advanceDeductions > 0) {
        const newRecovered = Math.round((Number(targetAdvance.recoveredAmount) + advanceDeductions) * 100) / 100;
        const newBalance = Math.round((Number(targetAdvance.amount) - newRecovered) * 100) / 100;
        const newStatus = newBalance <= 0 ? 'REPAID' : 'PARTIALLY_REPAID';

        await tx.staffAdvance.update({
          where: { id: targetAdvance.id },
          data: {
            recoveredAmount: newRecovered,
            balanceAmount: newBalance,
            repaymentStatus: newStatus,
            salaryRecordId: record.id,
            notes: `${targetAdvance.notes || ''} | Deducted in Payroll ${dto.payrollMonth}/${dto.payrollYear}`.trim(),
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'PAYROLL',
          entityId: record.id,
          action: 'CREATE',
          newValues: {
            staff: staff.fullName,
            month: dto.payrollMonth,
            year: dto.payrollYear,
            grossSalary,
            netSalary,
          },
          description: `Generated payroll for ${staff.fullName} for ${dto.payrollMonth}/${dto.payrollYear}. Net Salary: ₹${netSalary}`,
        },
      });

      return record;
    });
  }

  async recordSalaryPayment(dto: RecordSalaryPaymentDto) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id: dto.salaryRecordId },
      include: { staff: true },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${dto.salaryRecordId} not found`);
    }

    if (record.payrollStatus === 'PAID') {
      throw new BadRequestException('Salary record is already fully paid');
    }

    const currentBalance = Number(record.balanceAmount);
    const payAmount = Math.round(Number(dto.paymentAmount) * 100) / 100;

    if (payAmount > currentBalance) {
      throw new BadRequestException(
        `Disbursement amount (₹${payAmount}) cannot exceed outstanding balance (₹${currentBalance})`,
      );
    }

    const paymentReference = await this.generatePaymentReference();
    const newTotalPaid = Math.round((Number(record.totalPaid) + payAmount) * 100) / 100;
    const newBalance = Math.round((Number(record.netSalary) - newTotalPaid) * 100) / 100;
    const newStatus = newBalance <= 0 ? 'PAID' : 'FINALIZED';

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.salaryPayment.create({
        data: {
          salaryRecordId: record.id,
          paymentReference,
          paymentAmount: payAmount,
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date(dto.paymentDate),
          transactionReference: dto.transactionReference,
          notes: dto.notes,
        },
      });

      const updatedRecord = await tx.salaryRecord.update({
        where: { id: record.id },
        data: {
          totalPaid: newTotalPaid,
          balanceAmount: newBalance,
          payrollStatus: newStatus,
        },
        include: {
          staff: true,
          salaryPayments: true,
          staffAdvances: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'SALARY_PAYMENT',
          entityId: payment.id,
          action: 'CREATE',
          newValues: {
            paymentReference,
            staff: record.staff.fullName,
            amount: payAmount,
            remainingBalance: newBalance,
          },
          description: `Disbursed salary payment of ₹${payAmount} (${paymentReference}) to ${record.staff.fullName}`,
        },
      });

      return { payment, salaryRecord: updatedRecord };
    });
  }

  async findAll(query: QueryPayrollDto) {
    const { staffId, month, year, status, page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (month) where.payrollMonth = Number(month);
    if (year) where.payrollYear = Number(year);
    if (status && status !== ('ALL' as any)) where.payrollStatus = status;

    const [items, total] = await Promise.all([
      this.prisma.salaryRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
        include: {
          staff: true,
          salaryPayments: true,
        },
      }),
      this.prisma.salaryRecord.count({ where }),
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
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        staff: true,
        salaryPayments: true,
        staffAdvances: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    return record;
  }

  async getStats(month?: number, year?: number) {
    const where: any = {};
    if (month) where.payrollMonth = Number(month);
    if (year) where.payrollYear = Number(year);

    const [totalPayableAgg, totalPaidAgg, countByStatus] = await Promise.all([
      this.prisma.salaryRecord.aggregate({
        where,
        _sum: { netSalary: true },
      }),
      this.prisma.salaryRecord.aggregate({
        where,
        _sum: { totalPaid: true, balanceAmount: true },
      }),
      this.prisma.salaryRecord.groupBy({
        where,
        by: ['payrollStatus'],
        _count: { id: true },
      }),
    ]);

    const totalNetPayable = Number(totalPayableAgg._sum.netSalary || 0);
    const totalPaid = Number(totalPaidAgg._sum.totalPaid || 0);
    const totalBalance = Number(totalPaidAgg._sum.balanceAmount || 0);

    const statusCounts: Record<string, number> = {
      DRAFT: 0,
      FINALIZED: 0,
      PAID: 0,
      CANCELLED: 0,
    };
    countByStatus.forEach((c) => {
      statusCounts[c.payrollStatus] = c._count.id;
    });

    return {
      totalNetPayable,
      totalPaid,
      totalBalance,
      statusCounts,
    };
  }
}
