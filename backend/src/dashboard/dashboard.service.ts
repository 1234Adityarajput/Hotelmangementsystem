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

    // 1. Room metrics
    const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms] = await Promise.all([
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'OCCUPIED' } }),
      this.prisma.room.count({ where: { isActive: true, roomStatus: 'MAINTENANCE' } }),
    ]);

    // 2. Today's check-ins & check-outs
    const [todayCheckIns, todayCheckOuts] = await Promise.all([
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
    ]);

    // 3. Guest metrics
    const totalGuests = await this.prisma.guest.count();

    // 4. Financial metrics
    const todayPayments = await this.prisma.payment.aggregate({
      where: {
        paymentDate: { gte: today, lt: tomorrow },
        paymentStatus: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const monthlyPayments = await this.prisma.payment.aggregate({
      where: {
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        paymentStatus: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const pendingInvoices = await this.prisma.invoice.aggregate({
      where: {
        invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
        balanceAmount: { gt: 0 },
      },
      _sum: { balanceAmount: true },
    });

    // 5. Total Active Bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] },
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
      },
      guests: {
        total: totalGuests,
      },
      revenue: {
        today: Number(todayPayments._sum.amount || 0),
        monthly: Number(monthlyPayments._sum.amount || 0),
        pendingBalance: Number(pendingInvoices._sum.balanceAmount || 0),
        currency: 'INR',
      },
    };
  }

  async getRecentBookings(limit = 5) {
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
