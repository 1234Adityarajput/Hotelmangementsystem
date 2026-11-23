import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryRoomDto } from './dto/query-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRoomDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (query.status) {
      where.roomStatus = query.status;
    }
    if (query.roomTypeId) {
      where.roomTypeId = query.roomTypeId;
    }
    if (query.floor !== undefined) {
      where.floor = query.floor;
    }
    if (query.search) {
      where.roomNumber = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        include: {
          roomType: true,
          bookings: {
            where: { bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] } },
            take: 1,
            include: {
              primaryGuest: {
                select: { id: true, fullName: true, mobileNumber: true },
              },
            },
            orderBy: { checkInDate: 'asc' },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        currentBooking: r.bookings[0] || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAvailable(checkIn?: string, checkOut?: string, roomTypeId?: string) {
    const where: any = {
      isActive: true,
      roomStatus: { not: 'MAINTENANCE' },
    };
    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    if (!checkIn || !checkOut) {
      // Return currently AVAILABLE rooms
      return this.prisma.room.findMany({
        where: { ...where, roomStatus: 'AVAILABLE' },
        include: { roomType: true },
        orderBy: { roomNumber: 'asc' },
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find rooms that have active booking overlapping with [checkInDate, checkOutDate)
    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] },
        AND: [
          { checkInDate: { lt: checkOutDate } },
          { expectedCheckOutDate: { gt: checkInDate } },
        ],
      },
      select: { roomId: true },
    });

    const bookedRoomIds = overlappingBookings.map((b) => b.roomId);

    return this.prisma.room.findMany({
      where: {
        ...where,
        id: { notIn: bookedRoomIds },
      },
      include: { roomType: true },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            primaryGuest: true,
          },
        },
      },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async create(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({ where: { roomNumber: dto.roomNumber.trim() } });
    if (existing) {
      throw new ConflictException(`Room number "${dto.roomNumber}" already exists`);
    }

    const roomType = await this.prisma.roomType.findUnique({ where: { id: dto.roomTypeId } });
    if (!roomType) {
      throw new NotFoundException(`Room type with ID ${dto.roomTypeId} not found`);
    }

    const room = await this.prisma.room.create({
      data: {
        roomNumber: dto.roomNumber.trim(),
        roomTypeId: dto.roomTypeId,
        description: dto.description,
        floor: dto.floor !== undefined ? dto.floor : 1,
        pricePerNight: dto.pricePerNight,
        roomStatus: dto.roomStatus || 'AVAILABLE',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: { roomType: true },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'ROOM',
        entityId: room.id,
        action: 'CREATE',
        newValues: room as any,
        description: `Created room ${room.roomNumber} (${room.roomType.name})`,
      },
    });

    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    const existing = await this.prisma.room.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    if (dto.roomNumber && dto.roomNumber.trim() !== existing.roomNumber) {
      const numberConflict = await this.prisma.room.findUnique({ where: { roomNumber: dto.roomNumber.trim() } });
      if (numberConflict) {
        throw new ConflictException(`Room number "${dto.roomNumber}" already exists`);
      }
    }

    try {
      const updated = await this.prisma.room.update({
        where: { id },
        data: {
          ...(dto.roomNumber !== undefined && { roomNumber: dto.roomNumber.trim() }),
          ...(dto.roomTypeId !== undefined && { roomTypeId: dto.roomTypeId }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.floor !== undefined && { floor: dto.floor }),
          ...(dto.pricePerNight !== undefined && { pricePerNight: dto.pricePerNight }),
          ...(dto.roomStatus !== undefined && { roomStatus: dto.roomStatus }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        include: { roomType: true },
      });

      // Audit log
      await this.prisma.auditLog.create({
        data: {
          entityType: 'ROOM',
          entityId: id,
          action: 'UPDATE',
          previousValues: existing as any,
          newValues: updated as any,
          description: `Updated room ${updated.roomNumber}`,
        },
      });

      return updated;
    } catch (err: any) {
      if (err.message && err.message.includes('Cannot mark room')) {
        throw new BadRequestException(err.message.split('ERROR: ')[1] || err.message);
      }
      throw err;
    }
  }

  async updateStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE') {
    return this.update(id, { roomStatus: status });
  }

  async remove(id: string) {
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        roomId: id,
        bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] },
      },
    });
    if (activeBooking) {
      throw new ConflictException('Cannot delete or deactivate room with active or reserved bookings');
    }

    await this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, message: 'Room deactivated successfully' };
  }
}
