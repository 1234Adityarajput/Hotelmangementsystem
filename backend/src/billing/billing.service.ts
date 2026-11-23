import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: QueryInvoiceDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.invoiceStatus = query.status;
    }
    if (query.bookingId) {
      where.bookingId = query.bookingId;
    }
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: term, mode: 'insensitive' } },
        { booking: { primaryGuest: { fullName: { contains: term, mode: 'insensitive' } } } },
        { booking: { primaryGuest: { mobileNumber: { contains: term } } } },
        { booking: { room: { roomNumber: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              primaryGuest: true,
              room: { include: { roomType: true } },
            },
          },
          payments: true,
        },
      }),
      this.prisma.invoice.count({ where }),
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
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: { include: { roomType: true } },
            bookingItems: { include: { item: true } },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByBooking(bookingId: string) {
    return this.prisma.invoice.findMany({
      where: { bookingId },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInvoice(dto: GenerateInvoiceDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        primaryGuest: true,
        room: true,
        bookingItems: true,
        payments: { where: { paymentStatus: 'COMPLETED' } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    // Check if an active finalized invoice already exists
    const existingActiveInvoice = await this.prisma.invoice.findFirst({
      where: {
        bookingId: dto.bookingId,
        invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID', 'PAID'] },
      },
    });

    if (existingActiveInvoice) {
      throw new ConflictException(
        `Active invoice ${existingActiveInvoice.invoiceNumber} already exists for this booking.`,
      );
    }

    // Default Hotel Setting for Tax
    const settings = await this.prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    const defaultTax = settings?.defaultTaxPercentage ? Number(settings.defaultTaxPercentage) : 12.0;

    // 1. Calculations
    const roomCharges = Math.round(Number(booking.roomRatePerNight) * booking.numberOfNights * 100) / 100;

    const additionalCharges = booking.bookingItems.reduce(
      (sum, item) => sum + Number(item.totalAmount),
      0,
    );
    const roundedAdditional = Math.round(additionalCharges * 100) / 100;

    const subtotal = Math.round((roomCharges + roundedAdditional) * 100) / 100;

    // Discount
    let discountAmount = 0.0;
    const discountVal = dto.discountValue ? Number(dto.discountValue) : 0.0;
    if (dto.discountType === 'PERCENTAGE') {
      if (discountVal > 100) {
        throw new BadRequestException('Discount percentage cannot exceed 100%');
      }
      discountAmount = Math.round(subtotal * (discountVal / 100) * 100) / 100;
    } else if (dto.discountType === 'FIXED') {
      discountAmount = Math.min(discountVal, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    const taxPercentage = dto.taxPercentage !== undefined ? Number(dto.taxPercentage) : defaultTax;
    const taxAmount = Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;

    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Sum existing completed payments for this booking
    const totalAdvancePaid = booking.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalPaid = Math.min(totalAmount, Math.round(totalAdvancePaid * 100) / 100);

    // EXACT mathematical constraint: balance_amount = total_amount - total_paid
    const balanceAmount = Math.round((totalAmount - totalPaid) * 100) / 100;

    let invoiceStatus: 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' = 'FINALIZED';
    if (balanceAmount <= 0) {
      invoiceStatus = 'PAID';
    } else if (totalPaid > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          bookingId: dto.bookingId,
          invoiceStatus,
          roomCharges,
          additionalCharges: roundedAdditional,
          subtotal,
          discountType: dto.discountType || null,
          discountValue: discountVal,
          discountAmount,
          taxPercentage,
          taxAmount,
          totalAmount,
          totalPaid,
          balanceAmount,
          invoiceDate,
          finalizedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              primaryGuest: true,
              room: true,
            },
          },
        },
      });

      // Link existing unlinked payments for this booking to this invoice
      await tx.payment.updateMany({
        where: {
          bookingId: dto.bookingId,
          invoiceId: null,
        },
        data: {
          invoiceId: created.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'INVOICE',
          entityId: created.id,
          action: 'FINALIZE',
          newValues: created as any,
          description: `Generated invoice ${created.invoiceNumber} for booking ${booking.bookingNumber} (Total: ₹${totalAmount}, Balance: ₹${balanceAmount})`,
        },
      });

      return created;
    });

    return invoice;
  }

  async cancelInvoice(id: string, reason?: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (existing.invoiceStatus === 'PAID') {
      throw new BadRequestException('Cannot cancel fully paid invoice.');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        invoiceStatus: 'CANCELLED',
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'INVOICE',
        entityId: id,
        action: 'CANCEL',
        previousValues: existing as any,
        newValues: updated as any,
        description: `Cancelled invoice ${existing.invoiceNumber}: ${reason || 'No reason specified'}`,
      },
    });

    return updated;
  }
}
