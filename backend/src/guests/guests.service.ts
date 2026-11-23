import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { QueryGuestDto } from './dto/query-guest.dto';
import { CreateGuestDocumentDto } from './dto/create-document.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateGuestCode(): Promise<string> {
    const count = await this.prisma.guest.count();
    const padded = String(count + 1).padStart(5, '0');
    let code = `GST-${padded}`;

    // Verify uniqueness
    const exists = await this.prisma.guest.findUnique({ where: { guestCode: code } });
    if (exists) {
      code = `GST-${Date.now().toString().slice(-6)}`;
    }
    return code;
  }

  async findAll(query: QueryGuestDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { mobileNumber: { contains: term } },
        { guestCode: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          _count: {
            select: {
              stayHistory: true,
            },
          },
        },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      items: items.map((g) => ({
        ...g,
        totalStays: g._count?.stayHistory || 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        documents: true,
        stayHistory: {
          include: {
            booking: {
              include: {
                room: {
                  include: {
                    roomType: true,
                  },
                },
                invoices: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    return guest;
  }

  async create(dto: CreateGuestDto) {
    const guestCode = await this.generateGuestCode();

    const guest = await this.prisma.guest.create({
      data: {
        guestCode,
        fullName: dto.fullName,
        mobileNumber: dto.mobileNumber,
        alternateMobileNumber: dto.alternateMobileNumber,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country || 'India',
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'GUEST',
        entityId: guest.id,
        action: 'CREATE',
        newValues: guest as any,
        description: `Created new guest ${guest.fullName} (${guest.guestCode})`,
      },
    });

    return guest;
  }

  async update(id: string, dto: UpdateGuestDto) {
    const existing = await this.prisma.guest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    const updated = await this.prisma.guest.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber }),
        ...(dto.alternateMobileNumber !== undefined && { alternateMobileNumber: dto.alternateMobileNumber }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'GUEST',
        entityId: id,
        action: 'UPDATE',
        previousValues: existing as any,
        newValues: updated as any,
        description: `Updated guest details for ${updated.fullName} (${updated.guestCode})`,
      },
    });

    return updated;
  }

  async addDocument(guestId: string, dto: CreateGuestDocumentDto) {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    const doc = await this.prisma.guestDocument.create({
      data: {
        guestId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentFileReference: dto.documentFileReference,
      },
    });

    return doc;
  }

  async deleteDocument(guestId: string, docId: string) {
    const doc = await this.prisma.guestDocument.findFirst({
      where: { id: docId, guestId },
    });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${docId} not found for this guest`);
    }

    await this.prisma.guestDocument.delete({ where: { id: docId } });
    return { success: true, message: 'Document deleted successfully' };
  }
}
