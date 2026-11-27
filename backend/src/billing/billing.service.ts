import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { QuickPostChargeDto } from './dto/quick-post-charge.dto';

export interface BillingComponentBreakdown {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  guestMobile: string;
  guestAddress: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  expectedCheckOutDate: string;
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  numberOfNights: number;
  roomRatePerNight: number;

  // Billing Components
  roomCharges: number;
  foodAndBeverageCharges: number;
  laundryCharges: number;
  roomServiceCharges: number;
  extraBedCharges: number;
  otherServicesCharges: number;
  additionalItemCharges: number;
  totalAdditionalCharges: number;
  subtotal: number;

  discountType: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxPercentage: number;
  taxAmount: number;

  // Final Bill = Room Charges + Additional Charges + Taxes - Discount
  finalBill: number;

  // Payments Breakdown
  payments: {
    advancePayments: number;
    partialPayments: number;
    finalPayments: number;
    totalPaymentsReceived: number;
    paymentList: Array<{
      id: string;
      reference: string;
      type: string;
      method: string;
      amount: number;
      date: string;
      status: string;
    }>;
  };

  // Remaining Balance = Final Bill - Total Payments Received
  remainingBalance: number;
  isFullySettled: boolean;

  itemizedCharges: Array<{
    id: string;
    name: string;
    category: string;
    billingComponent: string;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
    date: string;
    time?: string | null;
    notes?: string | null;
  }>;

  existingInvoice?: any;

  calculationFormulas: {
    roomCharges: string;
    additionalCharges: string;
    finalBill: string;
    remainingBalance: string;
  };
}

@Injectable()
export class BillingService {
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

