import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // 1. Room metrics (Total, Available, Occupied, Maintenance)
    const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms] = await Promise.all([
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'OCCUPIED' } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'MAINTENANCE' } }),
    ]);

    // 2. Today's check-ins & check-outs & active bookings
    const [todayCheckIns, todayCheckOuts, activeBookings, inHouseStays] = await Promise.all([
      this.prisma.booking.count({
        where: {
          checkInDate: { gte: today, lt: tomorrow },
          bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          expectedCheckOutDate: { gte: today, lt: tomorrow },
          bookingStatus: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] },
        },
      }),
      this.prisma.booking.findMany({
        where: { bookingStatus: 'CHECKED_IN' },
        select: { numberOfGuests: true },
      }),
    ]);

    // Currently Staying Guests (sum of primary + additional guests in checked-in stays)
    const currentlyStayingGuests = inHouseStays.reduce((sum, b) => sum + (b.numberOfGuests || 1), 0);

    // 3. Guest metrics
    const [totalGuests, guestsWithDocs] = await Promise.all([
      this.prisma.guest.count(),
      this.prisma.guestDocument.groupBy({
        by: ['guestId'],
        _count: { guestId: true },
      }).then(r => r.length),
    ]);

    // 4. Financial metrics (Today's revenue, Monthly revenue, Pending Guest Payments)
    const [todayPayments, monthlyPayments, pendingInvoices] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          paymentDate: { gte: today, lt: tomorrow },
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
        },
        _sum: { balanceAmount: true },
      }),
    ]);

    // 5. Total Hotel Expenses (Today, Monthly, All-time)
    const [todayExpenses, monthlyExpenses, totalExpenses] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
      }),
    ]);

    // 6. Total Staff Members & Today's Attendance
    const [totalStaff, todayAttendanceRecords] = await Promise.all([
      this.prisma.staff.count({ where: { employmentStatus: 'ACTIVE' } }),
      this.prisma.attendance.findMany({
        where: { attendanceDate: today },
      }),
    ]);

    const presentCount = todayAttendanceRecords.filter(a => a.attendanceStatus === 'PRESENT').length;
    const absentCount = todayAttendanceRecords.filter(a => a.attendanceStatus === 'ABSENT').length;
    const halfDayCount = todayAttendanceRecords.filter(a => a.attendanceStatus === 'HALF_DAY').length;
    const leaveCount = todayAttendanceRecords.filter(a => a.attendanceStatus === 'LEAVE' || a.attendanceStatus === 'WEEKLY_OFF').length;
    const totalMarked = todayAttendanceRecords.length;
    const attendanceRate = totalStaff > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalStaff) * 100) : 0;

    // 7. Monthly Salary Summary
    const currentMonthSalary = await this.prisma.salaryRecord.aggregate({
      where: {
        payrollMonth: today.getMonth() + 1,
        payrollYear: today.getFullYear(),
      },
      _sum: {
        netSalary: true,
        totalPaid: true,
        balanceAmount: true,
      },
    });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        occupancyRate,
      },
      stays: {
        todayCheckIns,
        todayCheckOuts,
        activeBookings,
        currentlyStayingGuests,
      },
      guests: {
        total: totalGuests,
        currentlyStaying: currentlyStayingGuests,
        withDocuments: guestsWithDocs,
      },
      revenue: {
        today: Number(todayPayments._sum.amount || 0),
        monthly: Number(monthlyPayments._sum.amount || 0),
        pendingBalance: Number(pendingInvoices._sum.balanceAmount || 0),
        currency: 'INR',
      },
      expenses: {
        today: Number(todayExpenses._sum.amount || 0),
        monthly: Number(monthlyExpenses._sum.amount || 0),
        total: Number(totalExpenses._sum.amount || 0),
      },
      staff: {
        total: totalStaff,
        todayAttendance: {
          present: presentCount,
          absent: absentCount,
          halfDay: halfDayCount,
          leave: leaveCount,
          totalMarked,
          attendanceRate,
        },
      },
      payroll: {
        monthlyNetSalary: Number(currentMonthSalary._sum.netSalary || 0),
        monthlyDisbursed: Number(currentMonthSalary._sum.totalPaid || 0),
        pendingBalance: Number(currentMonthSalary._sum.balanceAmount || 0),
      },
    };
  }

  async getAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Daily Revenue Overview (Last 7 days)
    const dailyRevenue: Array<{ date: string; day: string; revenue: number; transactions: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const payments = await this.prisma.payment.aggregate({
        where: {
          paymentDate: { gte: d, lt: nextD },
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      dailyRevenue.push({
        date: dateStr,
        day: dayName,
        revenue: Number(payments._sum.amount || 0),
        transactions: payments._count.id || 0,
      });
    }

    // 2. Monthly Revenue Overview (Last 6 months)
    const monthlyRevenue: Array<{ month: string; revenue: number; expenses: number; netProfit: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59);

      const [payments, expenses] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            paymentDate: { gte: mDate, lte: mEnd },
            paymentStatus: 'COMPLETED',
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            paymentDate: { gte: mDate, lte: mEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const rev = Number(payments._sum.amount || 0);
      const exp = Number(expenses._sum.amount || 0);
      const monthLabel = mDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      monthlyRevenue.push({
        month: monthLabel,
        revenue: rev,
        expenses: exp,
        netProfit: rev - exp,
      });
    }

    // 3. Room Occupancy Statistics
    const roomOccupancy = await this.getOccupancyStats();

    // 4. Guest Statistics
    const [totalGuests, verifiedDocs, inHouseStays, newGuestsThisMonth] = await Promise.all([
      this.prisma.guest.count(),
      this.prisma.guestDocument.groupBy({
        by: ['guestId'],
        _count: { guestId: true },
      }).then(r => r.length),
      this.prisma.booking.findMany({
        where: { bookingStatus: 'CHECKED_IN' },
        select: { numberOfGuests: true },
      }),
      this.prisma.guest.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
        },
      }),
    ]);

    const currentlyStayingGuests = inHouseStays.reduce((sum, b) => sum + (b.numberOfGuests || 1), 0);

    // 5. Income and Expense Analysis
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [curMonthPayments, curMonthExpenses, curMonthPayroll] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
          paymentStatus: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.salaryPayment.aggregate({
        where: {
          paymentDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { paymentAmount: true },
      }),
    ]);

    const revThisMonth = Number(curMonthPayments._sum.amount || 0);
    const expThisMonth = Number(curMonthExpenses._sum.amount || 0);
    const payrollThisMonth = Number(curMonthPayroll._sum.paymentAmount || 0);
    const totalOutflow = expThisMonth + payrollThisMonth;
    const netCashFlow = revThisMonth - totalOutflow;
    const operatingMargin = revThisMonth > 0 ? Math.round((netCashFlow / revThisMonth) * 100) : 0;

    // 6. Staff Attendance Summary
    const [activeStaff, todayAttendanceRecords] = await Promise.all([
      this.prisma.staff.count({ where: { employmentStatus: 'ACTIVE' } }),
      this.prisma.attendance.findMany({ where: { attendanceDate: today } }),
    ]);

    const present = todayAttendanceRecords.filter(a => a.attendanceStatus === 'PRESENT').length;
    const absent = todayAttendanceRecords.filter(a => a.attendanceStatus === 'ABSENT').length;
    const halfDay = todayAttendanceRecords.filter(a => a.attendanceStatus === 'HALF_DAY').length;
    const leave = todayAttendanceRecords.filter(a => a.attendanceStatus === 'LEAVE' || a.attendanceStatus === 'WEEKLY_OFF').length;
    const unmarked = Math.max(0, activeStaff - todayAttendanceRecords.length);
    const presentPercentage = activeStaff > 0 ? Math.round((present / activeStaff) * 100) : 0;

    return {
      dailyRevenue,
      monthlyRevenue,
      roomOccupancy,
      guestStats: {
        totalGuests,
        currentlyStaying: currentlyStayingGuests,
        withDocuments: verifiedDocs,
        newThisMonth: newGuestsThisMonth,
      },
      incomeExpenseAnalysis: {
        revenue: revThisMonth,
        expenses: expThisMonth,
        payroll: payrollThisMonth,
        totalOutflow,
        netCashFlow,
        operatingMargin,
      },
      staffAttendanceSummary: {
        activeStaff,
        present,
        absent,
        halfDay,
        leave,
        unmarked,
        presentPercentage,
      },
    };
  }

  async getRecentBookings(limit = 6) {
    const bookings = await this.prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        primaryGuest: {
          select: {
            id: true,
            guestCode: true,
            fullName: true,
            mobileNumber: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: { select: { name: true } },
          },
        },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      guestName: b.primaryGuest.fullName,
      guestCode: b.primaryGuest.guestCode,
      mobileNumber: b.primaryGuest.mobileNumber,
      roomNumber: b.room.roomNumber,
      roomType: b.room.roomType.name,
      checkInDate: b.checkInDate,
      expectedCheckOutDate: b.expectedCheckOutDate,
      bookingStatus: b.bookingStatus,
      totalAmount: Number(b.roomRatePerNight) * b.numberOfNights,
      advanceAmount: Number(b.advanceAmount),
      createdAt: b.createdAt,
    }));
  }

  async getRecentActivities(limit = 10) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { changedAt: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id,
      entityType: l.entityType,
      entityId: l.entityId,
      action: l.action,
      description: l.description,
      changedAt: l.changedAt,
    }));
  }

  async getOccupancyStats() {
    const roomTypes = await this.prisma.roomType.findMany({
      include: {
        rooms: {
          where: { isActive: true },
        },
      },
    });

    return roomTypes.map((rt) => {
      const total = rt.rooms.length;
      const occupied = rt.rooms.filter((r) => r.roomStatus === 'OCCUPIED').length;
      const available = rt.rooms.filter((r) => r.roomStatus === 'AVAILABLE').length;
      const maintenance = rt.rooms.filter((r) => r.roomStatus === 'MAINTENANCE').length;
      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        capacity: rt.capacity,
        total,
        occupied,
        available,
        maintenance,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    });
  }
}
