import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueryRegisterDto } from './dto/query-register.dto';

@Injectable()
export class RegistersService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegisterData(query: QueryRegisterDto) {
    const { type, search, startDate, endDate, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    switch (type) {
      case 'guests': {
        const where: any = {};
        if (search) {
          where.OR = [
            { guestCode: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { mobileNumber: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.guest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { documents: true, _count: { select: { stayHistory: true } } },
          }),
          this.prisma.guest.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'rooms': {
        const where: any = {};
        if (status && status !== 'ALL') where.roomStatus = status as any;
        if (search) {
          where.OR = [
            { roomNumber: { contains: search, mode: 'insensitive' } },
            { roomType: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.room.findMany({
            where,
            skip,
            take: limit,
            orderBy: { roomNumber: 'asc' },
            include: { roomType: true },
          }),
          this.prisma.room.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'bookings': {
        const where: any = {};
        if (status && status !== 'ALL') where.bookingStatus = status as any;
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

      case 'arrivals': {
        const where: any = { bookingStatus: { in: ['RESERVED', 'CHECKED_IN'] } };
        if (startDate && endDate) {
          where.checkInDate = { gte: new Date(startDate), lte: new Date(endDate) };
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          where.checkInDate = { gte: today };
        }
        if (search) {
          where.OR = [
            { bookingNumber: { contains: search, mode: 'insensitive' } },
            { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { checkInDate: 'asc' },
            include: { primaryGuest: true, room: true },
          }),
          this.prisma.booking.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'inhouse': {
        const where: any = { bookingStatus: 'CHECKED_IN' };
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
            orderBy: { actualCheckInAt: 'desc' },
            include: { primaryGuest: true, room: true, invoices: true },
          }),
          this.prisma.booking.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'departures': {
        const where: any = { bookingStatus: { in: ['CHECKED_IN', 'CHECKED_OUT'] } };
        if (startDate && endDate) {
          where.expectedCheckOutDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { bookingNumber: { contains: search, mode: 'insensitive' } },
            { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { expectedCheckOutDate: 'asc' },
            include: { primaryGuest: true, room: true },
          }),
          this.prisma.booking.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'items': {
        const where: any = {};
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.item.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            include: { category: true },
          }),
          this.prisma.item.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'invoices': {
        const where: any = {};
        if (status && status !== 'ALL') where.invoiceStatus = status as any;
        if (startDate && endDate) {
          where.invoiceDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
            { booking: { primaryGuest: { fullName: { contains: search, mode: 'insensitive' } } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.invoice.findMany({
            where,
            skip,
            take: limit,
            orderBy: { invoiceDate: 'desc' },
            include: { booking: { include: { primaryGuest: true, room: true } }, payments: true },
          }),
          this.prisma.invoice.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'payments': {
        const where: any = {};
        if (status && status !== 'ALL') where.paymentStatus = status as any;
        if (startDate && endDate) {
          where.paymentDate = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        if (search) {
          where.OR = [
            { paymentReference: { contains: search, mode: 'insensitive' } },
            { transactionReference: { contains: search, mode: 'insensitive' } },
            { booking: { bookingNumber: { contains: search, mode: 'insensitive' } } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.payment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { paymentDate: 'desc' },
            include: { booking: { include: { primaryGuest: true, room: true } } },
          }),
          this.prisma.payment.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      case 'staff': {
        const where: any = {};
        if (status && status !== 'ALL') where.employmentStatus = status as any;
        if (search) {
          where.OR = [
            { employeeCode: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
          ];
        }
        const [items, total] = await Promise.all([
          this.prisma.staff.findMany({
            where,
            skip,
            take: limit,
            orderBy: { fullName: 'asc' },
          }),
          this.prisma.staff.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

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
            ],
          };
        }
        const [items, total] = await Promise.all([
          this.prisma.attendance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { attendanceDate: 'desc' },
            include: { staff: true },
          }),
          this.prisma.attendance.count({ where }),
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

      case 'salaries': {
        const where: any = {};
        if (status && status !== 'ALL') where.payrollStatus = status as any;
        if (search) {
          where.staff = {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
            ],
          };
        }
        const [items, total] = await Promise.all([
          this.prisma.salaryRecord.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
            include: { staff: true, salaryPayments: true },
          }),
          this.prisma.salaryRecord.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

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
        const [items, total] = await Promise.all([
          this.prisma.expense.findMany({
            where,
            skip,
            take: limit,
            orderBy: { paymentDate: 'desc' },
            include: { category: true },
          }),
          this.prisma.expense.count({ where }),
        ]);
        return { type, items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      default:
        throw new BadRequestException(`Unknown register type: ${type}`);
    }
  }
}
