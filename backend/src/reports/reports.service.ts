import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueryReportsDto } from './dto/query-reports.dto';

export interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'badge' | 'date';
}

export interface ReportResponse {
  reportType: string;
  reportTitle: string;
  category: 'HOTEL' | 'STAFF' | 'EXECUTIVE';
  description: string;
  dateRange: { startDate: string; endDate: string };
  kpis: { [key: string]: number | string };
  columns: ReportColumn[];
  rows: any[];
  summary?: { [key: string]: any };
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // List of all 19 available report types
  getReportTypes() {
    return {
      hotelReports: [
        { id: 'daily-revenue', title: 'Daily Revenue Report', description: 'Day-wise breakdown of room charges, services, and net revenue inflow' },
        { id: 'weekly-revenue', title: 'Weekly Revenue Report', description: 'Week-by-week aggregated collections, occupancy volume, and growth' },
        { id: 'monthly-revenue', title: 'Monthly Revenue Report', description: 'Monthly hotel earnings, gross billings, taxes, and net collections' },
        { id: 'yearly-revenue', title: 'Yearly Revenue Report', description: 'Annual fiscal performance, seasonal trends, and year-over-year revenue' },
        { id: 'room-occupancy', title: 'Room Occupancy Report', description: 'Occupancy rate %, occupied vs available rooms, and room type utilization' },
        { id: 'guest-history', title: 'Guest History Report', description: 'Guest directory dossier with total visits, lifetime spend, and loyalty' },
        { id: 'check-ins', title: 'Check-in Report', description: 'Front desk arrivals log, check-in timestamps, and advance collections' },
        { id: 'check-outs', title: 'Check-out Report', description: 'Departures log, actual checkout times, total billings, and settlements' },
        { id: 'guest-billing', title: 'Guest Billing Report', description: 'Itemized billing folios: room rent, F&B, laundry, service charges & GST' },
        { id: 'payment-collections', title: 'Payment Collection Report', description: 'Cash, UPI, and Bank settlements ledger with transaction references' },
        { id: 'pending-payments', title: 'Pending Payment Report', description: 'Unsettled folios, partial payments, and outstanding guest receivable balances' },
        { id: 'hotel-expenses', title: 'Hotel Expense Report', description: 'Operating expense vouchers by category: electricity, water, grocery, repairs' },
        { id: 'income-expense-summary', title: 'Income and Expense Summary', description: 'Comprehensive P&L statement: revenue vs operating expenses vs payroll' },
      ],
      staffReports: [
        { id: 'staff-information', title: 'Staff Information Report', description: 'Complete employee roster: IDs, designations, departments, salaries, and contacts' },
        { id: 'daily-attendance', title: 'Daily Attendance Report', description: 'Daily employee muster roll, present/absent logs, and check-in/out hours' },
        { id: 'monthly-attendance', title: 'Monthly Attendance Report', description: 'Monthly attendance matrix: present, absent, half-days, and payable days' },
        { id: 'employee-salary', title: 'Employee Salary Report', description: 'Salary calculation breakdown: basic, earned, overtime, deductions & net salary' },
        { id: 'salary-payment-history', title: 'Salary Payment History', description: 'Disbursed salary vouchers, payment channels, dates, and bank references' },
        { id: 'monthly-payroll-summary', title: 'Monthly Payroll Summary', description: 'Aggregated monthly payroll budget, disbursements, and pending obligations' },
      ],
    };
  }

  // 1. Executive Analytics Report
  async getExecutiveReport(query: QueryReportsDto) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
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
      this.prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.booking.count({ where: { bookingStatus: 'CANCELLED', createdAt: { gte: start, lte: end } } }),
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
          rooms: { select: { roomStatus: true } },
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

  // Master Generator Dispatcher for All 19 Reports
  async generateReport(reportType: string, query: QueryReportsDto): Promise<ReportResponse> {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const start = query.startDate ? new Date(query.startDate) : defaultStart;
    const end = query.endDate ? new Date(query.endDate) : defaultEnd;
    const search = query.search ? query.search.trim().toLowerCase() : '';

    switch (reportType) {
      // HOTEL REPORTS
      case 'daily-revenue':
        return this.getDailyRevenueReport(start, end, search);
      case 'weekly-revenue':
        return this.getWeeklyRevenueReport(start, end, search);
      case 'monthly-revenue':
        return this.getMonthlyRevenueReport(start, end, search);
      case 'yearly-revenue':
        return this.getYearlyRevenueReport(start, end, search);
      case 'room-occupancy':
        return this.getRoomOccupancyReport(start, end, search);
      case 'guest-history':
        return this.getGuestHistoryReport(start, end, search);
      case 'check-ins':
        return this.getCheckInsReport(start, end, search);
      case 'check-outs':
        return this.getCheckOutsReport(start, end, search);
      case 'guest-billing':
        return this.getGuestBillingReport(start, end, search);
      case 'payment-collections':
        return this.getPaymentCollectionsReport(start, end, search);
      case 'pending-payments':
        return this.getPendingPaymentsReport(start, end, search);
      case 'hotel-expenses':
        return this.getHotelExpensesReport(start, end, search);
      case 'income-expense-summary':
        return this.getIncomeExpenseSummaryReport(start, end, search);

      // STAFF REPORTS
      case 'staff-information':
        return this.getStaffInformationReport(start, end, search);
      case 'daily-attendance':
        return this.getDailyAttendanceReport(start, end, search);
      case 'monthly-attendance':
        return this.getMonthlyAttendanceReport(start, end, search);
      case 'employee-salary':
        return this.getEmployeeSalaryReport(start, end, search);
      case 'salary-payment-history':
        return this.getSalaryPaymentHistoryReport(start, end, search);
      case 'monthly-payroll-summary':
        return this.getMonthlyPayrollSummaryReport(start, end, search);

      default:
        throw new NotFoundException(`Report type '${reportType}' not found`);
    }
  }

