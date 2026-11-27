import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RelocateRoomDto } from './dto/relocate-room.dto';
import { PerformCheckInDto } from './dto/check-in.dto';
import { PerformCheckOutDto } from './dto/check-out.dto';

@Injectable()
export class CheckInCheckOutService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(tx?: any): Promise<string> {
    const client = tx || this.prisma;
    const today = new Date();
    const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const existingInvoices = await client.invoice.findMany({
      where: { invoiceNumber: { startsWith: prefix } },
      select: { invoiceNumber: true },
    });

    const usedNumbers = new Set(existingInvoices.map((inv: any) => inv.invoiceNumber));

    let maxSeq = 0;
    for (const inv of existingInvoices) {
      const parts = inv.invoiceNumber.split('-');
      const seqStr = parts[parts.length - 1];
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    let candidateSeq = maxSeq + 1;
    let candidate = `${prefix}-${String(candidateSeq).padStart(4, '0')}`;
    while (usedNumbers.has(candidate)) {
      candidateSeq++;
      candidate = `${prefix}-${String(candidateSeq).padStart(4, '0')}`;
    }

    return candidate;
  }

  async getTodayCheckIns() {
    return this.prisma.booking.findMany({
      where: {
        bookingStatus: 'RESERVED',
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        payments: true,
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
        bookingItems: { include: { item: true } },
        payments: true,
      },
      orderBy: { expectedCheckOutDate: 'asc' },
    });
  }

  async getActiveStays() {
    return this.prisma.booking.findMany({
      where: { bookingStatus: 'CHECKED_IN' },
      include: {
        primaryGuest: {
          include: {
            documents: true,
          },
        },
        bookingGuests: {
          include: {
            guest: {
              include: {
                documents: true,
              },
            },
          },
        },
        room: { include: { roomType: true } },
        bookingItems: { include: { item: true } },
        invoices: { include: { payments: true } },
        payments: true,
      },
      orderBy: { actualCheckInAt: 'desc' },
    });
  }

  async getCompletedStays(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      bookingStatus: 'CHECKED_OUT',
    };

