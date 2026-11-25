import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateHotelSettingDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) { }

  async getSettings() {
    return this.prisma.hotelSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        hotelName: 'Hotel Radha Palace',
        hotelAddress: 'Hotel Radha Palace, Main Road',
        mobileNumber: '+91 9876543210',
        email: 'info@hotelradhapalace.com',
        currencyCode: 'INR',
        timezone: 'Asia/Kolkata',
        defaultCheckInTime: '12:00 PM',
        defaultCheckOutTime: '11:00 AM',
        taxEnabled: true,
        defaultTaxPercentage: 12.00,
        defaultSalaryDays: 30,
      },
    });
  }

  async updateSettings(dto: UpdateHotelSettingDto) {
    const existing = await this.getSettings();

    const updated = await this.prisma.hotelSetting.update({
      where: { id: 'default' },
      data: {
        hotelName: dto.hotelName !== undefined ? dto.hotelName : existing.hotelName,
        hotelAddress: dto.hotelAddress !== undefined ? dto.hotelAddress : existing.hotelAddress,
        mobileNumber: dto.mobileNumber !== undefined ? dto.mobileNumber : existing.mobileNumber,
        email: dto.email !== undefined ? dto.email : existing.email,
        currencyCode: dto.currencyCode !== undefined ? dto.currencyCode : existing.currencyCode,
        timezone: dto.timezone !== undefined ? dto.timezone : existing.timezone,
        defaultCheckInTime: dto.defaultCheckInTime !== undefined ? dto.defaultCheckInTime : existing.defaultCheckInTime,
        defaultCheckOutTime: dto.defaultCheckOutTime !== undefined ? dto.defaultCheckOutTime : existing.defaultCheckOutTime,
        taxEnabled: dto.taxEnabled !== undefined ? dto.taxEnabled : existing.taxEnabled,
        defaultTaxPercentage: dto.defaultTaxPercentage !== undefined ? dto.defaultTaxPercentage : existing.defaultTaxPercentage,
        defaultSalaryDays: dto.defaultSalaryDays !== undefined ? dto.defaultSalaryDays : existing.defaultSalaryDays,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'SETTINGS',
        entityId: 'default',
        action: 'UPDATE',
        previousValues: { taxPercentage: existing.defaultTaxPercentage, hotelName: existing.hotelName },
        newValues: { taxPercentage: updated.defaultTaxPercentage, hotelName: updated.hotelName },
        description: `Updated hotel operational settings and configurations`,
      },
    });

    return updated;
  }

  async getSystemHealth() {
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      await this.prisma.systemHealth.upsert({
        where: { id: 'system' },
        update: { status: 'healthy' },
        create: { id: 'system', status: 'healthy' },
      });
    } catch (err: any) {
      dbStatus = 'unreachable';
      this.logger.error(`Database health check failed: ${err.message}`);
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      database: {
        provider: 'Serverless PostgreSQL 16+',
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
      backupStatus: {
        strategy: 'Continuous Write-Ahead Log (WAL) & Automated Snapshots',
        pointInTimeRecovery: 'Enabled',
        automatedDailyRetention: 'Configured via Cloud Console',
        onDemandBackup: 'Available via /api/v1/settings/backup',
      },
    };
  }

  // On-demand Full Database Snapshot Export
  async createDatabaseBackup() {
    const start = Date.now();
    const [
      settings,
      roomTypes,
      rooms,
      guests,
      guestDocuments,
      bookings,
      bookingGuests,
      itemCategories,
      items,
      bookingItems,
      invoices,
      payments,
      staff,
      attendances,
      salaryRecords,
      salaryPayments,
      staffAdvances,
      expenseCategories,
      expenses,
      auditLogs,
    ] = await Promise.all([
      this.prisma.hotelSetting.findMany(),
      this.prisma.roomType.findMany(),
      this.prisma.room.findMany(),
      this.prisma.guest.findMany(),
      this.prisma.guestDocument.findMany(),
      this.prisma.booking.findMany(),
      this.prisma.bookingGuest.findMany(),
      this.prisma.itemCategory.findMany(),
      this.prisma.item.findMany(),
      this.prisma.bookingItem.findMany(),
      this.prisma.invoice.findMany(),
      this.prisma.payment.findMany(),
      this.prisma.staff.findMany(),
      this.prisma.attendance.findMany(),
      this.prisma.salaryRecord.findMany(),
      this.prisma.salaryPayment.findMany(),
      this.prisma.staffAdvance.findMany(),
      this.prisma.expenseCategory.findMany(),
      this.prisma.expense.findMany(),
      this.prisma.auditLog.findMany({ take: 500, orderBy: { changedAt: 'desc' } }),
    ]);

    const backupData = {
      system: 'The Grand Horizon Hotel Management OS',
      theme: 'Royal Burgundy & Pearl Luxury',
      version: '2.0.0',
      exportTimestamp: new Date().toISOString(),
      generationTimeMs: Date.now() - start,
      database: {
        provider: 'Serverless PostgreSQL',
        databaseName: 'hotel_radha_palace_db',
      },
      summary: {
        hotelSettingsCount: settings.length,
        roomTypesCount: roomTypes.length,
        roomsCount: rooms.length,
        guestsCount: guests.length,
        guestDocumentsCount: guestDocuments.length,
        bookingsCount: bookings.length,
        bookingGuestsCount: bookingGuests.length,
        itemCategoriesCount: itemCategories.length,
        itemsCatalogCount: items.length,
        bookingItemsCount: bookingItems.length,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
        staffCount: staff.length,
        attendanceRecordsCount: attendances.length,
        salaryRecordsCount: salaryRecords.length,
        salaryPaymentsCount: salaryPayments.length,
        staffAdvancesCount: staffAdvances.length,
        expenseCategoriesCount: expenseCategories.length,
        expensesCount: expenses.length,
        auditLogsCount: auditLogs.length,
      },
      records: {
        settings,
        roomTypes,
        rooms,
        guests,
        guestDocuments,
        bookings,
        bookingGuests,
        itemCategories,
        items,
        bookingItems,
        invoices,
        payments,
        staff,
        attendances,
        salaryRecords,
        salaryPayments,
        staffAdvances,
        expenseCategories,
        expenses,
        auditLogs,
      },
    };

    // Log the backup activity into Audit Logs
    await this.prisma.auditLog.create({
      data: {
        entityType: 'SETTINGS',
        entityId: 'backup',
        action: 'CREATE',
        description: `Full database snapshot backup generated with ${Object.values(backupData.summary).reduce((a, b) => a + b, 0)} total records`,
        newValues: backupData.summary,
      },
    });

    return backupData;
  }
}
