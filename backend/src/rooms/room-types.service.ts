import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.roomType.findMany({
      orderBy: { defaultPricePerNight: 'asc' },
      include: {
        _count: {
          select: { rooms: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { roomNumber: 'asc' },
        },
      },
    });
    if (!roomType) {
      throw new NotFoundException(`Room type with ID ${id} not found`);
    }
    return roomType;
  }

  async create(dto: CreateRoomTypeDto) {
    const existing = await this.prisma.roomType.findUnique({ where: { name: dto.name.trim() } });
    if (existing) {
      throw new ConflictException(`Room type with name "${dto.name}" already exists`);
    }

    return this.prisma.roomType.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        defaultPricePerNight: dto.defaultPricePerNight,
        capacity: dto.capacity,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateRoomTypeDto) {
    const existing = await this.prisma.roomType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Room type with ID ${id} not found`);
    }

    if (dto.name && dto.name.trim() !== existing.name) {
      const nameConflict = await this.prisma.roomType.findUnique({ where: { name: dto.name.trim() } });
      if (nameConflict) {
        throw new ConflictException(`Room type with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.roomType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.defaultPricePerNight !== undefined && { defaultPricePerNight: dto.defaultPricePerNight }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const count = await this.prisma.room.count({ where: { roomTypeId: id } });
    if (count > 0) {
      throw new ConflictException(`Cannot delete room type: ${count} rooms are assigned to it. Deactivate instead.`);
    }

    await this.prisma.roomType.delete({ where: { id } });
    return { success: true, message: 'Room type deleted successfully' };
  }
}
