import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generatePaymentReference(): Promise<string> {
    const today = new Date();
    const prefix = `PAY-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.payment.count({
      where: { paymentReference: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  async findAll(query: QueryPaymentDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.paymentStatus = query.status;
    }
    if (query.method) {
      where.paymentMethod = query.method;
    }
    if (query.bookingId) {
      where.bookingId = query.bookingId;
    }
    if (query.invoiceId) {
      where.invoiceId = query.invoiceId;
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          booking: {
            include: {
              primaryGuest: true,
              room: true,
            },
          },
          invoice: true,
        },
      }),
      this.prisma.payment.count({ where }),
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
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: true,
          },
        },
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByBooking(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async recordPayment(dto: RecordPaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { primaryGuest: true, room: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    const paymentAmount = Math.round(Number(dto.amount) * 100) / 100;
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    let invoice: any = null;
    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
      }
      if (invoice.invoiceStatus === 'CANCELLED') {
        throw new BadRequestException('Cannot record payment for a cancelled invoice.');
      }
    } else {
      // If invoiceId not specified, look for active finalized invoice for this booking
      invoice = await this.prisma.invoice.findFirst({
        where: {
          bookingId: dto.bookingId,
          invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
        },
      });
    }

    if (invoice) {
      const currentBalance = Number(invoice.balanceAmount);
      if (paymentAmount > currentBalance) {
        throw new BadRequestException(
          `Payment amount (₹${paymentAmount}) exceeds invoice balance (₹${currentBalance}).`,
        );
      }
    }

    const paymentReference = await this.generatePaymentReference();
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const created = await tx.payment.create({
        data: {
          paymentReference,
          bookingId: dto.bookingId,
          invoiceId: invoice?.id || null,
          paymentType: dto.paymentType,
          paymentMethod: dto.paymentMethod,
          amount: paymentAmount,
          transactionReference: dto.transactionReference,
          paymentDate,
          paymentStatus: 'COMPLETED',
          notes: dto.notes,
        },
      });

      // 2. If linked to an invoice, recalculate totalPaid and balanceAmount
      if (invoice) {
        const newTotalPaid = Math.round((Number(invoice.totalPaid) + paymentAmount) * 100) / 100;
        const newBalance = Math.round((Number(invoice.totalAmount) - newTotalPaid) * 100) / 100;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            totalPaid: newTotalPaid,
            balanceAmount: newBalance,
            invoiceStatus: newStatus,
          },
        });
      }

      // 3. If Advance, also update booking advanceAmount
      if (dto.paymentType === 'ADVANCE') {
        const newAdvance = Math.round((Number(booking.advanceAmount) + paymentAmount) * 100) / 100;
        await tx.booking.update({
          where: { id: booking.id },
          data: { advanceAmount: newAdvance },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'PAYMENT',
          entityId: created.id,
          action: 'CREATE',
          newValues: created as any,
          description: `Recorded ${dto.paymentType} payment of ₹${paymentAmount} via ${dto.paymentMethod} (${paymentReference})`,
        },
      });

      return created;
    });

    return payment;
  }
}