    if (query?.search) {
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
        include: {
          primaryGuest: true,
          room: { include: { roomType: true } },
          bookingItems: { include: { item: true } },
          invoices: {
            include: { payments: true },
          },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { actualCheckOutAt: 'desc' },
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

  async getCheckoutSummary(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingItems: { include: { item: true } },
        payments: { where: { paymentStatus: 'COMPLETED' }, orderBy: { paymentDate: 'desc' } },
        invoices: { include: { payments: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    const now = new Date();
    const actualCheckOutDate = now.toISOString().split('T')[0];
    const actualCheckOutTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // 1. Total nights calculation
    const numberOfNights = booking.numberOfNights || 1;

    // 2. Room charges
    const roomRatePerNight = Number(booking.roomRatePerNight);
    const roomCharges = Math.round(roomRatePerNight * numberOfNights * 100) / 100;

    // 3. Additional item charges (Room service / POS / mini-bar)
    const additionalItemCharges =
      Math.round(
        booking.bookingItems.reduce((acc, it) => acc + Number(it.totalAmount), 0) * 100
      ) / 100;

    // 4. Service charges (Default 0.00 unless configured)
    const serviceCharges = 0.0;

    // 5. Subtotal
    const subtotal = Math.round((roomCharges + additionalItemCharges + serviceCharges) * 100) / 100;

    // 6. Tax calculation (12% standard GST or from hotel setting)
    const settings = await this.prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    const taxPercentage = settings?.defaultTaxPercentage
      ? Number(settings.defaultTaxPercentage)
      : 12.0;
    const taxAmount = Math.round(subtotal * (taxPercentage / 100) * 100) / 100;

    // 7. Total Bill Amount
    const totalBillAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // 8. Advance Payment
    const advancePayments = booking.payments.filter((p) => p.paymentType === 'ADVANCE');
    const advancePayment =
      advancePayments.length > 0
        ? Math.round(advancePayments.reduce((acc, p) => acc + Number(p.amount), 0) * 100) / 100
        : Number(booking.advanceAmount) || 0;

    // 9. Additional Payments (Partial / interim)
    const otherPayments = booking.payments.filter(
      (p) => p.paymentType === 'PARTIAL' || p.paymentType === 'FINAL'
    );
    const additionalPayments =
      Math.round(otherPayments.reduce((acc, p) => acc + Number(p.amount), 0) * 100) / 100;

    const totalPaid = Math.round((advancePayment + additionalPayments) * 100) / 100;

    // 10. Remaining Payment
    const remainingPayment = Math.max(0, Math.round((totalBillAmount - totalPaid) * 100) / 100);

    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      // Check-in information
      guestDetails: {
        id: booking.primaryGuest.id,
        fullName: booking.primaryGuest.fullName,
        mobileNumber: booking.primaryGuest.mobileNumber,
        email: booking.primaryGuest.email,
        address: booking.primaryGuest.address,
        city: booking.primaryGuest.city,
      },
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType.name,
      checkInDate: booking.checkInDate,
      checkInTime: booking.checkInTime || '12:00 PM',
      expectedCheckOutDate: booking.expectedCheckOutDate,
      expectedCheckOutTime: booking.expectedCheckOutTime || '11:00 AM',
      numberOfNights,
      roomPricePerNight: roomRatePerNight,
      advancePayment,

      // Check-out information
      actualCheckOutDate,
      actualCheckOutTime,
      totalNumberOfNights: numberOfNights,
      roomCharges,
      additionalItemCharges,
      additionalItems: booking.bookingItems,
      serviceCharges,
      discount: 0.0,
      taxPercentage,
      taxAmount,
      totalBillAmount,
      additionalPayments,
      totalPaid,
      remainingPayment,
      existingInvoice: booking.invoices[0] || null,
    };
  }

  async performCheckIn(id: string, dto?: PerformCheckInDto) {
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
      throw new BadRequestException(
        `Cannot check in: Room ${booking.room.roomNumber} is under maintenance.`,
      );
    }

    const now = new Date();
    const checkInTime =
      dto?.checkInTime?.trim() ||
      booking.checkInTime ||
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return this.prisma.$transaction(async (tx) => {
      // If advance payment provided at check-in
      if (dto?.advanceAmount && Number(dto.advanceAmount) > 0) {
        const payRef = `PAY-ADV-${Date.now().toString().slice(-6)}`;
        await tx.payment.create({
          data: {
            paymentReference: payRef,
            bookingId: id,
            paymentType: 'ADVANCE',
            paymentMethod: (dto.advancePaymentMethod as any) || 'CASH',
            amount: Number(dto.advanceAmount),
            paymentDate: new Date(),
            paymentStatus: 'COMPLETED',
            notes: `Advance payment recorded at check-in for ${booking.bookingNumber}`,
          },
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: {
          bookingStatus: 'CHECKED_IN',
          actualCheckInAt: now,
          checkInTime,
          ...(dto?.advanceAmount && {
            advanceAmount: Number(booking.advanceAmount) + Number(dto.advanceAmount),
          }),
        },
        include: {
          room: { include: { roomType: true } },
          primaryGuest: true,
          payments: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'BOOKING',
          entityId: id,
          action: 'UPDATE',
          previousValues: {
            bookingStatus: booking.bookingStatus,
            actualCheckInAt: booking.actualCheckInAt,
          },
          newValues: { bookingStatus: 'CHECKED_IN', actualCheckInAt: now, checkInTime },
          description: `Checked in guest ${booking.primaryGuest.fullName} into room ${booking.room.roomNumber} at ${checkInTime}`,
        },
      });

      return updated;
    });
  }

  async performCheckOut(id: string, dto?: PerformCheckOutDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        primaryGuest: true,
        bookingItems: true,
        payments: { where: { paymentStatus: 'COMPLETED' } },
        invoices: true,
      },
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

    // 1. Calculate Charges
    const numberOfNights = booking.numberOfNights || 1;
    const roomCharges = Math.round(Number(booking.roomRatePerNight) * numberOfNights * 100) / 100;
    const additionalCharges =
      Math.round(
        booking.bookingItems.reduce((acc, item) => acc + Number(item.totalAmount), 0) * 100
      ) / 100;
    const serviceCharges = dto?.serviceCharges ? Number(dto.serviceCharges) : 0.0;
    const subtotal = Math.round((roomCharges + additionalCharges + serviceCharges) * 100) / 100;

    // 2. Discount
    let discountAmount = 0.0;
    const discountVal = dto?.discountValue ? Number(dto.discountValue) : 0.0;
    if (dto?.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * (Math.min(100, discountVal) / 100) * 100) / 100;
    } else if (dto?.discountType === 'FIXED') {
      discountAmount = Math.min(discountVal, subtotal);
    }

    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    // 3. Tax
    const settings = await this.prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    const defaultTax = settings?.defaultTaxPercentage ? Number(settings.defaultTaxPercentage) : 12.0;
    const taxPercentage = dto?.taxPercentage !== undefined ? Number(dto.taxPercentage) : defaultTax;
    const taxAmount = Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;

    // 4. Total Bill Amount
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // 5. Payments
    const existingPaid = booking.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const finalPaymentAmount = dto?.paidAmount !== undefined ? Number(dto.paidAmount) : Math.max(0, totalAmount - existingPaid);
    const totalPaid = Math.min(totalAmount, Math.round((existingPaid + finalPaymentAmount) * 100) / 100);
    const balanceAmount = Math.round((totalAmount - totalPaid) * 100) / 100;

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(tx);

      // 1. Record Final / Remaining Payment if settlement amount provided
      let finalPayment: any = null;
      if (finalPaymentAmount > 0) {
        finalPayment = await tx.payment.create({
          data: {
            paymentReference: `PAY-CHK-${Date.now().toString().slice(-6)}`,
            bookingId: id,
            paymentType: 'FINAL',
            paymentMethod: (dto?.paymentMethod as any) || 'CASH',
            amount: finalPaymentAmount,
            paymentDate: now,
            paymentStatus: 'COMPLETED',
            notes: dto?.notes || `Check-out balance settlement for ${booking.bookingNumber}`,
          },
        });
      }

      // 2. Create Digital Invoice
      const invoiceStatus = balanceAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'FINALIZED';
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          bookingId: id,
          invoiceStatus,
          roomCharges,
          additionalCharges,
          subtotal,
          discountType: dto?.discountType || null,
          discountValue: discountVal,
          discountAmount,
          taxPercentage,
          taxAmount,
          totalAmount,
          totalPaid,
          balanceAmount,
          invoiceDate: now,
          finalizedAt: now,
        },
      });

      // Link payments to invoice
      await tx.payment.updateMany({
        where: { bookingId: id, invoiceId: null },
        data: { invoiceId: invoice.id },
      });

      // 3. Mark Booking as CHECKED_OUT and release room
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          bookingStatus: 'CHECKED_OUT',
          actualCheckOutAt: now,
        },
        include: {
          room: { include: { roomType: true } },
          primaryGuest: true,
          bookingItems: { include: { item: true } },
          payments: true,
          invoices: true,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          entityType: 'BOOKING',
          entityId: id,
          action: 'UPDATE',
          previousValues: { bookingStatus: booking.bookingStatus },
          newValues: {
            bookingStatus: 'CHECKED_OUT',
            actualCheckOutAt: now,
            invoiceNumber: invoice.invoiceNumber,
            totalBillAmount: totalAmount,
          },
          description: `Checked out guest ${booking.primaryGuest.fullName} from Room ${booking.room.roomNumber}. Digital Invoice: ${invoice.invoiceNumber}`,
        },
      });

      return {
        booking: updatedBooking,
        invoice,
        checkoutFolio: {
          actualCheckOutDate: now.toISOString().split('T')[0],
          actualCheckOutTime: dto?.actualCheckOutTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          totalNumberOfNights: numberOfNights,
          roomCharges,
          additionalItemCharges: additionalCharges,
          serviceCharges,
          discount: discountAmount,
          tax: taxAmount,
          totalBillAmount: totalAmount,
          advancePayment: existingPaid,
          additionalPayments: finalPaymentAmount,
          remainingPayment: balanceAmount,
        },
      };
    });
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
          roomRatePerNight: newRoom.pricePerNight,
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
      if (
        err.message &&
        (err.message.includes('no_overlapping_active_bookings') || err.message.includes('23P01'))
      ) {
        throw new ConflictException(
          `Target room ${newRoom.roomNumber} already has an overlapping active booking during this stay period.`,
        );
      }
      throw err;
    }
  }
}
