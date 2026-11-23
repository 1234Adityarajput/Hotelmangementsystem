import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RelocateRoomDto } from './dto/relocate-room.dto';

@Injectable()
export class CheckInCheckOutService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayCheckIns() {
    return this.prisma.booking.findMany({
      where: {
        bookingStatus: 'RESERVED',
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
      },
      orderBy: { checkInDate: 'asc' },
    });
  }

  async getTodayCheckOuts() {
    return this.prisma.booking.findMany({
      where: {
        bookingStatus: 'CHECKED_IN',
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        invoices: true,
      },
      orderBy: { expectedCheckOutDate: 'asc' },
    });
  }

  async getActiveStays() {
    return this.prisma.booking.findMany({
      where: { bookingStatus: 'CHECKED_IN' },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingItems: true,
        invoices: true,
      },
      orderBy: { actualCheckInAt: 'desc' },
    });
  }

  async performCheckIn(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: true, primaryGuest: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.bookingStatus !== 'RESERVED') {
      throw new BadRequestException(
        `Cannot check in: Booking status is already ${booking.bookingStatus}. Only RESERVED bookings can be checked in.`,
      );
    }

    if (booking.room.roomStatus === 'MAINTENANCE') {
      throw new BadRequestException(`Cannot check in: Room ${booking.room.roomNumber} is under maintenance.`);
    }

    try {
      const now = new Date();
      const updated = await this.prisma.booking.update({
        where: { id },
        data: {
          bookingStatus: 'CHECKED_IN',
          actualCheckInAt: now,
        },
        include: {
          room: true,
          primaryGuest: true,
        },
      });

      // Audit Log
      await this.prisma.auditLog.create({
        data: {
          entityType: 'BOOKING',
          entityId: id,
          action: 'UPDATE',
          previousValues: { bookingStatus: booking.bookingStatus, actualCheckInAt: booking.actualCheckInAt },
          newValues: { bookingStatus: 'CHECKED_IN', actualCheckInAt: now },
          description: `Checked in guest ${booking.primaryGuest.fullName} into room ${booking.room.roomNumber}`,
        },
      });

      return updated;
    } catch (err: any) {
      if (err.message && err.message.includes('Cannot allocate room')) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async performCheckOut(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: true, primaryGuest: true, invoices: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.bookingStatus !== 'CHECKED_IN') {
      throw new BadRequestException(
        `Cannot check out: Booking status is ${booking.bookingStatus}. Only CHECKED_IN stays can be checked out.`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: 'CHECKED_OUT',
        actualCheckOutAt: now,
      },
      include: {
        room: true,
        primaryGuest: true,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'BOOKING',
        entityId: id,
        action: 'UPDATE',
        previousValues: { bookingStatus: booking.bookingStatus, actualCheckOutAt: booking.actualCheckOutAt },
        newValues: { bookingStatus: 'CHECKED_OUT', actualCheckOutAt: now },
        description: `Checked out guest ${booking.primaryGuest.fullName} from room ${booking.room.roomNumber}`,
      },
    });

    return updated;
  }

  async relocateRoom(id: string, dto: RelocateRoomDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: true, primaryGuest: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.bookingStatus !== 'CHECKED_IN' && booking.bookingStatus !== 'RESERVED') {
      throw new BadRequestException(
        `Cannot relocate room for booking with status ${booking.bookingStatus}`,
      );
    }

    if (booking.roomId === dto.newRoomId) {
      throw new BadRequestException('Booking is already allocated to this room.');
    }

    const newRoom = await this.prisma.room.findUnique({
      where: { id: dto.newRoomId },
    });

    if (!newRoom) {
      throw new NotFoundException(`Target room with ID ${dto.newRoomId} not found`);
    }

    if (newRoom.roomStatus === 'MAINTENANCE') {
      throw new BadRequestException(`Target room ${newRoom.roomNumber} is under maintenance.`);
    }

    try {
      const updated = await this.prisma.booking.update({
        where: { id },
        data: {
          roomId: dto.newRoomId,
          roomRatePerNight: newRoom.pricePerNight, // update room rate snapshot
          notes: dto.reason
            ? `${booking.notes || ''} [Relocated from Room ${booking.room.roomNumber} to ${newRoom.roomNumber}: ${dto.reason}]`.trim()
            : booking.notes,
        },
        include: {
          room: { include: { roomType: true } },
          primaryGuest: true,
        },
      });

      // Audit Log
      await this.prisma.auditLog.create({
        data: {
          entityType: 'BOOKING',
          entityId: id,
          action: 'UPDATE',
          previousValues: { roomId: booking.roomId, roomNumber: booking.room.roomNumber },
          newValues: { roomId: newRoom.id, roomNumber: newRoom.roomNumber },
          description: `Relocated booking ${booking.bookingNumber} from room ${booking.room.roomNumber} to ${newRoom.roomNumber}`,
        },
      });

      return updated;
    } catch (err: any) {
      if (err.message && (err.message.includes('no_overlapping_active_bookings') || err.message.includes('23P01'))) {
        throw new ConflictException(
          `Target room ${newRoom.roomNumber} already has an overlapping active booking during this stay period.`,
        );
      }
      throw err;
    }
  }
}
