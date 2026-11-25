import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateBookingNumber(): Promise<string> {
    const today = new Date();
    const prefix = `BKG-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.booking.count({
      where: { bookingNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: QueryBookingDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.bookingStatus = query.status;
    }
    if (query.roomId) {
      where.roomId = query.roomId;
    }
    if (query.guestId) {
      where.primaryGuestId = query.guestId;
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { bookingNumber: { contains: term, mode: 'insensitive' } },
        { primaryGuest: { fullName: { contains: term, mode: 'insensitive' } } },
        { primaryGuest: { mobileNumber: { contains: term } } },
        { room: { roomNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          primaryGuest: true,
          room: { include: { roomType: true } },
          bookingGuests: { include: { guest: true } },
          payments: true,
          invoices: true,
        },
      }),
      this.prisma.booking.count({ where }),
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
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingGuests: { include: { guest: true } },
        bookingItems: { include: { item: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        invoices: { include: { payments: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async create(dto: CreateBookingDto) {
    const primaryGuest = await this.prisma.guest.findUnique({ where: { id: dto.primaryGuestId } });
    if (!primaryGuest) {
      throw new NotFoundException(`Primary guest with ID ${dto.primaryGuestId} not found`);
    }

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${dto.roomId} not found`);
    }

    if (room.roomStatus === 'MAINTENANCE') {
      throw new BadRequestException('Room is currently under maintenance and cannot be reserved');
    }

    const checkIn = new Date(dto.checkInDate);
    const checkOut = new Date(dto.expectedCheckOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Expected checkout date must be after check-in date');
    }

    const diffDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const numberOfNights = dto.numberOfNights || Math.max(1, diffDays);
    const roomRate = dto.roomRatePerNight !== undefined ? dto.roomRatePerNight : Number(room.pricePerNight);
    const bookingNumber = await this.generateBookingNumber();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create Booking (triggers auto-create junction record for primary guest)
        const booking = await tx.booking.create({
          data: {
            bookingNumber,
            primaryGuestId: dto.primaryGuestId,
            roomId: dto.roomId,
            bookingStatus: 'RESERVED',
            checkInDate: checkIn,
            checkInTime: dto.checkInTime || '12:00 PM',
            expectedCheckOutDate: checkOut,
            expectedCheckOutTime: dto.expectedCheckOutTime || '11:00 AM',
            numberOfNights,
            numberOfGuests: dto.numberOfGuests || 1,
            roomRatePerNight: roomRate,
            advanceAmount: dto.advanceAmount || 0,
            notes: dto.notes,
          },
          include: {
            primaryGuest: true,
            room: { include: { roomType: true } },
          },
        });

        // 2. Add co-guests if provided
        if (dto.coGuestIds && dto.coGuestIds.length > 0) {
          for (const coGuestId of dto.coGuestIds) {
            if (coGuestId !== dto.primaryGuestId) {
              await tx.bookingGuest.create({
                data: {
                  bookingId: booking.id,
                  guestId: coGuestId,
                  isPrimaryGuest: false,
                },
              });
            }
          }
        }

        // 3. Record advance payment if provided
        if (dto.advanceAmount && dto.advanceAmount > 0) {
          const paymentRef = `PAY-ADV-${Date.now().toString().slice(-6)}`;
          await tx.payment.create({
            data: {
              paymentReference: paymentRef,
              bookingId: booking.id,
              paymentType: 'ADVANCE',
              paymentMethod: dto.advancePaymentMethod || 'CASH',
              amount: dto.advanceAmount,
              paymentDate: new Date(),
              paymentStatus: 'COMPLETED',
              notes: `Advance payment for booking ${booking.bookingNumber}`,
            },
          });
        }

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            entityType: 'BOOKING',
            entityId: booking.id,
            action: 'CREATE',
            newValues: booking as any,
            description: `Created booking ${booking.bookingNumber} for ${primaryGuest.fullName} in room ${room.roomNumber}`,
          },
        });

        return booking;
      });

      return result;
    } catch (err: any) {
      if (err.message && (err.message.includes('no_overlapping_active_bookings') || err.message.includes('23P01'))) {
        throw new ConflictException(
          `Room ${room.roomNumber} is already reserved or occupied for the requested dates (${dto.checkInDate} to ${dto.expectedCheckOutDate}).`,
        );
      }
      if (err.message && err.message.includes('Cannot allocate room')) {
        throw new BadRequestException(`Room ${room.roomNumber} is under maintenance and cannot be allocated.`);
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (existing.bookingStatus === 'CHECKED_OUT' || existing.bookingStatus === 'CANCELLED') {
      throw new BadRequestException(`Cannot modify booking with status ${existing.bookingStatus}`);
    }

    try {
      const updated = await this.prisma.booking.update({
        where: { id },
        data: {
          ...(dto.primaryGuestId !== undefined && { primaryGuestId: dto.primaryGuestId }),
          ...(dto.roomId !== undefined && { roomId: dto.roomId }),
          ...(dto.checkInDate !== undefined && { checkInDate: new Date(dto.checkInDate) }),
          ...(dto.checkInTime !== undefined && { checkInTime: dto.checkInTime }),
          ...(dto.expectedCheckOutDate !== undefined && { expectedCheckOutDate: new Date(dto.expectedCheckOutDate) }),
          ...(dto.expectedCheckOutTime !== undefined && { expectedCheckOutTime: dto.expectedCheckOutTime }),
          ...(dto.numberOfNights !== undefined && { numberOfNights: dto.numberOfNights }),
          ...(dto.numberOfGuests !== undefined && { numberOfGuests: dto.numberOfGuests }),
          ...(dto.roomRatePerNight !== undefined && { roomRatePerNight: dto.roomRatePerNight }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: {
          primaryGuest: true,
          room: { include: { roomType: true } },
        },
      });

      // Audit Log
      await this.prisma.auditLog.create({
        data: {
          entityType: 'BOOKING',
          entityId: id,
          action: 'UPDATE',
          previousValues: existing as any,
          newValues: updated as any,
          description: `Updated booking ${updated.bookingNumber}`,
        },
      });

      return updated;
    } catch (err: any) {
      if (err.message && (err.message.includes('no_overlapping_active_bookings') || err.message.includes('23P01'))) {
        throw new ConflictException('Room has a conflicting reservation or stay during these dates.');
      }
      throw err;
    }
  }

  async cancel(id: string, reason?: string) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!existing) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (existing.bookingStatus !== 'RESERVED') {
      throw new BadRequestException(`Only RESERVED bookings can be cancelled. Current status: ${existing.bookingStatus}`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: 'CANCELLED',
        notes: reason ? `${existing.notes || ''} [Cancelled: ${reason}]`.trim() : existing.notes,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'BOOKING',
        entityId: id,
        action: 'CANCEL',
        previousValues: existing as any,
        newValues: updated as any,
        description: `Cancelled booking ${existing.bookingNumber}: ${reason || 'No reason provided'}`,
      },
    });

    return updated;
  }

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
      }
    }
    if (yearParam) {
      year = parseInt(yearParam, 10) || year;
    }

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch active bookings for this month
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { checkInDate: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingGuests: { include: { guest: true } },
        payments: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedActive = activeBookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      primaryGuestId: b.primaryGuestId,
      primaryGuest: b.primaryGuest,
      roomId: b.roomId,
      room: b.room,
      bookingStatus: b.bookingStatus,
      checkInDate: b.checkInDate,
      checkInTime: b.checkInTime,
      expectedCheckOutDate: b.expectedCheckOutDate,
      expectedCheckOutTime: b.expectedCheckOutTime,
      actualCheckInDate: b.actualCheckInAt,
      actualCheckOutDate: b.actualCheckOutAt,
      numberOfNights: b.numberOfNights,
      numberOfGuests: b.numberOfGuests,
      roomRatePerNight: Number(b.roomRatePerNight),
      advanceAmount: Number(b.advanceAmount || 0),
      totalCharges: Number(b.roomRatePerNight) * b.numberOfNights,
      notes: b.notes,
      isActive: true,
      isDeleted: false,
      status: 'ACTIVE',
      payments: b.payments,
      invoices: b.invoices,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    // 2. Fetch deleted booking logs from AuditLog for this month
    const deleteLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'BOOKING',
        action: 'DELETE',
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    const deletedBookings = deleteLogs.map((log) => {
      const prev = (log.previousValues || {}) as any;
      return {
        id: log.entityId || prev.id || `archived-booking-${log.id}`,
        bookingNumber: prev.bookingNumber || 'ARCHIVED-BKG',
        primaryGuestId: prev.primaryGuestId || '',
        primaryGuest: prev.primaryGuest || {
          fullName: prev.guestFullName || 'Deleted / Archived Guest',
          mobileNumber: prev.guestMobileNumber || '',
        },
        roomId: prev.roomId || '',
        room: prev.room || {
          roomNumber: prev.roomNumber || 'N/A',
          roomType: { name: prev.roomTypeName || 'Room' },
        },
        bookingStatus: prev.bookingStatus || 'CANCELLED',
        checkInDate: prev.checkInDate || log.changedAt,
        checkInTime: prev.checkInTime || '12:00 PM',
        expectedCheckOutDate: prev.expectedCheckOutDate || log.changedAt,
        expectedCheckOutTime: prev.expectedCheckOutTime || '11:00 AM',
        actualCheckInDate: prev.actualCheckInDate || null,
        actualCheckOutDate: prev.actualCheckOutDate || null,
        numberOfNights: prev.numberOfNights || 1,
        numberOfGuests: prev.numberOfGuests || 1,
        roomRatePerNight: Number(prev.roomRatePerNight || 0),
        advanceAmount: Number(prev.advanceAmount || 0),
        totalCharges: Number(prev.totalCharges || 0),
        notes: prev.notes || '',
        isActive: false,
        isDeleted: true,
        status: 'DELETED',
        createdAt: prev.createdAt || log.changedAt,
        deletedAt: log.changedAt,
      };
    });

    // 3. Combine both lists sorted by registration / creation date descending
    const allHistory = [...enrichedActive, ...deletedBookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      month,
      year,
      monthName: startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalCount: allHistory.length,
      activeCount: enrichedActive.length,
      deletedCount: deletedBookings.length,
      items: allHistory,
    };
  }

  async remove(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingGuests: { include: { guest: true } },
        bookingItems: true,
        payments: true,
        invoices: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // 1. Create audit log snapshot for permanent booking history preservation
    await this.prisma.auditLog.create({
      data: {
        entityType: 'BOOKING',
        entityId: booking.id,
        action: 'DELETE',
        previousValues: {
          ...booking,
          guestFullName: booking.primaryGuest?.fullName,
          guestMobileNumber: booking.primaryGuest?.mobileNumber,
          roomNumber: booking.room?.roomNumber,
          roomTypeName: booking.room?.roomType?.name,
          deletedAt: new Date().toISOString(),
        } as any,
        description: `Deleted booking ${booking.bookingNumber} (${booking.primaryGuest?.fullName}, Room ${booking.room?.roomNumber}) from active records. Complete dossier preserved in history.`,
      },
    });

    // 2. Safely clean up in isolated transaction with trigger bypass
    await this.prisma.$transaction(async (tx) => {
      let triggerDisabled = false;

      try {
        await tx.$executeRawUnsafe(
          `ALTER TABLE "booking_guests" DISABLE TRIGGER trg_protect_primary_booking_guest`
        );
        triggerDisabled = true;
      } catch (err) {
        try {
          await tx.$executeRawUnsafe(`SET LOCAL hotel.allow_guest_delete = 'on'`);
        } catch (_) {}
      }

      try {
        // A. Delete payments
        await tx.payment.deleteMany({
          where: { bookingId: id },
        });

        // B. Delete invoices
        await tx.invoice.deleteMany({
          where: { bookingId: id },
        });

        // C. Delete booked items / POS charges
        await tx.bookingItem.deleteMany({
          where: { bookingId: id },
        });

        // D. Delete booking guests junction records
        await tx.bookingGuest.deleteMany({
          where: { bookingId: id },
        });

        // E. If booking was CHECKED_IN, reset room to AVAILABLE
        if (booking.bookingStatus === 'CHECKED_IN' && booking.roomId) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { roomStatus: 'AVAILABLE' },
          });
        }

        // F. Delete the booking itself
        await tx.booking.delete({
          where: { id },
        });
      } finally {
        if (triggerDisabled) {
          try {
            await tx.$executeRawUnsafe(
              `ALTER TABLE "booking_guests" ENABLE TRIGGER trg_protect_primary_booking_guest`
            );
          } catch (_) {}
        }
      }
    });

    return {
      success: true,
      message: `Reservation ${booking.bookingNumber} (${booking.primaryGuest?.fullName}) deleted from active database and archived in history.`,
      bookingNumber: booking.bookingNumber,
    };
  }
}