  // --------------------------------------------------------------------------
  // 1. DAILY REVENUE REPORT
  // --------------------------------------------------------------------------
  private async getDailyRevenueReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
        paymentStatus: 'COMPLETED',
      },
      include: {
        booking: { include: { room: true, primaryGuest: true } },
      },
      orderBy: { paymentDate: 'asc' },
    });

    const dayMap = new Map<string, { date: string; cash: number; upi: number; bank: number; total: number; count: number }>();

    for (const p of payments) {
      const d = p.paymentDate.toISOString().split('T')[0];
      const entry = dayMap.get(d) || { date: d, cash: 0, upi: 0, bank: 0, total: 0, count: 0 };
      const amt = Number(p.amount);
      if (p.paymentMethod === 'CASH') entry.cash += amt;
      else if (p.paymentMethod === 'UPI') entry.upi += amt;
      else entry.bank += amt;
      entry.total += amt;
      entry.count += 1;
      dayMap.set(d, entry);
    }

    let rows = Array.from(dayMap.values()).map((r) => ({
      ...r,
      cash: Math.round(r.cash * 100) / 100,
      upi: Math.round(r.upi * 100) / 100,
      bank: Math.round(r.bank * 100) / 100,
      total: Math.round(r.total * 100) / 100,
    }));

    if (search) {
      rows = rows.filter((r) => r.date.includes(search));
    }

    const totalRevenue = rows.reduce((s, r) => s + r.total, 0);
    const avgDaily = rows.length > 0 ? Math.round((totalRevenue / rows.length) * 100) / 100 : 0;
    const peakDay = rows.reduce((max, r) => (r.total > max.total ? r : max), { date: '—', total: 0 });

    return {
      reportType: 'daily-revenue',
      reportTitle: 'Daily Revenue Report',
      category: 'HOTEL',
      description: 'Day-by-day cash, UPI, and bank collections with daily totals and volume',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageDailyRevenue: avgDaily,
        activeRevenueDays: rows.length,
        peakCollectionDay: peakDay.date !== '—' ? `${peakDay.date} (₹${peakDay.total})` : '—',
      },
      columns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'cash', label: 'Cash Inflow (₹)', type: 'currency' },
        { key: 'upi', label: 'UPI / QR (₹)', type: 'currency' },
        { key: 'bank', label: 'Bank / Card (₹)', type: 'currency' },
        { key: 'total', label: 'Total Revenue (₹)', type: 'currency' },
        { key: 'count', label: 'Transactions', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 2. WEEKLY REVENUE REPORT
  // --------------------------------------------------------------------------
  private async getWeeklyRevenueReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
      orderBy: { paymentDate: 'asc' },
    });

    const weekMap = new Map<string, { week: string; cash: number; upi: number; bank: number; total: number; count: number }>();

    for (const p of payments) {
      const d = new Date(p.paymentDate);
      const weekNumber = Math.ceil((d.getDate() - 1) / 7) + 1;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} Week ${weekNumber}`;
      const entry = weekMap.get(key) || { week: key, cash: 0, upi: 0, bank: 0, total: 0, count: 0 };
      const amt = Number(p.amount);
      if (p.paymentMethod === 'CASH') entry.cash += amt;
      else if (p.paymentMethod === 'UPI') entry.upi += amt;
      else entry.bank += amt;
      entry.total += amt;
      entry.count += 1;
      weekMap.set(key, entry);
    }

    let rows = Array.from(weekMap.values()).map((r) => ({
      ...r,
      total: Math.round(r.total * 100) / 100,
      cash: Math.round(r.cash * 100) / 100,
      upi: Math.round(r.upi * 100) / 100,
    }));

    if (search) {
      rows = rows.filter((r) => r.week.toLowerCase().includes(search));
    }

    const totalRev = rows.reduce((s, r) => s + r.total, 0);

    return {
      reportType: 'weekly-revenue',
      reportTitle: 'Weekly Revenue Report',
      category: 'HOTEL',
      description: 'Weekly aggregated financial performance, payment channels and transaction counts',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalWeeklyRevenue: Math.round(totalRev * 100) / 100,
        averageWeeklyRevenue: rows.length > 0 ? Math.round((totalRev / rows.length) * 100) / 100 : 0,
        weeksTracked: rows.length,
      },
      columns: [
        { key: 'week', label: 'Week Period', type: 'text' },
        { key: 'cash', label: 'Cash (₹)', type: 'currency' },
        { key: 'upi', label: 'UPI (₹)', type: 'currency' },
        { key: 'bank', label: 'Bank / Card (₹)', type: 'currency' },
        { key: 'total', label: 'Total Revenue (₹)', type: 'currency' },
        { key: 'count', label: 'Transactions', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 3. MONTHLY REVENUE REPORT
  // --------------------------------------------------------------------------
  private async getMonthlyRevenueReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: { paymentStatus: 'COMPLETED' },
      orderBy: { paymentDate: 'asc' },
    });

    const monthMap = new Map<string, { month: string; cash: number; upi: number; bank: number; total: number; count: number }>();

    for (const p of payments) {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key) || { month: key, cash: 0, upi: 0, bank: 0, total: 0, count: 0 };
      const amt = Number(p.amount);
      if (p.paymentMethod === 'CASH') entry.cash += amt;
      else if (p.paymentMethod === 'UPI') entry.upi += amt;
      else entry.bank += amt;
      entry.total += amt;
      entry.count += 1;
      monthMap.set(key, entry);
    }

    let rows = Array.from(monthMap.values()).map((r) => ({
      ...r,
      total: Math.round(r.total * 100) / 100,
    }));

    if (search) {
      rows = rows.filter((r) => r.month.includes(search));
    }

    const totalRev = rows.reduce((s, r) => s + r.total, 0);

    return {
      reportType: 'monthly-revenue',
      reportTitle: 'Monthly Revenue Report',
      category: 'HOTEL',
      description: 'Month-on-month revenue collection totals, transaction volume and channel breakdown',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalRevenue: Math.round(totalRev * 100) / 100,
        averageMonthlyRevenue: rows.length > 0 ? Math.round((totalRev / rows.length) * 100) / 100 : 0,
        monthsTracked: rows.length,
      },
      columns: [
        { key: 'month', label: 'Month (YYYY-MM)', type: 'text' },
        { key: 'cash', label: 'Cash (₹)', type: 'currency' },
        { key: 'upi', label: 'UPI (₹)', type: 'currency' },
        { key: 'bank', label: 'Bank / Card (₹)', type: 'currency' },
        { key: 'total', label: 'Gross Revenue (₹)', type: 'currency' },
        { key: 'count', label: 'Transactions', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 4. YEARLY REVENUE REPORT
  // --------------------------------------------------------------------------
  private async getYearlyRevenueReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: { paymentStatus: 'COMPLETED' },
      orderBy: { paymentDate: 'asc' },
    });

    const yearMap = new Map<string, { year: string; totalRevenue: number; count: number; cash: number; upi: number }>();

    for (const p of payments) {
      const yr = String(new Date(p.paymentDate).getFullYear());
      const entry = yearMap.get(yr) || { year: yr, totalRevenue: 0, count: 0, cash: 0, upi: 0 };
      const amt = Number(p.amount);
      entry.totalRevenue += amt;
      entry.count += 1;
      if (p.paymentMethod === 'CASH') entry.cash += amt;
      if (p.paymentMethod === 'UPI') entry.upi += amt;
      yearMap.set(yr, entry);
    }

    let rows = Array.from(yearMap.values()).map((r) => ({
      ...r,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
    }));

    if (search) {
      rows = rows.filter((r) => r.year.includes(search));
    }

    const totalRev = rows.reduce((s, r) => s + r.totalRevenue, 0);

    return {
      reportType: 'yearly-revenue',
      reportTitle: 'Yearly Revenue Report',
      category: 'HOTEL',
      description: 'Annual revenue collections, yearly transaction volume and growth tracking',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalHistoricalRevenue: Math.round(totalRev * 100) / 100,
        yearsTracked: rows.length,
      },
      columns: [
        { key: 'year', label: 'Fiscal Year', type: 'text' },
        { key: 'cash', label: 'Cash Inflow (₹)', type: 'currency' },
        { key: 'upi', label: 'UPI / Digital (₹)', type: 'currency' },
        { key: 'totalRevenue', label: 'Annual Revenue (₹)', type: 'currency' },
        { key: 'count', label: 'Total Transactions', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 5. ROOM OCCUPANCY REPORT
  // --------------------------------------------------------------------------
  private async getRoomOccupancyReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const rooms = await this.prisma.room.findMany({
      include: {
        roomType: true,
        bookings: {
          where: { bookingStatus: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
          select: { numberOfNights: true, roomRatePerNight: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    let rows = rooms.map((r) => {
      const totalBookings = r.bookings.length;
      const totalNights = r.bookings.reduce((s: number, b: any) => s + b.numberOfNights, 0);
      const totalRevenue = r.bookings.reduce((s: number, b: any) => s + Number(b.roomRatePerNight) * b.numberOfNights, 0);

      return {
        roomNumber: r.roomNumber,
        roomType: r.roomType?.name || 'Standard',
        floor: `Floor ${r.floor}`,
        status: r.roomStatus,
        pricePerNight: Number(r.pricePerNight),
        totalBookings,
        totalNights,
        revenue: Math.round(totalRevenue * 100) / 100,
      };
    });

    if (search) {
      rows = rows.filter((r) => r.roomNumber.toLowerCase().includes(search) || r.roomType.toLowerCase().includes(search));
    }

    const occupied = rows.filter((r) => r.status === 'OCCUPIED').length;
    const available = rows.filter((r) => r.status === 'AVAILABLE').length;
    const maintenance = rows.filter((r) => r.status === 'MAINTENANCE').length;
    const occupancyRate = rows.length > 0 ? Math.round((occupied / rows.length) * 100) : 0;

    return {
      reportType: 'room-occupancy',
      reportTitle: 'Room Occupancy Report',
      category: 'HOTEL',
      description: 'Room-by-room utilization, occupancy rates, generated room rent, and operational status',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        overallOccupancyRate: `${occupancyRate}%`,
        occupiedRooms: occupied,
        availableRooms: available,
        maintenanceRooms: maintenance,
        totalInventory: rows.length,
      },
      columns: [
        { key: 'roomNumber', label: 'Room #', type: 'text' },
        { key: 'roomType', label: 'Room Category', type: 'text' },
        { key: 'floor', label: 'Floor', type: 'text' },
        { key: 'status', label: 'Status', type: 'badge' },
        { key: 'pricePerNight', label: 'Rate/Night (₹)', type: 'currency' },
        { key: 'totalBookings', label: 'Completed Stays', type: 'text' },
        { key: 'totalNights', label: 'Total Nights Sold', type: 'text' },
        { key: 'revenue', label: 'Room Rent Revenue (₹)', type: 'currency' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 6. GUEST HISTORY REPORT
  // --------------------------------------------------------------------------
  private async getGuestHistoryReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const guests = await this.prisma.guest.findMany({
      include: {
        primaryBookings: {
          include: {
            payments: { where: { paymentStatus: 'COMPLETED' }, select: { amount: true } },
          },
          orderBy: { checkInDate: 'desc' },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    let rows = guests.map((g) => {
      const totalStays = g.primaryBookings.length;
      const totalNights = g.primaryBookings.reduce((s: number, b: any) => s + b.numberOfNights, 0);
      const totalSpend = g.primaryBookings.reduce((s: number, b: any) => s + b.payments.reduce((ps: number, p: any) => ps + Number(p.amount), 0), 0);
      const lastStay = g.primaryBookings[0]?.checkInDate ? g.primaryBookings[0].checkInDate.toISOString().split('T')[0] : '—';

      return {
        guestCode: g.guestCode,
        fullName: g.fullName,
        mobileNumber: g.mobileNumber,
        email: g.email || '—',
        city: g.city || g.address || '—',
        totalStays,
        totalNights,
        totalSpend: Math.round(totalSpend * 100) / 100,
        lastVisitDate: lastStay,
      };
    });

    if (search) {
      rows = rows.filter((r) => r.fullName.toLowerCase().includes(search) || r.mobileNumber.includes(search) || r.guestCode.toLowerCase().includes(search));
    }

    const totalSpendAll = rows.reduce((s, r) => s + r.totalSpend, 0);
    const repeatGuests = rows.filter((r) => r.totalStays > 1).length;

    return {
      reportType: 'guest-history',
      reportTitle: 'Guest History Report',
      category: 'HOTEL',
      description: 'Comprehensive directory of guest profiles, stay counts, lifetime expenditure, and visit frequency',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalRegisteredGuests: rows.length,
        repeatGuests,
        lifetimeGuestSpend: Math.round(totalSpendAll * 100) / 100,
      },
      columns: [
        { key: 'guestCode', label: 'Guest ID', type: 'text' },
        { key: 'fullName', label: 'Guest Name', type: 'text' },
        { key: 'mobileNumber', label: 'Mobile Number', type: 'text' },
        { key: 'city', label: 'City / Location', type: 'text' },
        { key: 'totalStays', label: 'Total Visits', type: 'text' },
        { key: 'totalNights', label: 'Total Nights', type: 'text' },
        { key: 'totalSpend', label: 'Lifetime Spend (₹)', type: 'currency' },
        { key: 'lastVisitDate', label: 'Last Check-In', type: 'date' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 7. CHECK-IN REPORT
  // --------------------------------------------------------------------------
  private async getCheckInsReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        checkInDate: { gte: start, lte: end },
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
      },
      orderBy: { checkInDate: 'desc' },
    });

    let rows = bookings.map((b) => ({
      bookingNumber: b.bookingNumber,
      guestName: b.primaryGuest?.fullName || 'Guest',
      mobileNumber: b.primaryGuest?.mobileNumber || '',
      roomNumber: `Room ${b.room?.roomNumber || '—'}`,
      roomType: b.room?.roomType?.name || 'Standard',
      checkInDate: b.checkInDate.toISOString().split('T')[0],
      checkInTime: b.checkInTime || '12:00 PM',
      nights: `${b.numberOfNights} Nights`,
      ratePerNight: Number(b.roomRatePerNight),
      advancePaid: Number(b.advanceAmount || 0),
      status: b.bookingStatus,
    }));

    if (search) {
      rows = rows.filter((r) => r.guestName.toLowerCase().includes(search) || r.roomNumber.toLowerCase().includes(search) || r.bookingNumber.toLowerCase().includes(search));
    }

    const totalAdv = rows.reduce((s, r) => s + r.advancePaid, 0);

    return {
      reportType: 'check-ins',
      reportTitle: 'Check-in Report',
      category: 'HOTEL',
      description: 'Front desk arrivals log, allocated rooms, check-in timestamps, and advance collections',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalCheckInsInPeriod: rows.length,
        totalAdvanceCollected: Math.round(totalAdv * 100) / 100,
      },
      columns: [
        { key: 'bookingNumber', label: 'Booking Ref', type: 'text' },
        { key: 'guestName', label: 'Guest Name', type: 'text' },
        { key: 'roomNumber', label: 'Room', type: 'text' },
        { key: 'checkInDate', label: 'Check-in Date', type: 'date' },
        { key: 'checkInTime', label: 'Time', type: 'text' },
        { key: 'nights', label: 'Duration', type: 'text' },
        { key: 'ratePerNight', label: 'Rate/Night (₹)', type: 'currency' },
        { key: 'advancePaid', label: 'Advance Paid (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 8. CHECK-OUT REPORT
  // --------------------------------------------------------------------------
  private async getCheckOutsReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const checkouts = await this.prisma.booking.findMany({
      where: {
        bookingStatus: 'CHECKED_OUT',
      },
      include: {
        primaryGuest: true,
        room: true,
        invoices: true,
        payments: { where: { paymentStatus: 'COMPLETED' } },
      },
      orderBy: { actualCheckOutAt: 'desc' },
    });

    let rows = checkouts.map((b) => {
      const inv = b.invoices[0];
      const totalPaid = b.payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const departureDate = b.actualCheckOutAt ? b.actualCheckOutAt.toISOString().split('T')[0] : b.expectedCheckOutDate.toISOString().split('T')[0];

      return {
        bookingNumber: b.bookingNumber,
        guestName: b.primaryGuest?.fullName || 'Guest',
        roomNumber: `Room ${b.room?.roomNumber || '—'}`,
        departureDate,
        nights: b.numberOfNights,
        invoiceNumber: inv?.invoiceNumber || '—',
        finalBill: Number(inv?.totalAmount || Number(b.roomRatePerNight) * b.numberOfNights),
        totalPaid,
        balance: Number(inv?.balanceAmount || 0),
        status: inv?.invoiceStatus || 'FINALIZED',
      };
    });

    if (search) {
      rows = rows.filter((r) => r.guestName.toLowerCase().includes(search) || r.roomNumber.toLowerCase().includes(search) || r.bookingNumber.toLowerCase().includes(search));
    }

    const totalSettled = rows.reduce((s, r) => s + r.totalPaid, 0);

    return {
      reportType: 'check-outs',
      reportTitle: 'Check-out Report',
      category: 'HOTEL',
      description: 'Guest departure ledger, departure timestamps, invoice totals, and settled payments',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalCheckOuts: rows.length,
        totalSettledRevenue: Math.round(totalSettled * 100) / 100,
      },
      columns: [
        { key: 'bookingNumber', label: 'Booking Ref', type: 'text' },
        { key: 'guestName', label: 'Guest Name', type: 'text' },
        { key: 'roomNumber', label: 'Room', type: 'text' },
        { key: 'departureDate', label: 'Check-Out Date', type: 'date' },
        { key: 'nights', label: 'Nights', type: 'text' },
        { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
        { key: 'finalBill', label: 'Final Bill (₹)', type: 'currency' },
        { key: 'totalPaid', label: 'Paid Amount (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 9. GUEST BILLING REPORT
  // --------------------------------------------------------------------------
  private async getGuestBillingReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const invoices = await this.prisma.invoice.findMany({
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: true,
            bookingItems: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    let rows = invoices.map((inv) => {
      const roomCharges = Number(inv.booking.roomRatePerNight) * inv.booking.numberOfNights;
      const additionalServices = inv.booking.bookingItems.reduce((s: number, bi: any) => s + Number(bi.totalAmount), 0);

      return {
        invoiceNumber: inv.invoiceNumber,
        guestName: inv.booking?.primaryGuest?.fullName || 'Guest',
        roomNumber: `Room ${inv.booking?.room?.roomNumber || '—'}`,
        invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
        roomCharges: Math.round(roomCharges * 100) / 100,
        additionalServices: Math.round(additionalServices * 100) / 100,
        taxAmount: Number(inv.taxAmount),
        discountAmount: Number(inv.discountAmount),
        totalAmount: Number(inv.totalAmount),
        totalPaid: Number(inv.totalPaid),
        balanceAmount: Number(inv.balanceAmount),
        status: inv.invoiceStatus,
      };
    });

    if (search) {
      rows = rows.filter((r) => r.guestName.toLowerCase().includes(search) || r.invoiceNumber.toLowerCase().includes(search) || r.roomNumber.toLowerCase().includes(search));
    }

    const totalGross = rows.reduce((s, r) => s + r.totalAmount, 0);
    const totalTaxes = rows.reduce((s, r) => s + r.taxAmount, 0);

    return {
      reportType: 'guest-billing',
      reportTitle: 'Guest Billing Report',
      category: 'HOTEL',
      description: 'Comprehensive itemized billing breakdown: room rent, dynamic service charges, GST, and net bill',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalGrossBilled: Math.round(totalGross * 100) / 100,
        totalTaxesCollected: Math.round(totalTaxes * 100) / 100,
        invoicesCount: rows.length,
      },
      columns: [
        { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
        { key: 'guestName', label: 'Guest Name', type: 'text' },
        { key: 'roomNumber', label: 'Room', type: 'text' },
        { key: 'invoiceDate', label: 'Bill Date', type: 'date' },
        { key: 'roomCharges', label: 'Room Charges (₹)', type: 'currency' },
        { key: 'additionalServices', label: 'Services (₹)', type: 'currency' },
        { key: 'taxAmount', label: 'GST (₹)', type: 'currency' },
        { key: 'totalAmount', label: 'Total Bill (₹)', type: 'currency' },
        { key: 'balanceAmount', label: 'Balance Due (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 10. PAYMENT COLLECTION REPORT
  // --------------------------------------------------------------------------
  private async getPaymentCollectionsReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
        paymentStatus: 'COMPLETED',
      },
      include: {
        booking: { include: { primaryGuest: true, room: true } },
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    let rows = payments.map((p) => ({
      paymentReference: p.paymentReference,
      paymentDate: p.paymentDate.toISOString().split('T')[0],
      guestName: p.booking?.primaryGuest?.fullName || 'Guest',
      roomNumber: `Room ${p.booking?.room?.roomNumber || '—'}`,
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference || '—',
      amount: Number(p.amount),
      invoiceNumber: p.invoice?.invoiceNumber || p.booking?.bookingNumber || '—',
      status: p.paymentStatus,
    }));

    if (search) {
      rows = rows.filter((r) => r.guestName.toLowerCase().includes(search) || r.paymentReference.toLowerCase().includes(search) || (r.transactionReference && r.transactionReference.toLowerCase().includes(search)));
    }

    const totalCollected = rows.reduce((s, r) => s + r.amount, 0);
    const cashCollected = rows.filter((r) => r.paymentMethod === 'CASH').reduce((s, r) => s + r.amount, 0);
    const upiCollected = rows.filter((r) => r.paymentMethod === 'UPI').reduce((s, r) => s + r.amount, 0);

    return {
      reportType: 'payment-collections',
      reportTitle: 'Payment Collection Report',
      category: 'HOTEL',
      description: 'Audit log of all cash, UPI, and bank settlements with payment types and transaction references',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalCollections: Math.round(totalCollected * 100) / 100,
        cashTotal: Math.round(cashCollected * 100) / 100,
        upiTotal: Math.round(upiCollected * 100) / 100,
        totalEntries: rows.length,
      },
      columns: [
        { key: 'paymentReference', label: 'Payment Ref', type: 'text' },
        { key: 'paymentDate', label: 'Date', type: 'date' },
        { key: 'guestName', label: 'Guest Name', type: 'text' },
        { key: 'roomNumber', label: 'Room', type: 'text' },
        { key: 'paymentType', label: 'Type', type: 'badge' },
        { key: 'paymentMethod', label: 'Channel', type: 'badge' },
        { key: 'transactionReference', label: 'UTR / Bank Ref', type: 'text' },
        { key: 'amount', label: 'Amount (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 11. PENDING PAYMENT REPORT
  // --------------------------------------------------------------------------
  private async getPendingPaymentsReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
        balanceAmount: { gt: 0 },
      },
      include: {
        booking: { include: { primaryGuest: true, room: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeStays = await this.prisma.booking.findMany({
      where: { bookingStatus: 'CHECKED_IN' },
      include: {
        primaryGuest: true,
        room: true,
        bookingItems: true,
        payments: { where: { paymentStatus: 'COMPLETED' } },
        invoices: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    const rows: any[] = [];

    for (const inv of invoices) {
      rows.push({
        referenceNumber: inv.invoiceNumber,
        recordType: 'Finalized Invoice',
        guestName: inv.booking?.primaryGuest?.fullName || 'Guest',
        mobileNumber: inv.booking?.primaryGuest?.mobileNumber || '',
        roomNumber: `Room ${inv.booking?.room?.roomNumber || '—'}`,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.totalPaid),
        balanceDue: Number(inv.balanceAmount),
        status: inv.invoiceStatus,
      });
    }

    for (const s of activeStays) {
      const alreadyIncluded = rows.some((r) => r.referenceNumber === s.invoices[0]?.invoiceNumber);
      if (!alreadyIncluded) {
        const roomTotal = Number(s.roomRatePerNight) * s.numberOfNights;
        const itemsTotal = s.bookingItems.reduce((acc: number, bi: any) => acc + Number(bi.totalAmount), 0);
        const subtotal = roomTotal + itemsTotal;
        const totalEst = Math.round((subtotal + subtotal * 0.12) * 100) / 100;
        const totalPaid = s.payments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
        const balanceDue = Math.max(0, Math.round((totalEst - totalPaid) * 100) / 100);

        if (balanceDue > 0) {
          rows.push({
            referenceNumber: s.bookingNumber,
            recordType: 'Active Stay Folio',
            guestName: s.primaryGuest?.fullName || 'Guest',
            mobileNumber: s.primaryGuest?.mobileNumber || '',
            roomNumber: `Room ${s.room?.roomNumber || '—'}`,
            totalAmount: totalEst,
            paidAmount: totalPaid,
            balanceDue,
            status: 'IN_HOUSE_DUE',
          });
        }
      }
    }

    let filteredRows = rows;
    if (search) {
      filteredRows = rows.filter((r) => r.guestName.toLowerCase().includes(search) || r.referenceNumber.toLowerCase().includes(search) || r.roomNumber.toLowerCase().includes(search));
    }

    const totalDue = filteredRows.reduce((acc, r) => acc + r.balanceDue, 0);

    return {
      reportType: 'pending-payments',
      reportTitle: 'Pending Payment Report',
      category: 'HOTEL',
      description: 'Comprehensive audit of uncollected folios, partial settlements, and outstanding balances due',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalOutstandingReceivables: Math.round(totalDue * 100) / 100,
        pendingFoliosCount: filteredRows.length,
      },
      columns: [
        { key: 'referenceNumber', label: 'Record Ref', type: 'text' },
        { key: 'recordType', label: 'Type', type: 'text' },
        { key: 'guestName', label: 'Guest Name', type: 'text' },
        { key: 'roomNumber', label: 'Room', type: 'text' },
        { key: 'totalAmount', label: 'Total Billed (₹)', type: 'currency' },
        { key: 'paidAmount', label: 'Paid So Far (₹)', type: 'currency' },
        { key: 'balanceDue', label: 'Pending Balance (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: filteredRows,
    };
  }

  // --------------------------------------------------------------------------
  // 12. HOTEL EXPENSE REPORT
  // --------------------------------------------------------------------------
  private async getHotelExpensesReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        paymentDate: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { paymentDate: 'desc' },
    });

    let rows = expenses.map((e) => ({
      expenseReference: e.expenseReference,
      paymentDate: e.paymentDate.toISOString().split('T')[0],
      category: e.category.name,
      description: e.description,
      amount: Number(e.amount),
      paymentMethod: e.paymentMethod,
      transactionReference: e.transactionReference || '—',
      notes: e.notes || '—',
    }));

    if (search) {
      rows = rows.filter((r) => r.description.toLowerCase().includes(search) || r.category.toLowerCase().includes(search) || r.expenseReference.toLowerCase().includes(search));
    }

    const totalExp = rows.reduce((s, r) => s + r.amount, 0);

    return {
      reportType: 'hotel-expenses',
      reportTitle: 'Hotel Expense Report',
      category: 'HOTEL',
      description: 'Audit log of hotel operating expenses categorized into electricity, water, grocery, and maintenance',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalOperatingExpenses: Math.round(totalExp * 100) / 100,
        expenseVouchersCount: rows.length,
      },
      columns: [
        { key: 'expenseReference', label: 'Voucher Ref', type: 'text' },
        { key: 'paymentDate', label: 'Payment Date', type: 'date' },
        { key: 'category', label: 'Expense Category', type: 'badge' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'amount', label: 'Amount (₹)', type: 'currency' },
        { key: 'paymentMethod', label: 'Channel', type: 'badge' },
        { key: 'transactionReference', label: 'Bill / UTR Ref', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 13. INCOME AND EXPENSE SUMMARY
  // --------------------------------------------------------------------------
  private async getIncomeExpenseSummaryReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const [payments, expenses, payroll] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.salaryRecord.aggregate({
        _sum: { totalPaid: true },
        _count: { id: true },
      }),
    ]);

    const totalIncome = Number(payments._sum.amount || 0);
    const totalOperatingExpenses = Number(expenses._sum.amount || 0);
    const totalPayrollPaid = Number(payroll._sum.totalPaid || 0);
    const totalOutflow = totalOperatingExpenses + totalPayrollPaid;
    const netProfit = totalIncome - totalOutflow;
    const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

    const rows = [
      {
        head: 'Guest Room & Stay Collections',
        type: 'INCOME',
        inflow: totalIncome,
        outflow: 0,
        net: totalIncome,
        share: '100% of Revenue',
      },
      {
        head: 'Hotel Operating Expenses (Utilities, Maintenance, Grocery)',
        type: 'EXPENSE',
        inflow: 0,
        outflow: totalOperatingExpenses,
        net: -totalOperatingExpenses,
        share: totalIncome > 0 ? `${Math.round((totalOperatingExpenses / totalIncome) * 100)}% of Inflow` : '—',
      },
      {
        head: 'Staff Salaries & Payroll Disbursements',
        type: 'PAYROLL',
        inflow: 0,
        outflow: totalPayrollPaid,
        net: -totalPayrollPaid,
        share: totalIncome > 0 ? `${Math.round((totalPayrollPaid / totalIncome) * 100)}% of Inflow` : '—',
      },
      {
        head: 'NET HOTEL OPERATING CASH FLOW (PROFIT / LOSS)',
        type: netProfit >= 0 ? 'NET_PROFIT' : 'NET_LOSS',
        inflow: totalIncome,
        outflow: totalOutflow,
        net: Math.round(netProfit * 100) / 100,
        share: `${profitMargin}% Margin`,
      },
    ];

    return {
      reportType: 'income-expense-summary',
      reportTitle: 'Income and Expense Summary',
      category: 'HOTEL',
      description: 'Comprehensive executive P&L statement comparing collections against operating and payroll expenses',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalRevenueInflow: Math.round(totalIncome * 100) / 100,
        totalExpensesOutflow: Math.round(totalOutflow * 100) / 100,
        netOperatingProfit: Math.round(netProfit * 100) / 100,
        profitMarginPct: `${profitMargin}%`,
      },
      columns: [
        { key: 'head', label: 'Financial Account Head', type: 'text' },
        { key: 'type', label: 'Account Type', type: 'badge' },
        { key: 'inflow', label: 'Total Inflow (₹)', type: 'currency' },
        { key: 'outflow', label: 'Total Outflow (₹)', type: 'currency' },
        { key: 'net', label: 'Net Impact (₹)', type: 'currency' },
        { key: 'share', label: 'Share / Ratio', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 14. STAFF INFORMATION REPORT
  // --------------------------------------------------------------------------
  private async getStaffInformationReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const staff = await this.prisma.staff.findMany({
      orderBy: { employeeCode: 'asc' },
    });

    let rows = staff.map((s) => ({
      employeeCode: s.employeeCode,
      fullName: s.fullName,
      designation: s.designation,
      department: s.department,
      mobileNumber: s.mobileNumber,
      email: s.email || '—',
      joiningDate: s.joiningDate.toISOString().split('T')[0],
      monthlySalary: Number(s.monthlySalary),
      status: s.employmentStatus,
    }));

    if (search) {
      rows = rows.filter((r) => r.fullName.toLowerCase().includes(search) || r.employeeCode.toLowerCase().includes(search) || r.department.toLowerCase().includes(search));
    }

    const totalSalaryBudget = rows.reduce((s, r) => s + r.monthlySalary, 0);

    return {
      reportType: 'staff-information',
      reportTitle: 'Staff Information Report',
      category: 'STAFF',
      description: 'Master staff roster with employee IDs, designations, departments, salaries, and employment status',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalActiveStaff: rows.filter((r) => r.status === 'ACTIVE').length,
        totalMonthlySalaryBudget: Math.round(totalSalaryBudget * 100) / 100,
        totalEmployees: rows.length,
      },
      columns: [
        { key: 'employeeCode', label: 'Employee ID', type: 'text' },
        { key: 'fullName', label: 'Full Name', type: 'text' },
        { key: 'designation', label: 'Designation', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'mobileNumber', label: 'Mobile Number', type: 'text' },
        { key: 'joiningDate', label: 'Joining Date', type: 'date' },
        { key: 'monthlySalary', label: 'Monthly Basic (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 15. DAILY ATTENDANCE REPORT
  // --------------------------------------------------------------------------
  private async getDailyAttendanceReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: { gte: start, lte: end },
      },
      include: { staff: true },
      orderBy: { attendanceDate: 'desc' },
    });

    let rows = attendanceRecords.map((a) => ({
      attendanceDate: a.attendanceDate.toISOString().split('T')[0],
      employeeCode: a.staff.employeeCode,
      staffName: a.staff.fullName,
      designation: a.staff.designation,
      department: a.staff.department,
      status: a.attendanceStatus,
      checkInTime: a.checkInTime || '—',
      checkOutTime: a.checkOutTime || '—',
    }));

    if (search) {
      rows = rows.filter((r) => r.staffName.toLowerCase().includes(search) || r.employeeCode.toLowerCase().includes(search));
    }

    const present = rows.filter((r) => r.status === 'PRESENT').length;
    const absent = rows.filter((r) => r.status === 'ABSENT').length;
    const leave = rows.filter((r) => r.status === 'LEAVE').length;

    return {
      reportType: 'daily-attendance',
      reportTitle: 'Daily Attendance Report',
      category: 'STAFF',
      description: 'Daily staff muster roll, present/absent logs, and check-in/out timestamps',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalRecords: rows.length,
        presentCount: present,
        absentCount: absent,
        leaveCount: leave,
      },
      columns: [
        { key: 'attendanceDate', label: 'Date', type: 'date' },
        { key: 'employeeCode', label: 'Emp ID', type: 'text' },
        { key: 'staffName', label: 'Staff Name', type: 'text' },
        { key: 'designation', label: 'Designation', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'status', label: 'Attendance Status', type: 'badge' },
        { key: 'checkInTime', label: 'Check-In', type: 'text' },
        { key: 'checkOutTime', label: 'Check-Out', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 16. MONTHLY ATTENDANCE REPORT
  // --------------------------------------------------------------------------
  private async getMonthlyAttendanceReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const staff = await this.prisma.staff.findMany({
      include: {
        attendanceRecords: {
          where: { attendanceDate: { gte: start, lte: end } },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    let rows = staff.map((s) => {
      const present = s.attendanceRecords.filter((a) => a.attendanceStatus === 'PRESENT').length;
      const absent = s.attendanceRecords.filter((a) => a.attendanceStatus === 'ABSENT').length;
      const halfDay = s.attendanceRecords.filter((a) => a.attendanceStatus === 'HALF_DAY').length;
      const leave = s.attendanceRecords.filter((a) => a.attendanceStatus === 'LEAVE').length;
      const weeklyOff = s.attendanceRecords.filter((a) => a.attendanceStatus === 'WEEKLY_OFF').length;
      const payableDays = present + halfDay * 0.5 + leave + weeklyOff;

      return {
        employeeCode: s.employeeCode,
        staffName: s.fullName,
        designation: s.designation,
        department: s.department,
        presentDays: present,
        absentDays: absent,
        halfDays: halfDay,
        leaves: leave,
        payableDays,
      };
    });

    if (search) {
      rows = rows.filter((r) => r.staffName.toLowerCase().includes(search) || r.employeeCode.toLowerCase().includes(search));
    }

    const totalPresent = rows.reduce((s, r) => s + r.presentDays, 0);

    return {
      reportType: 'monthly-attendance',
      reportTitle: 'Monthly Attendance Report',
      category: 'STAFF',
      description: 'Monthly employee attendance matrix: present days, absent days, leaves, and total payable days',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        staffTracked: rows.length,
        totalPresentDaysLogged: totalPresent,
      },
      columns: [
        { key: 'employeeCode', label: 'Emp ID', type: 'text' },
        { key: 'staffName', label: 'Staff Name', type: 'text' },
        { key: 'designation', label: 'Designation', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
        { key: 'presentDays', label: 'Present Days', type: 'text' },
        { key: 'absentDays', label: 'Absent Days', type: 'text' },
        { key: 'halfDays', label: 'Half Days', type: 'text' },
        { key: 'leaves', label: 'Leaves', type: 'text' },
        { key: 'payableDays', label: 'Total Payable Days', type: 'text' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 17. EMPLOYEE SALARY REPORT
  // --------------------------------------------------------------------------
  private async getEmployeeSalaryReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const salaryRecords = await this.prisma.salaryRecord.findMany({
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    });

    let rows = salaryRecords.map((sr) => ({
      employeeCode: sr.staff.employeeCode,
      staffName: sr.staff.fullName,
      designation: sr.staff.designation,
      monthYear: `${sr.payrollMonth}/${sr.payrollYear}`,
      basicSalary: Number(sr.monthlyBasicSalary),
      earnedSalary: Number(sr.grossSalary),
      overtime: Number(sr.overtimeAmount),
      deductions: Number(sr.deductions),
      advances: Number(sr.advanceDeductions),
      netSalary: Number(sr.netSalary),
      totalPaid: Number(sr.totalPaid),
      balanceDue: Number(sr.balanceAmount),
      status: sr.payrollStatus,
    }));

    if (search) {
      rows = rows.filter((r) => r.staffName.toLowerCase().includes(search) || r.employeeCode.toLowerCase().includes(search));
    }

    const totalNet = rows.reduce((s, r) => s + r.netSalary, 0);
    const totalDisbursed = rows.reduce((s, r) => s + r.totalPaid, 0);

    return {
      reportType: 'employee-salary',
      reportTitle: 'Employee Salary Report',
      category: 'STAFF',
      description: 'Calculated employee salary breakdown: basic pay, earned salary, overtime, deductions, and net payable',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalNetSalaryCommitment: Math.round(totalNet * 100) / 100,
        totalDisbursedSoFar: Math.round(totalDisbursed * 100) / 100,
        salaryRecordsCount: rows.length,
      },
      columns: [
        { key: 'employeeCode', label: 'Emp ID', type: 'text' },
        { key: 'staffName', label: 'Staff Name', type: 'text' },
        { key: 'monthYear', label: 'Period', type: 'text' },
        { key: 'basicSalary', label: 'Basic Salary (₹)', type: 'currency' },
        { key: 'earnedSalary', label: 'Earned Salary (₹)', type: 'currency' },
        { key: 'overtime', label: 'Overtime (₹)', type: 'currency' },
        { key: 'deductions', label: 'Deductions (₹)', type: 'currency' },
        { key: 'netSalary', label: 'Net Payable (₹)', type: 'currency' },
        { key: 'totalPaid', label: 'Paid (₹)', type: 'currency' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 18. SALARY PAYMENT HISTORY
  // --------------------------------------------------------------------------
  private async getSalaryPaymentHistoryReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const payments = await this.prisma.salaryPayment.findMany({
      include: {
        salaryRecord: { include: { staff: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    let rows = payments.map((sp) => ({
      paymentReference: sp.paymentReference,
      paymentDate: sp.paymentDate.toISOString().split('T')[0],
      employeeCode: sp.salaryRecord.staff.employeeCode,
      staffName: sp.salaryRecord.staff.fullName,
      monthYear: `${sp.salaryRecord.payrollMonth}/${sp.salaryRecord.payrollYear}`,
      amount: Number(sp.paymentAmount),
      paymentMethod: sp.paymentMethod,
      transactionReference: sp.transactionReference || '—',
    }));

    if (search) {
      rows = rows.filter((r) => r.staffName.toLowerCase().includes(search) || r.employeeCode.toLowerCase().includes(search) || r.paymentReference.toLowerCase().includes(search));
    }

    const totalDisbursed = rows.reduce((s, r) => s + r.amount, 0);

    return {
      reportType: 'salary-payment-history',
      reportTitle: 'Salary Payment History',
      category: 'STAFF',
      description: 'Audit log of all staff salary payouts, payment dates, bank references, and cash vouchers',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalDisbursedSalaries: Math.round(totalDisbursed * 100) / 100,
        payoutsCount: rows.length,
      },
      columns: [
        { key: 'paymentReference', label: 'Voucher Ref', type: 'text' },
        { key: 'paymentDate', label: 'Disbursement Date', type: 'date' },
        { key: 'employeeCode', label: 'Emp ID', type: 'text' },
        { key: 'staffName', label: 'Staff Name', type: 'text' },
        { key: 'monthYear', label: 'Salary Month', type: 'text' },
        { key: 'paymentMethod', label: 'Channel', type: 'badge' },
        { key: 'transactionReference', label: 'Bank / Cheque Ref', type: 'text' },
        { key: 'amount', label: 'Amount Paid (₹)', type: 'currency' },
      ],
      rows,
    };
  }

  // --------------------------------------------------------------------------
  // 19. MONTHLY PAYROLL SUMMARY
  // --------------------------------------------------------------------------
  private async getMonthlyPayrollSummaryReport(start: Date, end: Date, search: string): Promise<ReportResponse> {
    const salaryRecords = await this.prisma.salaryRecord.findMany({
      include: { staff: true },
    });

    const monthMap = new Map<string, { period: string; employees: number; basic: number; earned: number; overtime: number; deductions: number; netSalary: number; paid: number; balance: number }>();

    for (const sr of salaryRecords) {
      const period = `${sr.payrollMonth}/${sr.payrollYear}`;
      const entry = monthMap.get(period) || { period, employees: 0, basic: 0, earned: 0, overtime: 0, deductions: 0, netSalary: 0, paid: 0, balance: 0 };
      entry.employees += 1;
      entry.basic += Number(sr.monthlyBasicSalary);
      entry.earned += Number(sr.grossSalary);
      entry.overtime += Number(sr.overtimeAmount);
      entry.deductions += Number(sr.deductions) + Number(sr.advanceDeductions);
      entry.netSalary += Number(sr.netSalary);
      entry.paid += Number(sr.totalPaid);
      entry.balance += Number(sr.balanceAmount);
      monthMap.set(period, entry);
    }

    let rows = Array.from(monthMap.values()).map((r) => ({
      ...r,
      basic: Math.round(r.basic * 100) / 100,
      earned: Math.round(r.earned * 100) / 100,
      netSalary: Math.round(r.netSalary * 100) / 100,
      paid: Math.round(r.paid * 100) / 100,
      balance: Math.round(r.balance * 100) / 100,
    }));

    if (search) {
      rows = rows.filter((r) => r.period.includes(search));
    }

    const totalPayroll = rows.reduce((s, r) => s + r.netSalary, 0);
    const totalPaid = rows.reduce((s, r) => s + r.paid, 0);

    return {
      reportType: 'monthly-payroll-summary',
      reportTitle: 'Monthly Payroll Summary',
      category: 'STAFF',
      description: 'High-level executive monthly payroll report: gross obligations, total disbursements, and outstanding wages',
      dateRange: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      kpis: {
        totalPayrollCommitment: Math.round(totalPayroll * 100) / 100,
        totalPayrollDisbursed: Math.round(totalPaid * 100) / 100,
        monthsTracked: rows.length,
      },
      columns: [
        { key: 'period', label: 'Payroll Month', type: 'text' },
        { key: 'employees', label: 'Employees', type: 'text' },
        { key: 'basic', label: 'Basic Payroll (₹)', type: 'currency' },
        { key: 'earned', label: 'Earned Payroll (₹)', type: 'currency' },
        { key: 'netSalary', label: 'Net Payable (₹)', type: 'currency' },
        { key: 'paid', label: 'Disbursed (₹)', type: 'currency' },
        { key: 'balance', label: 'Outstanding (₹)', type: 'currency' },
      ],
      rows,
    };
  }
}