  // Helper: Classify any item/service into exact billing component
  classifyItemComponent(itemName: string, categoryName?: string): string {
    const text = `${itemName} ${categoryName || ''}`.toLowerCase();

    // 1. Extra Bed Charges
    if (
      text.includes('extra bed') ||
      text.includes('rollaway') ||
      text.includes('mattress') ||
      text.includes('crib') ||
      text.includes('linen') ||
      text.includes('extra cot')
    ) {
      return 'Extra Bed Charges';
    }

    // 2. Room Service Charges
    if (
      text.includes('room service') ||
      text.includes('in-room dining') ||
      text.includes('ir dining') ||
      text.includes('delivery charge')
    ) {
      return 'Room Service Charges';
    }

    // 3. Laundry Charges
    if (
      text.includes('laundry') ||
      text.includes('dry clean') ||
      text.includes('ironing') ||
      text.includes('pressing') ||
      text.includes('wash & fold') ||
      text.includes('laundry service')
    ) {
      return 'Laundry Charges';
    }

    // 4. Food and Beverage Charges
    if (
      text.includes('food') ||
      text.includes('beverage') ||
      text.includes('dining') ||
      text.includes('breakfast') ||
      text.includes('lunch') ||
      text.includes('dinner') ||
      text.includes('tea') ||
      text.includes('coffee') ||
      text.includes('snack') ||
      text.includes('minibar') ||
      text.includes('juice') ||
      text.includes('water bottle') ||
      text.includes('restaurant') ||
      text.includes('dessert')
    ) {
      return 'Food and Beverage Charges';
    }

    // 5. Other Hotel Services
    if (
      text.includes('service') ||
      text.includes('transport') ||
      text.includes('airport') ||
      text.includes('cab') ||
      text.includes('taxi') ||
      text.includes('car rental') ||
      text.includes('spa') ||
      text.includes('massage') ||
      text.includes('parking') ||
      text.includes('banquet') ||
      text.includes('conference') ||
      text.includes('tour')
    ) {
      return 'Other Hotel Services';
    }

    // 6. Additional Item Charges
    return 'Additional Item Charges';
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
            bookingItems: { include: { item: { include: { category: true } } } },
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

  // ============================================================================
  // LIVE AUTOMATIC BILLING & PAYMENT CALCULATION ENGINE
  // ============================================================================
  async getLiveBillingFolio(
    bookingId: string,
    customTaxPercentage?: number,
  ): Promise<BillingComponentBreakdown> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingItems: {
          include: { item: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          where: { paymentStatus: 'COMPLETED' },
          orderBy: { paymentDate: 'asc' },
        },
        invoices: {
          where: { invoiceStatus: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const settings = await this.prisma.hotelSetting.findUnique({ where: { id: 'default' } });
    const defaultTax = settings?.defaultTaxPercentage ? Number(settings.defaultTaxPercentage) : 12.0;

    // 1. Room Charges Calculation
    // Room Charges = Room Price Per Night × Number of Nights
    const ratePerNight = Number(booking.roomRatePerNight);
    const nights = booking.numberOfNights;
    const roomCharges = Math.round(ratePerNight * nights * 100) / 100;

    // 2. Additional Charges Categorized
    let foodAndBeverageCharges = 0;
    let laundryCharges = 0;
    let roomServiceCharges = 0;
    let extraBedCharges = 0;
    let otherServicesCharges = 0;
    let additionalItemCharges = 0;

    const itemizedCharges = booking.bookingItems.map((bi) => {
      const amount = Number(bi.totalAmount);
      const component = this.classifyItemComponent(bi.itemNameSnapshot, bi.item?.category?.name);

      if (component === 'Food and Beverage Charges') foodAndBeverageCharges += amount;
      else if (component === 'Laundry Charges') laundryCharges += amount;
      else if (component === 'Room Service Charges') roomServiceCharges += amount;
      else if (component === 'Extra Bed Charges') extraBedCharges += amount;
      else if (component === 'Other Hotel Services') otherServicesCharges += amount;
      else additionalItemCharges += amount;

      return {
        id: bi.id,
        name: bi.itemNameSnapshot,
        category: bi.item?.category?.name || 'General Item',
        billingComponent: component,
        unitPrice: Number(bi.unitPrice),
        quantity: bi.quantity,
        totalAmount: amount,
        date: bi.purchaseDate ? new Date(bi.purchaseDate).toISOString().split('T')[0] : '',
        time: bi.purchaseTime,
        notes: bi.notes,
      };
    });

    foodAndBeverageCharges = Math.round(foodAndBeverageCharges * 100) / 100;
    laundryCharges = Math.round(laundryCharges * 100) / 100;
    roomServiceCharges = Math.round(roomServiceCharges * 100) / 100;
    extraBedCharges = Math.round(extraBedCharges * 100) / 100;
    otherServicesCharges = Math.round(otherServicesCharges * 100) / 100;
    additionalItemCharges = Math.round(additionalItemCharges * 100) / 100;

    // Additional Charges = Sum of All Items and Services
    const totalAdditionalCharges = Math.round(
      (foodAndBeverageCharges +
        laundryCharges +
        roomServiceCharges +
        extraBedCharges +
        otherServicesCharges +
        additionalItemCharges) *
        100,
    ) / 100;

    // Subtotal
    const subtotal = Math.round((roomCharges + totalAdditionalCharges) * 100) / 100;

    // Existing active invoice if available
    const existingInvoice = booking.invoices[0] || null;

    const discountType = existingInvoice ? (existingInvoice.discountType as any) : null;
    const discountValue = existingInvoice ? Number(existingInvoice.discountValue) : 0;

    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * (discountValue / 100) * 100) / 100;
    } else if (discountType === 'FIXED') {
      discountAmount = Math.min(discountValue, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    const totalPaidSoFar = Math.round(
      booking.payments.reduce((s, p) => s + Number(p.amount), 0) * 100
    ) / 100;

    let taxPercentage = defaultTax;
    if (customTaxPercentage !== undefined) {
      taxPercentage = Number(customTaxPercentage);
    } else if (existingInvoice !== null) {
      taxPercentage = Number(existingInvoice.taxPercentage);
    } else if (
      totalPaidSoFar >= Math.max(0, subtotal - discountAmount) - 0.5 &&
      totalPaidSoFar < Math.max(0, subtotal - discountAmount) + Math.max(0, subtotal - discountAmount) * 0.05
    ) {
      // Guest settled exact subtotal amount without GST -> auto-apply 0% tax!
      taxPercentage = 0;
    }

    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const taxAmount = Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;

    // Final Bill = Room Charges + Additional Charges + Taxes − Discount
    const finalBill = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // Payments Breakdown
    let advancePayments = 0;
    let partialPayments = 0;
    let finalPayments = 0;

    const paymentList = booking.payments.map((p) => {
      const amt = Number(p.amount);
      if (p.paymentType === 'ADVANCE') advancePayments += amt;
      else if (p.paymentType === 'PARTIAL') partialPayments += amt;
      else if (p.paymentType === 'FINAL') finalPayments += amt;

      return {
        id: p.id,
        reference: p.paymentReference,
        type: p.paymentType,
        method: p.paymentMethod,
        amount: amt,
        date: new Date(p.paymentDate).toISOString().split('T')[0],
        status: p.paymentStatus,
      };
    });

    advancePayments = Math.round(advancePayments * 100) / 100;
    partialPayments = Math.round(partialPayments * 100) / 100;
    finalPayments = Math.round(finalPayments * 100) / 100;

    const totalPaymentsReceived = Math.round((advancePayments + partialPayments + finalPayments) * 100) / 100;

    // Remaining Balance = Final Bill − Total Payments Received
    const remainingBalance = Math.round((finalBill - totalPaymentsReceived) * 100) / 100;
    const isFullySettled = remainingBalance <= 0;

    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      guestName: booking.primaryGuest?.fullName || 'Guest',
      guestMobile: booking.primaryGuest?.mobileNumber || '',
      guestAddress: [booking.primaryGuest?.city, booking.primaryGuest?.state, booking.primaryGuest?.country]
        .filter(Boolean)
        .join(', '),
      roomNumber: booking.room?.roomNumber || '',
      roomType: booking.room?.roomType?.name || 'Standard',
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
      expectedCheckOutDate: new Date(booking.expectedCheckOutDate).toISOString().split('T')[0],
      actualCheckInAt: booking.actualCheckInAt ? booking.actualCheckInAt.toISOString() : null,
      actualCheckOutAt: booking.actualCheckOutAt ? booking.actualCheckOutAt.toISOString() : null,
      numberOfNights: nights,
      roomRatePerNight: ratePerNight,

      roomCharges,
      foodAndBeverageCharges,
      laundryCharges,
      roomServiceCharges,
      extraBedCharges,
      otherServicesCharges,
      additionalItemCharges,
      totalAdditionalCharges,
      subtotal,

      discountType,
      discountValue,
      discountAmount,
      taxableAmount,
      taxPercentage,
      taxAmount,

      finalBill,

      payments: {
        advancePayments,
        partialPayments,
        finalPayments,
        totalPaymentsReceived,
        paymentList,
      },

      remainingBalance,
      isFullySettled,

      itemizedCharges,
      existingInvoice,

      calculationFormulas: {
        roomCharges: `₹${ratePerNight} × ${nights} Nights = ₹${roomCharges}`,
        additionalCharges: `F&B (₹${foodAndBeverageCharges}) + Laundry (₹${laundryCharges}) + Room Service (₹${roomServiceCharges}) + Extra Bed (₹${extraBedCharges}) + Other Services (₹${otherServicesCharges}) + Additional Items (₹${additionalItemCharges}) = ₹${totalAdditionalCharges}`,
        finalBill: `Room Charges (₹${roomCharges}) + Additional Charges (₹${totalAdditionalCharges}) + Taxes (₹${taxAmount}) - Discount (₹${discountAmount}) = ₹${finalBill}`,
        remainingBalance: `Final Bill (₹${finalBill}) - Total Payments Received (₹${totalPaymentsReceived}) = ₹${remainingBalance}`,
      },
    };
  }

  // List all active stays with real-time live billing calculation
  async getActiveFolios(search?: string) {
    const where: any = {
      bookingStatus: { in: ['CHECKED_IN', 'RESERVED'] },
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { bookingNumber: { contains: term, mode: 'insensitive' } },
        { primaryGuest: { fullName: { contains: term, mode: 'insensitive' } } },
        { primaryGuest: { mobileNumber: { contains: term } } },
        { room: { roomNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { checkInDate: 'asc' },
      select: { id: true },
    });

    const folios = await Promise.all(bookings.map((b) => this.getLiveBillingFolio(b.id)));

    // Calculate aggregated KPIs across all active folios
    const totalActiveFolios = folios.length;
    const totalLiveRoomCharges = Math.round(folios.reduce((s, f) => s + f.roomCharges, 0) * 100) / 100;
    const totalLiveAdditionalCharges =
      Math.round(folios.reduce((s, f) => s + f.totalAdditionalCharges, 0) * 100) / 100;
    const totalPaymentsReceived =
      Math.round(folios.reduce((s, f) => s + f.payments.totalPaymentsReceived, 0) * 100) / 100;
    const totalRemainingBalance =
      Math.round(folios.reduce((s, f) => s + Math.max(0, f.remainingBalance), 0) * 100) / 100;

    return {
      folios,
      kpis: {
        totalActiveFolios,
        totalLiveRoomCharges,
        totalLiveAdditionalCharges,
        totalPaymentsReceived,
        totalRemainingBalance,
      },
    };
  }

  // Quick post item/service and instantly recalculate guest billing record
  async quickPostCharge(dto: QuickPostChargeDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    const totalAmount = Math.round(Number(dto.unitPrice) * dto.quantity * 100) / 100;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Create BookingItem
    const bookingItem = await this.prisma.bookingItem.create({
      data: {
        bookingId: dto.bookingId,
        itemId: dto.itemId || null,
        itemNameSnapshot: dto.itemName.trim(),
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalAmount,
        purchaseDate: now,
        purchaseTime: timeString,
        notes: dto.notes ? `${dto.category ? `[${dto.category}] ` : ''}${dto.notes}` : dto.category ? `[${dto.category}]` : null,
      },
      include: { item: { include: { category: true } } },
    });

    // Automatically sync active invoice if one exists
    await this.syncInvoiceForBooking(dto.bookingId);

    // Return updated live billing breakdown
    const updatedFolio = await this.getLiveBillingFolio(dto.bookingId);

    return {
      message: `Charge of ₹${totalAmount} posted successfully. Guest billing record updated automatically.`,
      bookingItem,
      updatedFolio,
    };
  }

  // Automatically recalculate and sync any active invoice for this booking
  async syncInvoiceForBooking(bookingId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        bookingId,
        invoiceStatus: { in: ['DRAFT', 'FINALIZED', 'PARTIALLY_PAID'] },
      },
      include: { payments: true },
    });

    if (!invoice) return null;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingItems: true,
      },
    });

    if (!booking) return null;

    const roomCharges = Math.round(Number(booking.roomRatePerNight) * booking.numberOfNights * 100) / 100;
    const additionalCharges = Math.round(
      booking.bookingItems.reduce((sum, item) => sum + Number(item.totalAmount), 0) * 100,
    ) / 100;
    const subtotal = Math.round((roomCharges + additionalCharges) * 100) / 100;

    let discountAmount = 0.0;
    const discountVal = Number(invoice.discountValue);
    if (invoice.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * (discountVal / 100) * 100) / 100;
    } else if (invoice.discountType === 'FIXED') {
      discountAmount = Math.min(discountVal, subtotal);
    }

    const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const taxPercentage = Number(invoice.taxPercentage);
    const taxAmount = Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const totalPaid = Number(invoice.totalPaid);
    const balanceAmount = Math.round((totalAmount - totalPaid) * 100) / 100;

    let invoiceStatus = invoice.invoiceStatus;
    if (balanceAmount <= 0) {
      invoiceStatus = 'PAID';
    } else if (totalPaid > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    } else {
      invoiceStatus = 'FINALIZED';
    }

    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        roomCharges,
        additionalCharges,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        balanceAmount,
        invoiceStatus,
      },
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

    if (existingActiveInvoice) {
      const updated = await this.prisma.invoice.update({
        where: { id: existingActiveInvoice.id },
        data: {
          taxPercentage,
          taxAmount,
          totalAmount,
          totalPaid,
          balanceAmount,
          invoiceStatus,
          roomCharges,
          additionalCharges: roundedAdditional,
          subtotal,
          discountType: dto.discountType || null,
          discountValue: discountVal,
          discountAmount,
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

      return updated;
    }

    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();

    let invoice: any;
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        invoice = await this.prisma.$transaction(async (tx) => {
          const invoiceNumber = await this.generateInvoiceNumber(tx);
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
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && attempts < 3) {
          continue;
        }
        throw err;
      }
    }

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

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    if (monthParam) {
      const parsedMonth = parseInt(monthParam, 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
      }
    }
    if (yearParam) {
      year = parseInt(yearParam, 10) || year;
    }

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch finalized / generated invoices in this month
    const invoices = await this.prisma.invoice.findMany({
      where: {
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { invoiceDate: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: { include: { roomType: true } },
            bookingItems: { include: { item: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      bookingId: inv.bookingId,
      bookingNumber: inv.booking?.bookingNumber || 'N/A',
      guestName: inv.booking?.primaryGuest?.fullName || 'Guest',
      guestMobile: inv.booking?.primaryGuest?.mobileNumber || '',
      roomNumber: inv.booking?.room?.roomNumber || 'N/A',
      roomType: inv.booking?.room?.roomType?.name || 'Standard',
      checkInDate: inv.booking?.checkInDate || inv.invoiceDate,
      expectedCheckOutDate: inv.booking?.expectedCheckOutDate || inv.invoiceDate,
      numberOfNights: inv.booking?.numberOfNights || 1,
      roomRatePerNight: Number(inv.booking?.roomRatePerNight || 0),
      roomCharges: Number(inv.roomCharges),
      additionalCharges: Number(inv.additionalCharges),
      subtotal: Number(inv.subtotal),
      discountAmount: Number(inv.discountAmount),
      taxAmount: Number(inv.taxAmount),
      finalBill: Number(inv.totalAmount),
      totalPaid: Number(inv.totalPaid),
      balanceAmount: Number(inv.balanceAmount),
      invoiceStatus: inv.invoiceStatus,
      isActive: true,
      isDeleted: false,
      status: 'ACTIVE',
      createdAt: inv.createdAt,
      invoiceDate: inv.invoiceDate,
    }));

    // 2. Fetch active in-house guest folios that have activity in this month
    const activeStays = await this.prisma.booking.findMany({
      where: {
        bookingStatus: 'CHECKED_IN',
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { checkInDate: { gte: startDate, lte: endDate } },
        ],
        invoices: { none: {} },
      },
      include: {
        primaryGuest: true,
        room: { include: { roomType: true } },
        bookingItems: { include: { item: true } },
        payments: true,
      },
    });

    const enrichedFolios = activeStays.map((b) => {
      const roomCharges = Number(b.roomRatePerNight) * b.numberOfNights;
      const addCharges = b.bookingItems.reduce((acc, bi) => acc + Number(bi.totalAmount), 0);
      const paid = b.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const finalBill = roomCharges + addCharges;
      return {
        id: b.id,
        invoiceNumber: `FOLIO-${b.bookingNumber}`,
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        guestName: b.primaryGuest?.fullName || 'Guest',
        guestMobile: b.primaryGuest?.mobileNumber || '',
        roomNumber: b.room?.roomNumber || 'N/A',
        roomType: b.room?.roomType?.name || 'Standard',
        checkInDate: b.checkInDate,
        expectedCheckOutDate: b.expectedCheckOutDate,
        numberOfNights: b.numberOfNights,
        roomRatePerNight: Number(b.roomRatePerNight),
        roomCharges,
        additionalCharges: addCharges,
        subtotal: finalBill,
        discountAmount: 0,
        taxAmount: 0,
        finalBill,
        totalPaid: paid,
        balanceAmount: Math.max(0, finalBill - paid),
        invoiceStatus: paid >= finalBill ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
        isActive: true,
        isDeleted: false,
        status: 'ACTIVE',
        createdAt: b.createdAt,
        invoiceDate: b.checkInDate,
      };
    });

    // 3. Fetch deleted invoice or billing item charges from AuditLog
    const deleteLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: { in: ['INVOICE', 'BOOKING_ITEM', 'FOLIO'] },
        action: 'DELETE',
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    const deletedItems = deleteLogs.map((log) => {
      const prev = (log.previousValues || {}) as any;
      return {
        id: log.entityId || prev.id || `archived-billing-${log.id}`,
        invoiceNumber: prev.invoiceNumber || `ARCHIVED-INV-${log.id.slice(-6)}`,
        bookingId: prev.bookingId || '',
        bookingNumber: prev.bookingNumber || prev.booking?.bookingNumber || 'ARCHIVED-BKG',
        guestName: prev.guestName || prev.booking?.primaryGuest?.fullName || 'Deleted / Archived Record',
        guestMobile: prev.guestMobile || prev.booking?.primaryGuest?.mobileNumber || '',
        roomNumber: prev.roomNumber || prev.booking?.room?.roomNumber || 'N/A',
        roomType: prev.roomType || prev.booking?.room?.roomType?.name || 'Standard',
        checkInDate: prev.checkInDate || log.changedAt,
        expectedCheckOutDate: prev.expectedCheckOutDate || log.changedAt,
        numberOfNights: prev.numberOfNights || 1,
        roomRatePerNight: Number(prev.roomRatePerNight || 0),
        roomCharges: Number(prev.roomCharges || 0),
        additionalCharges: Number(prev.additionalCharges || 0),
        subtotal: Number(prev.subtotal || prev.totalAmount || 0),
        discountAmount: Number(prev.discountAmount || 0),
        taxAmount: Number(prev.taxAmount || 0),
        finalBill: Number(prev.totalAmount || prev.finalBill || 0),
        totalPaid: Number(prev.totalPaid || 0),
        balanceAmount: Number(prev.balanceAmount || 0),
        invoiceStatus: prev.invoiceStatus || 'CANCELLED',
        isActive: false,
        isDeleted: true,
        status: 'DELETED',
        createdAt: prev.createdAt || log.changedAt,
        invoiceDate: prev.invoiceDate || log.changedAt,
        deletedAt: log.changedAt,
      };
    });

    const allHistory = [...enrichedInvoices, ...enrichedFolios, ...deletedItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      month,
      year,
      monthName: startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalCount: allHistory.length,
      activeCount: enrichedInvoices.length + enrichedFolios.length,
      deletedCount: deletedItems.length,
      items: allHistory,
    };
  }

  async remove(id: string) {
    // 1. Check if id is an Invoice ID
    let invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: true,
          },
        },
        payments: true,
      },
    });

    // 2. If not found, check if id is a bookingId that has an invoice
    if (!invoice) {
      invoice = await this.prisma.invoice.findFirst({
        where: { bookingId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              primaryGuest: true,
              room: true,
            },
          },
          payments: true,
        },
      });
    }

    if (invoice) {
      // 1. Audit log snapshot for permanent invoice history
      await this.prisma.auditLog.create({
        data: {
          entityType: 'INVOICE',
          entityId: invoice.id,
          action: 'DELETE',
          previousValues: {
            ...invoice,
            bookingNumber: invoice.booking?.bookingNumber,
            guestName: invoice.booking?.primaryGuest?.fullName,
            guestMobile: invoice.booking?.primaryGuest?.mobileNumber,
            roomNumber: invoice.booking?.room?.roomNumber,
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted invoice ${invoice.invoiceNumber} (₹${invoice.totalAmount}) for booking ${invoice.booking?.bookingNumber}. Preserved in history.`,
        },
      });

      // 2. Unlink payments from invoice
      await this.prisma.payment.updateMany({
        where: { invoiceId: invoice.id },
        data: { invoiceId: null },
      });

      // 3. Delete invoice
      await this.prisma.invoice.delete({ where: { id: invoice.id } });

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} deleted from active database and archived in history.`,
        invoiceNumber: invoice.invoiceNumber,
      };
    }

    // Check if it's a bookingItem (itemized service charge)
    const item = await this.prisma.bookingItem.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            primaryGuest: true,
            room: true,
          },
        },
        item: true,
      },
    });

    if (item) {
      const name = item.itemNameSnapshot || item.item?.name || 'Service Item';
      await this.prisma.auditLog.create({
        data: {
          entityType: 'BOOKING_ITEM',
          entityId: item.id,
          action: 'DELETE',
          previousValues: {
            ...item,
            itemName: name,
            bookingNumber: item.booking?.bookingNumber,
            guestName: item.booking?.primaryGuest?.fullName,
            roomNumber: item.booking?.room?.roomNumber,
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted billing item charge ${name} (₹${item.totalAmount}) from booking ${item.booking?.bookingNumber}. Preserved in history.`,
        },
      });

      await this.prisma.bookingItem.delete({ where: { id } });

      return {
        success: true,
        message: `Service charge for "${name}" (₹${item.totalAmount}) deleted and folio updated.`,
        itemName: name,
      };
    }

    // Check if it's a Booking where user wants to clear folio item charges
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        primaryGuest: true,
        room: true,
        bookingItems: true,
      },
    });

    if (booking) {
      if (booking.bookingItems.length > 0) {
        await this.prisma.auditLog.create({
          data: {
            entityType: 'FOLIO',
            entityId: booking.id,
            action: 'DELETE',
            previousValues: {
              bookingNumber: booking.bookingNumber,
              guestName: booking.primaryGuest?.fullName,
              roomNumber: booking.room?.roomNumber,
              deletedItems: booking.bookingItems,
              deletedAt: new Date().toISOString(),
            } as any,
            description: `Cleared ${booking.bookingItems.length} folio item charges for booking ${booking.bookingNumber}. Preserved in history.`,
          },
        });
        await this.prisma.bookingItem.deleteMany({ where: { bookingId: id } });
      }

      return {
        success: true,
        message: `Folio charges for ${booking.bookingNumber} (${booking.primaryGuest?.fullName || 'Guest'}) cleared and archived in history.`,
      };
    }

    throw new NotFoundException(`Invoice or Billing record with ID ${id} not found`);
  }
}
