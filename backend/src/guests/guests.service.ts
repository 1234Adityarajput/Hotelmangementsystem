import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateGuestDto, AdditionalGuestDto } from './dto/create-guest.dto';
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

  private enrichGuest(guest: any) {
    if (!guest) return guest;
    const docs = guest.documents || [];

    // Real identity documents (exclude CO_GUEST and PARTY_INFO markers)
    const standardDocs = docs.filter(
      (d: any) => d.documentType !== 'CO_GUEST' && d.documentType !== 'PARTY_INFO'
    );

    // Companions / Co-guests
    const coGuestDocs = docs.filter((d: any) => d.documentType === 'CO_GUEST');
    const additionalGuests = coGuestDocs.map((d: any) => {
      try {
        const parsed = JSON.parse(d.documentFileReference);
        return {
          id: d.id,
          fullName: parsed.fullName || d.documentNumber,
          age: parsed.age !== undefined ? Number(parsed.age) : null,
          gender: parsed.gender || 'OTHER',
          relationship: parsed.relationship || 'Companion',
          idProofType: parsed.idProofType || 'AADHAAR',
          idProofNumber: parsed.idProofNumber || '',
          documentFileReference: parsed.documentFileReference || '',
          uploadedAt: d.uploadedAt,
        };
      } catch {
        return {
          id: d.id,
          fullName: d.documentNumber,
          age: null,
          gender: 'OTHER',
          relationship: 'Companion',
          idProofType: 'AADHAAR',
          idProofNumber: '',
          documentFileReference: d.documentFileReference || '',
          uploadedAt: d.uploadedAt,
        };
      }
    });

    // Party size / Number of Guests
    const partyDoc = docs.find((d: any) => d.documentType === 'PARTY_INFO');
    let numberOfGuests = 1;
    if (partyDoc) {
      try {
        const parsed = JSON.parse(partyDoc.documentFileReference);
        numberOfGuests = Number(parsed.numberOfGuests) || Number(partyDoc.documentNumber) || 1;
      } catch {
        numberOfGuests = Number(partyDoc.documentNumber) || 1;
      }
    } else if (additionalGuests.length > 0) {
      numberOfGuests = 1 + additionalGuests.length;
    }

    // Primary ID Proof
    const primaryDoc = standardDocs[0];
    const idProofType = primaryDoc?.documentType || null;
    const idProofNumber = primaryDoc?.documentNumber || null;
    const idProofDocument = primaryDoc?.documentFileReference || null;

    return {
      ...guest,
      documents: standardDocs,
      allDocuments: docs,
      idProofType,
      idProofNumber,
      idProofDocument,
      numberOfGuests,
      additionalGuests,
      totalStays: guest._count?.stayHistory || guest.totalStays || 0,
    };
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
        { city: { contains: term, mode: 'insensitive' } },
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
      items: items.map((g) => this.enrichGuest(g)),
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

    return this.enrichGuest(guest);
  }

  async create(dto: CreateGuestDto) {
    const guestCode = await this.generateGuestCode();

    const guest = await this.prisma.guest.create({
      data: {
        guestCode,
        fullName: dto.fullName.trim(),
        mobileNumber: dto.mobileNumber.trim(),
        alternateMobileNumber: dto.alternateMobileNumber?.trim() || null,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        postalCode: dto.postalCode?.trim() || null,
        country: dto.country?.trim() || 'India',
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender || null,
      },
    });

    // 5, 6, 7. Save Primary ID Proof if provided
    if (dto.idProofType && dto.idProofNumber) {
      await this.prisma.guestDocument.create({
        data: {
          guestId: guest.id,
          documentType: dto.idProofType.toUpperCase().trim(),
          documentNumber: dto.idProofNumber.trim(),
          documentFileReference:
            dto.idProofDocument?.trim() ||
            `docs/guests/${guest.guestCode}_${dto.idProofType.toLowerCase()}.pdf`,
        },
      });
    }

    // 8. Number of Guests (Party Size)
    const partySize = dto.numberOfGuests && Number(dto.numberOfGuests) > 1
      ? Number(dto.numberOfGuests)
      : (dto.additionalGuests && dto.additionalGuests.length > 0 ? 1 + dto.additionalGuests.length : 1);

    if (partySize > 1) {
      await this.prisma.guestDocument.create({
        data: {
          guestId: guest.id,
          documentType: 'PARTY_INFO',
          documentNumber: String(partySize),
          documentFileReference: JSON.stringify({ numberOfGuests: partySize }),
        },
      });
    }

    // 9. Additional Guest Information (Co-guests / Companions)
    if (dto.additionalGuests && Array.isArray(dto.additionalGuests) && dto.additionalGuests.length > 0) {
      for (const comp of dto.additionalGuests) {
        if (!comp.fullName?.trim()) continue;
        await this.prisma.guestDocument.create({
          data: {
            guestId: guest.id,
            documentType: 'CO_GUEST',
            documentNumber: comp.fullName.trim(),
            documentFileReference: JSON.stringify({
              fullName: comp.fullName.trim(),
              age: comp.age ? Number(comp.age) : null,
              gender: comp.gender || 'OTHER',
              relationship: comp.relationship || 'Companion',
              idProofType: comp.idProofType || 'AADHAAR',
              idProofNumber: comp.idProofNumber?.trim() || '',
              documentFileReference: comp.documentFileReference?.trim() || '',
            }),
          },
        });
      }
    }

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'GUEST',
        entityId: guest.id,
        action: 'CREATE',
        newValues: {
          ...guest,
          idProofType: dto.idProofType,
          idProofNumber: dto.idProofNumber,
          numberOfGuests: partySize,
          additionalGuestsCount: dto.additionalGuests?.length || 0,
        } as any,
        description: `Created new guest ${guest.fullName} (${guest.guestCode}) with ${partySize} total guests`,
      },
    });

    return this.findOne(guest.id);
  }

  async update(id: string, dto: UpdateGuestDto) {
    const existing = await this.prisma.guest.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!existing) {
      throw new NotFoundException(`Guest with ID ${id} not found`);
    }

    const updated = await this.prisma.guest.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber.trim() }),
        ...(dto.alternateMobileNumber !== undefined && {
          alternateMobileNumber: dto.alternateMobileNumber?.trim() || null,
        }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
        ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode?.trim() || null }),
        ...(dto.country !== undefined && { country: dto.country?.trim() || 'India' }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
      },
    });

    // 5, 6, 7. Handle Primary ID Document update
    if (dto.idProofType || dto.idProofNumber || dto.idProofDocument) {
      const existingIdDoc = existing.documents.find(
        (d) => d.documentType !== 'CO_GUEST' && d.documentType !== 'PARTY_INFO'
      );
      if (existingIdDoc) {
        await this.prisma.guestDocument.update({
          where: { id: existingIdDoc.id },
          data: {
            ...(dto.idProofType && { documentType: dto.idProofType.toUpperCase().trim() }),
            ...(dto.idProofNumber && { documentNumber: dto.idProofNumber.trim() }),
            ...(dto.idProofDocument && { documentFileReference: dto.idProofDocument.trim() }),
          },
        });
      } else if (dto.idProofType && dto.idProofNumber) {
        await this.prisma.guestDocument.create({
          data: {
            guestId: id,
            documentType: dto.idProofType.toUpperCase().trim(),
            documentNumber: dto.idProofNumber.trim(),
            documentFileReference:
              dto.idProofDocument?.trim() ||
              `docs/guests/${existing.guestCode}_${dto.idProofType.toLowerCase()}.pdf`,
          },
        });
      }
    }

    // 8. Handle Number of Guests update
    if (dto.numberOfGuests !== undefined) {
      const partySize = Number(dto.numberOfGuests);
      await this.prisma.guestDocument.deleteMany({
        where: { guestId: id, documentType: 'PARTY_INFO' },
      });
      if (partySize > 1) {
        await this.prisma.guestDocument.create({
          data: {
            guestId: id,
            documentType: 'PARTY_INFO',
            documentNumber: String(partySize),
            documentFileReference: JSON.stringify({ numberOfGuests: partySize }),
          },
        });
      }
    }

    // 9. Handle Additional Guests update if provided
    if (dto.additionalGuests !== undefined && Array.isArray(dto.additionalGuests)) {
      await this.prisma.guestDocument.deleteMany({
        where: { guestId: id, documentType: 'CO_GUEST' },
      });
      for (const comp of dto.additionalGuests) {
        if (!comp.fullName?.trim()) continue;
        await this.prisma.guestDocument.create({
          data: {
            guestId: id,
            documentType: 'CO_GUEST',
            documentNumber: comp.fullName.trim(),
            documentFileReference: JSON.stringify({
              fullName: comp.fullName.trim(),
              age: comp.age ? Number(comp.age) : null,
              gender: comp.gender || 'OTHER',
              relationship: comp.relationship || 'Companion',
              idProofType: comp.idProofType || 'AADHAAR',
              idProofNumber: comp.idProofNumber?.trim() || '',
              documentFileReference: comp.documentFileReference?.trim() || '',
            }),
          },
        });
      }
    }

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

    return this.findOne(id);
  }

  async addDocument(guestId: string, dto: CreateGuestDocumentDto) {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    const doc = await this.prisma.guestDocument.create({
      data: {
        guestId,
        documentType: dto.documentType.toUpperCase().trim(),
        documentNumber: dto.documentNumber.trim(),
        documentFileReference: dto.documentFileReference.trim(),
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

  async addCoGuest(guestId: string, comp: AdditionalGuestDto) {
    const guest = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    const doc = await this.prisma.guestDocument.create({
      data: {
        guestId,
        documentType: 'CO_GUEST',
        documentNumber: comp.fullName.trim(),
        documentFileReference: JSON.stringify({
          fullName: comp.fullName.trim(),
          age: comp.age ? Number(comp.age) : null,
          gender: comp.gender || 'OTHER',
          relationship: comp.relationship || 'Companion',
          idProofType: comp.idProofType || 'AADHAAR',
          idProofNumber: comp.idProofNumber?.trim() || '',
          documentFileReference: comp.documentFileReference?.trim() || '',
        }),
      },
    });

    return this.findOne(guestId);
  }

  async deleteCoGuest(guestId: string, coGuestDocId: string) {
    const doc = await this.prisma.guestDocument.findFirst({
      where: { id: coGuestDocId, guestId, documentType: 'CO_GUEST' },
    });
    if (!doc) {
      throw new NotFoundException(`Co-guest with ID ${coGuestDocId} not found for this guest`);
    }

    await this.prisma.guestDocument.delete({ where: { id: coGuestDocId } });
    return this.findOne(guestId);
  }
}
