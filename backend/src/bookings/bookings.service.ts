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
}
