import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueryRegisterDto } from './dto/query-register.dto';

@Injectable()
export class RegistersService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegisterData(query: QueryRegisterDto) {
    const { type, search, roomNumber, startDate, endDate, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    switch (type) {
      // =======================================================================
      // 1. GUEST REGISTER (Guest Information Records)
      // =======================================================================
      case 'guests': {
        const where: any = {};
        if (search) {
          where.OR = [
            { guestCode: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { mobileNumber: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ];
        }
        if (startDate && endDate) {
          where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          };
        }

        const [items, total, totalAll] = await Promise.all([
          this.prisma.guest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              documents: true,
              _count: { select: { stayHistory: true } },
            },
          }),
          this.prisma.guest.count({ where }),
          this.prisma.guest.count(),
        ]);

        return {
          type,
          title: 'Guest Register (Guest Information Records)',
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalRegisteredGuests: totalAll,
            filteredCount: total,
          },
        };
      }

      // =======================================================================
      // 2. CHECK-IN REGISTER (Check-in Records)
      // =======================================================================
      case 'check-ins':
      case 'arrivals':
      case 'inhouse': {
        const where: any = {};

        if (type === 'inhouse') {
          where.bookingStatus = 'CHECKED_IN';
        } else {
          where.OR = [
            { actualCheckInAt: { not: null } },
            { bookingStatus: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
          ];
        }

        if (status && status !== 'ALL') {
          where.bookingStatus = status as any;
        }

        if (roomNumber) {
          where.room = { roomNumber: { contains: roomNumber, mode: 'insensitive' } };
        }

        if (startDate && endDate) {
          where.checkInDate = {
            gte: new Date(startDate),
            lte: new Date(endDate),
          };
        }

        if (search) {
          where.AND = [
            {
              OR: [
                { bookingNumber: { contains: search, mode: 'insensitive' } },
                { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } },
                { primaryGuest: { mobileNumber: { contains: search, mode: 'insensitive' } } },
                { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
              ],
            },
          ];
        }

        const [items, total, aggAdvances] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { checkInDate: 'desc' },
            include: {
              primaryGuest: true,
              room: { include: { roomType: true } },
              payments: { where: { paymentType: 'ADVANCE' } },
            },
          }),
          this.prisma.booking.count({ where }),
          this.prisma.booking.aggregate({
            where,
            _sum: { advanceAmount: true },
          }),
        ]);

        return {
          type: 'check-ins',
          title: 'Check-in Register (Check-in Records)',
          items: items.map((b) => ({
            id: b.id,
            bookingNumber: b.bookingNumber,
            guestName: b.primaryGuest?.fullName,
            guestMobile: b.primaryGuest?.mobileNumber,
            guestCode: b.primaryGuest?.guestCode,
            roomNumber: b.room?.roomNumber,
            roomType: b.room?.roomType?.name,
            checkInDate: b.checkInDate,
            checkInTime: b.checkInTime || (b.actualCheckInAt ? new Date(b.actualCheckInAt).toLocaleTimeString() : '12:00 PM'),
            actualCheckInAt: b.actualCheckInAt,
            expectedCheckOutDate: b.expectedCheckOutDate,
            expectedCheckOutTime: b.expectedCheckOutTime || '11:00 AM',
            numberOfNights: b.numberOfNights,
            roomPricePerNight: Number(b.roomRatePerNight),
            advancePayment: Number(b.advanceAmount || 0),
            advancePaymentMethod: b.payments[0]?.paymentMethod || 'CASH',
            numberOfGuests: b.numberOfGuests,
            bookingStatus: b.bookingStatus,
            notes: b.notes,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalCheckIns: total,
            totalAdvanceCollected: Number(aggAdvances._sum.advanceAmount || 0),
          },
        };
      }

      // =======================================================================
      // 3. CHECK-OUT REGISTER (Check-out Records)
      // =======================================================================
      case 'check-outs':
      case 'departures': {
        const where: any = {
          OR: [
            { actualCheckOutAt: { not: null } },
            { bookingStatus: 'CHECKED_OUT' },
          ],
        };

        if (roomNumber) {
          where.room = { roomNumber: { contains: roomNumber, mode: 'insensitive' } };
        }

        if (startDate && endDate) {
          where.expectedCheckOutDate = {
            gte: new Date(startDate),
            lte: new Date(endDate),
          };
        }

        if (search) {
          where.AND = [
            {
              OR: [
                { bookingNumber: { contains: search, mode: 'insensitive' } },
                { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } },
                { primaryGuest: { mobileNumber: { contains: search, mode: 'insensitive' } } },
                { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
              ],
            },
          ];
        }

        const [items, total] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ actualCheckOutAt: 'desc' }, { expectedCheckOutDate: 'desc' }],
            include: {
              primaryGuest: true,
              room: { include: { roomType: true } },
              invoices: { include: { payments: true } },
              payments: true,
            },
          }),
          this.prisma.booking.count({ where }),
        ]);

        let sumTotalBills = 0;
        let sumTotalPaid = 0;

        const formatted = items.map((b) => {
          const inv = b.invoices[0];
          const totalBill = inv ? Number(inv.totalAmount) : Number(b.roomRatePerNight) * b.numberOfNights;
          const advance = Number(b.advanceAmount || 0);
          const paymentsReceived = b.payments.reduce((acc, p) => acc + Number(p.amount), 0);
          const balance = inv ? Number(inv.balanceAmount) : Math.max(0, totalBill - paymentsReceived);

          sumTotalBills += totalBill;
          sumTotalPaid += paymentsReceived;

          return {
            id: b.id,
            bookingNumber: b.bookingNumber,
            guestName: b.primaryGuest?.fullName,
            guestMobile: b.primaryGuest?.mobileNumber,
            roomNumber: b.room?.roomNumber,
            roomType: b.room?.roomType?.name,
            actualCheckOutDate: b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toISOString().split('T')[0] : b.expectedCheckOutDate,
            actualCheckOutTime: b.actualCheckOutAt ? new Date(b.actualCheckOutAt).toLocaleTimeString() : b.expectedCheckOutTime || '11:00 AM',
            totalNumberOfNights: b.numberOfNights,
            roomCharges: inv ? Number(inv.roomCharges) : Number(b.roomRatePerNight) * b.numberOfNights,
            additionalItemCharges: inv ? Number(inv.additionalCharges) : 0,
            serviceCharges: 0,
            discount: inv ? Number(inv.discountAmount) : 0,
            tax: inv ? Number(inv.taxAmount) : 0,
            totalBillAmount: totalBill,
            advancePayment: advance,
            additionalPayments: Math.max(0, paymentsReceived - advance),
            remainingPayment: balance,
            invoiceNumber: inv?.invoiceNumber || '-',
            invoiceStatus: inv?.invoiceStatus || 'SETTLED',
          };
        });

        return {
          type: 'check-outs',
          title: 'Check-out Register (Check-out Records)',
          items: formatted,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalCheckOuts: total,
            totalBillSettled: sumTotalBills,
            totalPaidAmount: sumTotalPaid,
          },
        };
      }

      // =======================================================================
      // 4. ROOM REGISTER (Room Management Records)
      // =======================================================================
      case 'rooms': {
        const where: any = {};
        if (status && status !== 'ALL') where.roomStatus = status as any;
        if (roomNumber) where.roomNumber = { contains: roomNumber, mode: 'insensitive' };
        if (search) {
          where.OR = [
            { roomNumber: { contains: search, mode: 'insensitive' } },
            { roomType: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const [items, total, stats] = await Promise.all([
          this.prisma.room.findMany({
            where,
            skip,
            take: limit,
            orderBy: { roomNumber: 'asc' },
            include: {
              roomType: true,
              bookings: {
                where: { bookingStatus: 'CHECKED_IN' },
                include: { primaryGuest: true },
                take: 1,
              },
            },
          }),
          this.prisma.room.count({ where }),
          this.prisma.room.groupBy({
            by: ['roomStatus'],
            _count: { id: true },
          }),
        ]);

        const statusCounts = stats.reduce((acc, curr) => {
          acc[curr.roomStatus] = curr._count.id;
          return acc;
        }, {} as Record<string, number>);

        return {
          type,
          title: 'Room Register (Room Management Records)',
          items: items.map((r) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            roomType: r.roomType?.name,
            floor: r.floor,
            pricePerNight: Number(r.pricePerNight),
            roomStatus: r.roomStatus,
            currentGuest: r.bookings[0]?.primaryGuest?.fullName || (r.roomStatus === 'OCCUPIED' ? 'Occupied' : '-'),
            currentBookingNumber: r.bookings[0]?.bookingNumber || '-',
            cleanlinessStatus: r.roomStatus === 'MAINTENANCE' ? 'Maintenance' : 'Ready / Clean',
            isActive: r.isActive,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalRooms: total,
            available: statusCounts['AVAILABLE'] || 0,
            occupied: statusCounts['OCCUPIED'] || 0,
            maintenance: statusCounts['MAINTENANCE'] || 0,
          },
        };
      }

      // =======================================================================
      // 5. GUEST BILLING REGISTER (Billing Records)
      // =======================================================================
      case 'billing':
      case 'invoices': {
        const where: any = {};
        if (status && status !== 'ALL') where.invoiceStatus = status as any;
        if (roomNumber) {
          where.booking = { room: { roomNumber: { contains: roomNumber, mode: 'insensitive' } } };
        }
        if (startDate && endDate) {
          where.invoiceDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
            { booking: { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } } },
            { booking: { room: { roomNumber: { contains: search, mode: 'insensitive' } } } },
          ];
        }

        const [items, total, aggregates] = await Promise.all([
          this.prisma.invoice.findMany({
            where,
            skip,
            take: limit,
            orderBy: { invoiceDate: 'desc' },
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
          this.prisma.invoice.aggregate({
            where,
            _sum: {
              totalAmount: true,
              totalPaid: true,
              balanceAmount: true,
              taxAmount: true,
            },
          }),
        ]);

        return {
          type: 'billing',
          title: 'Guest Billing Register (Billing Records)',
          items: items.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            bookingNumber: inv.booking?.bookingNumber,
            guestName: inv.booking?.primaryGuest?.fullName,
            guestMobile: inv.booking?.primaryGuest?.mobileNumber,
            roomNumber: inv.booking?.room?.roomNumber,
            roomCharges: Number(inv.roomCharges),
            additionalCharges: Number(inv.additionalCharges),
            subtotal: Number(inv.subtotal),
            discountAmount: Number(inv.discountAmount),
            taxAmount: Number(inv.taxAmount),
            totalAmount: Number(inv.totalAmount),
            totalPaid: Number(inv.totalPaid),
            balanceAmount: Number(inv.balanceAmount),
            invoiceStatus: inv.invoiceStatus,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalInvoices: total,
            totalBilled: Number(aggregates._sum.totalAmount || 0),
            totalPaid: Number(aggregates._sum.totalPaid || 0),
            totalBalanceDue: Number(aggregates._sum.balanceAmount || 0),
          },
        };
      }

      // =======================================================================
      // 6. PAYMENT REGISTER (Payment History)
      // =======================================================================
      case 'payments': {
        const where: any = {};
        if (status && status !== 'ALL') where.paymentStatus = status as any;
        if (roomNumber) {
          where.booking = { room: { roomNumber: { contains: roomNumber, mode: 'insensitive' } } };
        }
        if (startDate && endDate) {
          where.paymentDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { paymentReference: { contains: search, mode: 'insensitive' } },
            { transactionReference: { contains: search, mode: 'insensitive' } },
            { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
            { booking: { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } } },
          ];
        }

        const [items, total, aggregates, byMethod] = await Promise.all([
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
            },
          }),
          this.prisma.payment.count({ where }),
          this.prisma.payment.aggregate({
            where,
            _sum: { amount: true },
          }),
          this.prisma.payment.groupBy({
            where,
            by: ['paymentMethod'],
            _sum: { amount: true },
          }),
        ]);

        const methodTotals = byMethod.reduce((acc, curr) => {
          acc[curr.paymentMethod] = Number(curr._sum.amount || 0);
          return acc;
        }, {} as Record<string, number>);

        return {
          type,
          title: 'Payment Register (Payment History)',
          items: items.map((p) => ({
            id: p.id,
            paymentReference: p.paymentReference,
            transactionReference: p.transactionReference || '-',
            bookingNumber: p.booking?.bookingNumber,
            guestName: p.booking?.primaryGuest?.fullName,
            roomNumber: p.booking?.room?.roomNumber,
            amount: Number(p.amount),
            paymentMethod: p.paymentMethod,
            paymentType: p.paymentType,
            paymentDate: p.paymentDate,
            paymentStatus: p.paymentStatus,
            notes: p.notes,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalPaymentsCount: total,
            totalCollected: Number(aggregates._sum.amount || 0),
            cashCollected: methodTotals['CASH'] || 0,
            upiCollected: methodTotals['UPI'] || 0,
            bankCollected: methodTotals['BANK_TRANSFER'] || 0,
          },
        };
      }

      // =======================================================================
      // 7. DAILY CASH BOOK (Daily Cash Transactions)
      // =======================================================================
      case 'cash-book': {
        // Collect all CASH inflows & outflows
        const paymentWhere: any = { paymentMethod: 'CASH', paymentStatus: 'COMPLETED' };
        const expenseWhere: any = { paymentMethod: 'CASH' };
        const salaryWhere: any = { paymentMethod: 'CASH' };
        const advanceWhere: any = { paymentMethod: 'CASH' };

        if (startDate && endDate) {
          const dRange = { gte: new Date(startDate), lte: new Date(endDate) };
          paymentWhere.paymentDate = dRange;
          expenseWhere.paymentDate = dRange;
          salaryWhere.paymentDate = dRange;
          advanceWhere.advanceDate = dRange;
        }

        const [cashPayments, cashExpenses, cashSalaries, cashAdvances] = await Promise.all([
          this.prisma.payment.findMany({
            where: paymentWhere,
            include: { booking: { include: { primaryGuest: true, room: true } } },
            orderBy: { paymentDate: 'desc' },
          }),
          this.prisma.expense.findMany({
            where: expenseWhere,
            include: { category: true },
            orderBy: { paymentDate: 'desc' },
          }),
          this.prisma.salaryPayment.findMany({
            where: salaryWhere,
            include: { salaryRecord: { include: { staff: true } } },
            orderBy: { paymentDate: 'desc' },
          }),
          this.prisma.staffAdvance.findMany({
            where: advanceWhere,
            include: { staff: true },
            orderBy: { advanceDate: 'desc' },
          }),
        ]);

        const allEntries: any[] = [];

        // 1. Inflows from Guest Cash Payments
        cashPayments.forEach((p) => {
          allEntries.push({
            id: 'cash-in-' + p.id,
            date: p.paymentDate,
            time: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            flowType: 'INFLOW',
            category: 'Guest Payment (' + p.paymentType + ')',
            reference: p.paymentReference,
            partyName: p.booking?.primaryGuest?.fullName || 'Walk-In Guest',
            roomNumber: p.booking?.room?.roomNumber || '-',
            amount: Number(p.amount),
            description: `Payment for Booking ${p.booking?.bookingNumber || ''}`,
          });
        });

        // 2. Outflows from Cash Expenses
        cashExpenses.forEach((e) => {
          allEntries.push({
            id: 'cash-out-exp-' + e.id,
            date: e.paymentDate,
            time: new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            flowType: 'OUTFLOW',
            category: `Hotel Expense (${e.category?.name || 'General'})`,
            reference: e.expenseReference,
            partyName: e.description?.slice(0, 30) || 'Operational Expense',
            roomNumber: '-',
            amount: Number(e.amount),
            description: e.description,
          });
        });

        // 3. Outflows from Cash Salary Payouts
        cashSalaries.forEach((s) => {
          allEntries.push({
            id: 'cash-out-sal-' + s.id,
            date: s.paymentDate,
            time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            flowType: 'OUTFLOW',
            category: 'Staff Salary Payout',
            reference: s.paymentReference,
            partyName: s.salaryRecord?.staff?.fullName || 'Employee',
            roomNumber: '-',
            amount: Number(s.paymentAmount),
            description: s.notes || 'Monthly salary payment in cash',
          });
        });

        // 4. Outflows from Cash Staff Advances
        cashAdvances.forEach((a) => {
          allEntries.push({
            id: 'cash-out-adv-' + a.id,
            date: a.advanceDate,
            time: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            flowType: 'OUTFLOW',
            category: 'Staff Salary Advance',
            reference: a.advanceReference,
            partyName: a.staff?.fullName || 'Employee',
            roomNumber: '-',
            amount: Number(a.amount),
            description: a.notes || 'Salary advance issued in cash',
          });
        });

        // Sort chronological descending
        allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Apply filters
        let filtered = allEntries;
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.reference?.toLowerCase().includes(s) ||
              e.partyName?.toLowerCase().includes(s) ||
              e.category?.toLowerCase().includes(s) ||
              e.roomNumber?.toLowerCase().includes(s),
          );
        }
        if (roomNumber) {
          filtered = filtered.filter((e) => e.roomNumber === roomNumber);
        }

        const totalCashInflow = filtered
          .filter((e) => e.flowType === 'INFLOW')
          .reduce((sum, e) => sum + e.amount, 0);
        const totalCashOutflow = filtered
          .filter((e) => e.flowType === 'OUTFLOW')
          .reduce((sum, e) => sum + e.amount, 0);

        const paginated = filtered.slice(skip, skip + limit);

        return {
          type: 'cash-book',
          title: 'Daily Cash Book (Daily Cash Transactions)',
          items: paginated,
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
          summary: {
            totalCashInflow,
            totalCashOutflow,
            netCashFlow: totalCashInflow - totalCashOutflow,
            totalTransactions: filtered.length,
          },
        };
      }

      // =======================================================================
      // 8. SERVICE REGISTER (Items & Services Records)
      // =======================================================================
      case 'services':
      case 'items': {
        const where: any = {};
        if (roomNumber) {
          where.booking = { room: { roomNumber: { contains: roomNumber, mode: 'insensitive' } } };
        }
        if (startDate && endDate) {
          where.purchaseDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { itemNameSnapshot: { contains: search, mode: 'insensitive' } },
            { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
            { booking: { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } } },
            { booking: { room: { roomNumber: { contains: search, mode: 'insensitive' } } } },
          ];
        }

        const [items, total, aggregates] = await Promise.all([
          this.prisma.bookingItem.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
            include: {
              booking: {
                include: {
                  primaryGuest: true,
                  room: true,
                },
              },
              item: { include: { category: true } },
            },
          }),
          this.prisma.bookingItem.count({ where }),
          this.prisma.bookingItem.aggregate({
            where,
            _sum: { totalAmount: true, quantity: true },
          }),
        ]);

        return {
          type: 'services',
          title: 'Service Register (Items & Services Records)',
          items: items.map((bi) => ({
            id: bi.id,
            guestName: bi.booking?.primaryGuest?.fullName || 'In-House Guest',
            roomNumber: bi.booking?.room?.roomNumber || '-',
            bookingNumber: bi.booking?.bookingNumber,
            itemName: bi.itemNameSnapshot,
            category: bi.item?.category?.name || 'Hotel Service',
            quantity: bi.quantity,
            price: Number(bi.unitPrice),
            totalAmount: Number(bi.totalAmount),
            purchaseDate: bi.purchaseDate,
            purchaseTime: bi.purchaseTime || new Date(bi.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: bi.notes || '-',
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalServicesOrders: total,
            totalItemsSold: aggregates._sum.quantity || 0,
            totalServiceRevenue: Number(aggregates._sum.totalAmount || 0),
          },
        };
      }

      // =======================================================================
      // 9. STAFF REGISTER (Staff Information Records)
      // =======================================================================
      case 'staff': {
        const where: any = {};
        if (status && status !== 'ALL') where.employmentStatus = status as any;
        if (search) {
          where.OR = [
            { employeeCode: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
            { mobileNumber: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [items, total, salaryAgg] = await Promise.all([
          this.prisma.staff.findMany({
            where,
            skip,
            take: limit,
            orderBy: { fullName: 'asc' },
            include: {
              _count: {
                select: { attendanceRecords: true, salaryRecords: true },
              },
            },
          }),
          this.prisma.staff.count({ where }),
          this.prisma.staff.aggregate({
            where: { employmentStatus: 'ACTIVE' },
            _sum: { monthlySalary: true },
          }),
        ]);

        return {
          type,
          title: 'Staff Register (Staff Information Records)',
          items: items.map((s) => ({
            id: s.id,
            employeeId: s.employeeCode,
            fullName: s.fullName,
            mobileNumber: s.mobileNumber,
            emailAddress: s.email || '-',
            personalAddress: s.address || '-',
            dateOfBirth: s.dateOfBirth,
            emergencyContact: s.emergencyContact || '-',
            designation: s.designation,
            department: s.department,
            joiningDate: s.joiningDate,
            monthlySalary: Number(s.monthlySalary),
            bankDetails: s.bankAccountNumber ? `${s.bankAccountHolder || s.fullName} | Acc: ${s.bankAccountNumber} | IFSC: ${s.bankIfscCode || '-'}` : 'Not on file',
            employmentStatus: s.employmentStatus,
            attendanceCount: s._count.attendanceRecords,
            payrollsCount: s._count.salaryRecords,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalStaff: total,
            monthlyPayrollCommitment: Number(salaryAgg._sum.monthlySalary || 0),
          },
        };
      }

      // =======================================================================
      // 10. ATTENDANCE REGISTER (Attendance Records)
      // =======================================================================
      case 'attendance': {
        const where: any = {};
        if (status && status !== 'ALL') where.attendanceStatus = status as any;
        if (startDate && endDate) {
          where.attendanceDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.staff = {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
              { department: { contains: search, mode: 'insensitive' } },
            ],
          };
        }

        const [items, total, stats] = await Promise.all([
          this.prisma.attendance.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ attendanceDate: 'desc' }, { staff: { fullName: 'asc' } }],
            include: { staff: true },
          }),
          this.prisma.attendance.count({ where }),
          this.prisma.attendance.groupBy({
            where,
            by: ['attendanceStatus'],
            _count: { id: true },
          }),
        ]);

        const counts = stats.reduce((acc, curr) => {
          acc[curr.attendanceStatus] = curr._count.id;
          return acc;
        }, {} as Record<string, number>);

        return {
          type,
          title: 'Attendance Register (Attendance Records)',
          items: items.map((a) => ({
            id: a.id,
            attendanceDate: a.attendanceDate,
            employeeId: a.staff?.employeeCode,
            staffName: a.staff?.fullName,
            department: a.staff?.department,
            attendanceStatus: a.attendanceStatus,
            checkInTime: a.checkInTime || '-',
            checkOutTime: a.checkOutTime || '-',
            workingHours: Number(a.workingHours || 0),
            overtimeHours: Number(a.overtimeHours || 0),
            notes: a.notes,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalLogs: total,
            present: counts['PRESENT'] || 0,
            absent: counts['ABSENT'] || 0,
            halfDay: counts['HALF_DAY'] || 0,
            leave: counts['LEAVE'] || 0,
            weeklyOff: counts['WEEKLY_OFF'] || 0,
          },
        };
      }

      // =======================================================================
      // 11. SALARY REGISTER (Payroll Records)
      // =======================================================================
      case 'salaries': {
        const where: any = {};
        if (status && status !== 'ALL') where.payrollStatus = status as any;
        if (search) {
          where.staff = {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
              { department: { contains: search, mode: 'insensitive' } },
            ],
          };
        }

        const [items, total, aggregates] = await Promise.all([
          this.prisma.salaryRecord.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
            include: { staff: true, salaryPayments: true },
          }),
          this.prisma.salaryRecord.count({ where }),
          this.prisma.salaryRecord.aggregate({
            where,
            _sum: {
              netSalary: true,
              totalPaid: true,
              balanceAmount: true,
              overtimeAmount: true,
            },
          }),
        ]);

        return {
          type,
          title: 'Salary Register (Payroll Records)',
          items: items.map((s) => ({
            id: s.id,
            payrollPeriod: `${s.payrollMonth}/${s.payrollYear}`,
            employeeId: s.staff?.employeeCode,
            staffName: s.staff?.fullName,
            department: s.staff?.department,
            monthlyBasicSalary: Number(s.monthlyBasicSalary),
            totalWorkingDays: s.configuredSalaryDays,
            presentDays: Number(s.presentDays),
            absentDays: Number(s.absentDays),
            paidLeaves: Number(s.paidLeaves),
            unpaidLeaves: Number(s.unpaidLeaves),
            overtimeHours: Number(s.overtimeHours),
            overtimeAmount: Number(s.overtimeAmount),
            salaryAdvances: Number(s.advanceDeductions),
            otherDeductions: Number(s.deductions),
            finalPayableSalary: Number(s.netSalary),
            totalDisbursed: Number(s.totalPaid),
            remainingBalance: Number(s.balanceAmount),
            payrollStatus: s.payrollStatus,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalPayrolls: total,
            totalNetSalary: Number(aggregates._sum.netSalary || 0),
            totalDisbursed: Number(aggregates._sum.totalPaid || 0),
            totalBalanceDue: Number(aggregates._sum.balanceAmount || 0),
          },
        };
      }

      // =======================================================================
      // 12. EXPENSE REGISTER (Expense Records)
      // =======================================================================
      case 'expenses': {
        const where: any = {};
        if (startDate && endDate) {
          where.paymentDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { expenseReference: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const [items, total, aggregates] = await Promise.all([
          this.prisma.expense.findMany({
            where,
            skip,
            take: limit,
            orderBy: { paymentDate: 'desc' },
            include: { category: true },
          }),
          this.prisma.expense.count({ where }),
          this.prisma.expense.aggregate({
            where,
            _sum: { amount: true },
          }),
        ]);

        return {
          type,
          title: 'Expense Register (Expense Records)',
          items: items.map((e) => ({
            id: e.id,
            expenseReference: e.expenseReference,
            paymentDate: e.paymentDate,
            categoryName: e.category?.name || 'General',
            description: e.description,
            paymentMethod: e.paymentMethod,
            amount: Number(e.amount),
            notes: e.notes || '-',
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          summary: {
            totalExpensesCount: total,
            totalExpensesAmount: Number(aggregates._sum.amount || 0),
          },
        };
      }

      // =======================================================================
      // 13. DAILY BUSINESS REGISTER (Daily Business Reports)
      // =======================================================================
      case 'business': {
        // Build 14-30 day chronological daily business register
        let start = startDate ? new Date(startDate) : new Date(Date.now() - 14 * 86400000);
        let end = endDate ? new Date(endDate) : new Date();
        if (start > end) {
          const temp = start;
          start = end;
          end = temp;
        }

        // Fetch total active rooms
        const totalRoomsInHotel = await this.prisma.room.count({ where: { isActive: true } });

        // Fetch bookings, invoices, payments, expenses in this range
        const [bookings, invoices, payments, expenses, salaries] = await Promise.all([
          this.prisma.booking.findMany({
            where: {
              OR: [
                { checkInDate: { gte: start, lte: end } },
                { expectedCheckOutDate: { gte: start, lte: end } },
                { actualCheckInAt: { gte: start, lte: end } },
                { actualCheckOutAt: { gte: start, lte: end } },
              ],
            },
            include: { room: true },
          }),
          this.prisma.invoice.findMany({
            where: { invoiceDate: { gte: start, lte: end } },
          }),
          this.prisma.payment.findMany({
            where: { paymentDate: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
          }),
          this.prisma.expense.findMany({
            where: { paymentDate: { gte: start, lte: end } },
          }),
          this.prisma.salaryPayment.findMany({
            where: { paymentDate: { gte: start, lte: end } },
          }),
        ]);

        // Generate day map
        const dayMap = new Map<string, any>();
        const curr = new Date(start);
        while (curr <= end) {
          const dateStr = curr.toISOString().split('T')[0];
          dayMap.set(dateStr, {
            date: dateStr,
            checkIns: 0,
            checkOuts: 0,
            occupiedRooms: 0,
            roomRevenue: 0,
            serviceRevenue: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            totalSalaries: 0,
            netOperatingProfit: 0,
            cashCollected: 0,
            digitalCollected: 0,
          });
          curr.setDate(curr.getDate() + 1);
        }

        // Checkins / checkouts count
        bookings.forEach((b) => {
          const inStr = b.checkInDate ? new Date(b.checkInDate).toISOString().split('T')[0] : null;
          const outStr = b.expectedCheckOutDate ? new Date(b.expectedCheckOutDate).toISOString().split('T')[0] : null;

          if (inStr && dayMap.has(inStr)) {
            dayMap.get(inStr).checkIns += 1;
          }
          if (outStr && dayMap.has(outStr)) {
            dayMap.get(outStr).checkOuts += 1;
          }
        });

        // Invoices (revenue)
        invoices.forEach((inv) => {
          const invDateStr = new Date(inv.invoiceDate).toISOString().split('T')[0];
          if (dayMap.has(invDateStr)) {
            const entry = dayMap.get(invDateStr);
            entry.roomRevenue += Number(inv.roomCharges);
            entry.serviceRevenue += Number(inv.additionalCharges);
            entry.totalRevenue += Number(inv.totalAmount);
          }
        });

        // Payments (cash vs digital)
        payments.forEach((p) => {
          const pDateStr = new Date(p.paymentDate).toISOString().split('T')[0];
          if (dayMap.has(pDateStr)) {
            const entry = dayMap.get(pDateStr);
            if (p.paymentMethod === 'CASH') {
              entry.cashCollected += Number(p.amount);
            } else {
              entry.digitalCollected += Number(p.amount);
            }
          }
        });

        // Expenses
        expenses.forEach((e) => {
          const eDateStr = new Date(e.paymentDate).toISOString().split('T')[0];
          if (dayMap.has(eDateStr)) {
            const entry = dayMap.get(eDateStr);
            entry.totalExpenses += Number(e.amount);
          }
        });

        // Salaries
        salaries.forEach((s) => {
          const sDateStr = new Date(s.paymentDate).toISOString().split('T')[0];
          if (dayMap.has(sDateStr)) {
            const entry = dayMap.get(sDateStr);
            entry.totalSalaries += Number(s.paymentAmount);
          }
        });

        // Compute net profits & occupancy
        const businessRecords: any[] = [];
        let grandRevenue = 0;
        let grandExpenses = 0;
        let grandSalaries = 0;
        let grandProfit = 0;

        dayMap.forEach((entry) => {
          entry.occupiedRooms = Math.min(totalRoomsInHotel, entry.checkIns + Math.floor(Math.random() * 0));
          entry.occupancyRate = totalRoomsInHotel > 0 ? Math.round((entry.occupiedRooms / totalRoomsInHotel) * 100) : 0;
          entry.netOperatingProfit = entry.totalRevenue - entry.totalExpenses - entry.totalSalaries;

          grandRevenue += entry.totalRevenue;
          grandExpenses += entry.totalExpenses;
          grandSalaries += entry.totalSalaries;
          grandProfit += entry.netOperatingProfit;

          businessRecords.push(entry);
        });

        // Sort descending by date
        businessRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const paginated = businessRecords.slice(skip, skip + limit);

        return {
          type: 'business',
          title: 'Daily Business Register (Daily Business Reports)',
          items: paginated,
          total: businessRecords.length,
          page,
          limit,
          totalPages: Math.ceil(businessRecords.length / limit),
          summary: {
            totalDaysRecorded: businessRecords.length,
            totalGrossRevenue: grandRevenue,
            totalExpenses: grandExpenses,
            totalSalariesDisbursed: grandSalaries,
            netOperatingProfit: grandProfit,
            totalActiveRooms: totalRoomsInHotel,
          },
        };
      }

      // =======================================================================
      // ALIASES FOR BACKWARD COMPATIBILITY
      // =======================================================================
      case 'bookings': {
        const where: any = {};
        if (status && status !== 'ALL') where.bookingStatus = status as any;
        if (roomNumber) where.room = { roomNumber: { contains: roomNumber, mode: 'insensitive' } };
        if (startDate && endDate) {
          where.checkInDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { bookingNumber: { contains: search, mode: 'insensitive' } },
            { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } },
            { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { primaryGuest: true, room: { include: { roomType: true } } },
          }),
          this.prisma.booking.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'advances': {
        const where: any = {};
        if (status && status !== 'ALL') where.repaymentStatus = status as any;
        if (startDate && endDate) {
          where.advanceDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { advanceReference: { contains: search, mode: 'insensitive' } },
            { staff: { fullName: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.staffAdvance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { advanceDate: 'desc' },
            include: { staff: true },
          }),
          this.prisma.staffAdvance.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      default:
        throw new BadRequestException(`Unknown register type: ${type}`);
    }
  }
}
