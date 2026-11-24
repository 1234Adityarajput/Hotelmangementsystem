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
    if (query.type) {
      where.paymentType = query.type;
    }
    if (query.bookingId) {
      where.bookingId = query.bookingId;
    }
    if (query.invoiceId) {
      where.invoiceId = query.invoiceId;
    }

    if (query.startDate || query.endDate) {
      where.paymentDate = {};
      if (query.startDate) {
        where.paymentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.paymentDate.lte = new Date(query.endDate);
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { paymentReference: { contains: term, mode: 'insensitive' } },
        { transactionReference: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { booking: { bookingNumber: { contains: term, mode: 'insensitive' } } },
        { booking: { primaryGuest: { fullName: { contains: term, mode: 'insensitive' } } } },
        { booking: { primaryGuest: { mobileNumber: { contains: term } } } },
        { booking: { room: { roomNumber: { contains: term, mode: 'insensitive' } } } },
        { invoice: { invoiceNumber: { contains: term, mode: 'insensitive' } } },
      ];
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

  async getStats() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayStart = new Date(todayStr);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allPayments = await this.prisma.payment.findMany({
      where: { paymentStatus: 'COMPLETED' },
      select: {
        amount: true,
        paymentType: true,
        paymentMethod: true,
        paymentDate: true,
      },
    });

    let totalCollected = 0;
    let todayCollected = 0;
    let todayCount = 0;
    let monthCollected = 0;
    let monthCount = 0;

    let advanceCollected = 0;
    let advanceCount = 0;
    let partialCollected = 0;
    let partialCount = 0;
    let finalCollected = 0;
    let finalCount = 0;

    let cashCollected = 0;
    let cashCount = 0;
    let upiCollected = 0;
    let upiCount = 0;
    let bankCollected = 0;
    let bankCount = 0;
    let otherCollected = 0;
    let otherCount = 0;

    for (const p of allPayments) {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;

      const pDate = new Date(p.paymentDate);
      if (pDate >= todayStart) {
        todayCollected += amt;
        todayCount++;
      }
      if (pDate >= firstDayOfMonth) {
        monthCollected += amt;
        monthCount++;
      }

      if (p.paymentType === 'ADVANCE') {
        advanceCollected += amt;
        advanceCount++;
      } else if (p.paymentType === 'PARTIAL') {
        partialCollected += amt;
        partialCount++;
      } else if (p.paymentType === 'FINAL') {
        finalCollected += amt;
        finalCount++;
      }

      if (p.paymentMethod === 'CASH') {
        cashCollected += amt;
        cashCount++;
      } else if (p.paymentMethod === 'UPI') {
        upiCollected += amt;
        upiCount++;
      } else if (p.paymentMethod === 'BANK_TRANSFER') {
        bankCollected += amt;
        bankCount++;
      } else {
        otherCollected += amt;
        otherCount++;
      }
    }

    // Pending collections: unpaid/partially paid invoices & active stays
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
        balanceAmount: { gt: 0 },
      },
      select: { balanceAmount: true },
    });

    const pendingInvoiceBalance = unpaidInvoices.reduce((s, i) => s + Number(i.balanceAmount), 0);
    const pendingInvoiceCount = unpaidInvoices.length;

    return {
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalCount: allPayments.length,
      todayCollected: Math.round(todayCollected * 100) / 100,
      todayCount,
      monthCollected: Math.round(monthCollected * 100) / 100,
      monthCount,
      // By Type
      advanceCollected: Math.round(advanceCollected * 100) / 100,
      advanceCount,
      partialCollected: Math.round(partialCollected * 100) / 100,
      partialCount,
      finalCollected: Math.round(finalCollected * 100) / 100,
      finalCount,
      // By Method / Channel
      cashCollected: Math.round(cashCollected * 100) / 100,
      cashCount,
      upiCollected: Math.round(upiCollected * 100) / 100,
      upiCount,
      bankCollected: Math.round(bankCollected * 100) / 100,
      bankCount,
      otherCollected: Math.round(otherCollected * 100) / 100,
      otherCount,
      // Pending
      pendingBalanceTotal: Math.round(pendingInvoiceBalance * 100) / 100,
      pendingBalanceCount: pendingInvoiceCount,
    };
  }

  async getPendingPayments() {
    // 1. Invoices with outstanding balances
    const invoices = await this.prisma.invoice.findMany({
      where: {
        invoiceStatus: { in: ['FINALIZED', 'PARTIALLY_PAID'] },
        balanceAmount: { gt: 0 },
      },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Active in-house stays with unbilled or live balance
    const activeStays = await this.prisma.booking.findMany({
      where: { bookingStatus: 'CHECKED_IN' },
      include: {
        primaryGuest: true,
        room: true,
        bookingItems: true,
        payments: { where: { paymentStatus: 'COMPLETED' } },
        invoices: { where: { invoiceStatus: { not: 'CANCELLED' } } },
      },
      orderBy: { checkInDate: 'asc' },
    });

    const pendingItems: any[] = [];

    // Add Invoices with balance
    for (const inv of invoices) {
      pendingItems.push({
        id: inv.id,
        recordType: 'INVOICE',
        referenceNumber: inv.invoiceNumber,
        bookingId: inv.bookingId,
        invoiceId: inv.id,
        guestName: inv.booking?.primaryGuest?.fullName || 'Guest',
        mobileNumber: inv.booking?.primaryGuest?.mobileNumber || '',
        roomNumber: inv.booking?.room?.roomNumber || '—',
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.totalPaid),
        balanceDue: Number(inv.balanceAmount),
        status: inv.invoiceStatus,
        createdAt: inv.createdAt,
      });
    }

    // Add Active in-house Stays that haven't finalized invoices yet
    for (const stay of activeStays) {
      const alreadyHasPendingInvoice = pendingItems.some((item) => item.bookingId === stay.id);
      if (!alreadyHasPendingInvoice) {
        const roomTotal = Number(stay.roomRatePerNight) * stay.numberOfNights;
        const itemsTotal = stay.bookingItems.reduce((s, bi) => s + Number(bi.totalAmount), 0);
        const subtotal = roomTotal + itemsTotal;
        const tax = Math.round(subtotal * 0.12 * 100) / 100;
        const totalEst = Math.round((subtotal + tax) * 100) / 100;
        const totalPaid = stay.payments.reduce((s, p) => s + Number(p.amount), 0);
        const balanceDue = Math.max(0, Math.round((totalEst - totalPaid) * 100) / 100);

        if (balanceDue > 0) {
          pendingItems.push({
            id: stay.id,
            recordType: 'STAY_FOLIO',
            referenceNumber: stay.bookingNumber,
            bookingId: stay.id,
            invoiceId: null,
            guestName: stay.primaryGuest?.fullName || 'Guest',
            mobileNumber: stay.primaryGuest?.mobileNumber || '',
            roomNumber: stay.room?.roomNumber || '—',
            totalAmount: totalEst,
            paidAmount: totalPaid,
            balanceDue,
            status: 'CHECKED_IN',
            createdAt: stay.createdAt,
          });
        }
      }
    }

    const totalOutstanding =
      Math.round(pendingItems.reduce((acc, item) => acc + item.balanceDue, 0) * 100) / 100;

    return {
      items: pendingItems,
      totalCount: pendingItems.length,
      totalOutstanding,
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
      const currentBalance = Math.round(Number(invoice.balanceAmount) * 100) / 100;
      if (paymentAmount > currentBalance + 0.05) {
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
        const newBalance = Math.max(0, Math.round((Number(invoice.totalAmount) - newTotalPaid) * 100) / 100);
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
