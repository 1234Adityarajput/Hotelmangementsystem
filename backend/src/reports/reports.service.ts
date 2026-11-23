import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueryReportsDto } from './dto/query-reports.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveReport(query: QueryReportsDto) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const start = query.startDate ? new Date(query.startDate) : monthStart;
    const end = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalGuests,
      totalBookings,
      cancelledBookings,
      paymentsInflow,
      invoicesBilled,
      expensesOutflow,
      payrollCosts,
      staffCount,
      paymentsByMethod,
      expensesByCategory,
      roomTypeStats,
    ] = await Promise.all([
      this.prisma.room.count(),
      this.prisma.room.count({ where: { roomStatus: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { roomStatus: 'OCCUPIED' } }),
      this.prisma.room.count({ where: { roomStatus: 'MAINTENANCE' } }),
      this.prisma.guest.count(),
      this.prisma.booking.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.booking.count({
        where: { bookingStatus: 'CANCELLED', createdAt: { gte: start, lte: end } },
      }),
      this.prisma.payment.aggregate({
        where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: { invoiceDate: { gte: start, lte: end } },
        _sum: { totalAmount: true, totalPaid: true, balanceAmount: true, taxAmount: true, discountAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.salaryRecord.aggregate({
        _sum: { netSalary: true, totalPaid: true, balanceAmount: true },
        _count: { id: true },
      }),
      this.prisma.staff.count({ where: { employmentStatus: 'ACTIVE' } }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.roomType.findMany({
        include: {
          _count: { select: { rooms: true } },
          rooms: {
            select: { roomStatus: true },
          },
        },
      }),
    ]);

    const categories = await this.prisma.expenseCategory.findMany();
    const catMap = new Map<string, string>();
    categories.forEach((c) => catMap.set(c.id, c.name));

    const totalCollectedRevenue = Number(paymentsInflow._sum.amount || 0);
    const totalOperatingExpenses = Number(expensesOutflow._sum.amount || 0);
    const totalPayrollPaid = Number(payrollCosts._sum.totalPaid || 0);
    const totalOutstandingInvoices = Number(invoicesBilled._sum.balanceAmount || 0);
    const totalTaxCollected = Number(invoicesBilled._sum.taxAmount || 0);
    const totalDiscountsGiven = Number(invoicesBilled._sum.discountAmount || 0);

    const roomTypeOccupancy = roomTypeStats.map((rt) => {
      const occupied = rt.rooms.filter((r) => r.roomStatus === 'OCCUPIED').length;
      const totalR = rt.rooms.length;
      return {
        roomTypeName: rt.name,
        totalRooms: totalR,
        occupiedRooms: occupied,
        occupancyRate: totalR > 0 ? Math.round((occupied / totalR) * 100) : 0,
      };
    });

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      operations: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        totalGuests,
        totalBookings,
        cancelledBookings,
        roomTypeOccupancy,
      },
      financials: {
        totalCollectedRevenue,
        inflowTransactionsCount: paymentsInflow._count.id,
        totalInvoiced: Number(invoicesBilled._sum.totalAmount || 0),
        totalOutstandingReceivables: totalOutstandingInvoices,
        totalTaxCollected,
        totalDiscountsGiven,
        totalOperatingExpenses,
        expenseTransactionsCount: expensesOutflow._count.id,
        totalPayrollDisbursed: totalPayrollPaid,
        totalPayrollObligation: Number(payrollCosts._sum.netSalary || 0),
        pendingPayrollBalance: Number(payrollCosts._sum.balanceAmount || 0),
        netCashFlow: Math.round((totalCollectedRevenue - totalOperatingExpenses - totalPayrollPaid) * 100) / 100,
        paymentsByMethod: paymentsByMethod.map((pm) => ({
          method: pm.paymentMethod,
          amount: Number(pm._sum.amount || 0),
          count: pm._count.id,
        })),
        expensesByCategory: expensesByCategory.map((ec) => ({
          category: catMap.get(ec.expenseCategoryId) || 'General',
          amount: Number(ec._sum.amount || 0),
          count: ec._count.id,
        })),
      },
      staff: {
        activeStaffCount: staffCount,
      },
    };
  }
}
