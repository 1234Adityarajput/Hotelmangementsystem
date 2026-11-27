import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateHotelSettingDto } from './dto/update-settings.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface ReceiptDesignConfig {
  hotelName: string;
  tagline: string;
  logoUrl: string;
  showLogo: boolean;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  panNumber: string;
  fssaiNumber: string;
  state: string;
  stateCode: string;

  // Visual Theme & Typography
  themeColor: string;
  accentColor: string;
  headerStyle: 'MODERN_SPLIT' | 'CLASSIC_CENTERED' | 'MINIMAL_EXECUTIVE';
  fontFamily: 'SERIF' | 'SANS' | 'MONO';
  showBorderAccent: boolean;
  watermarkText: string;

  // Document Titles
  folioTitle: string;
  invoiceTitle: string;
  receiptNumberPrefix: string;

  // Feature Toggles
  showGstBreakdown: boolean;
  showItemizedServices: boolean;
  showPaymentHistory: boolean;
  showCheckInOutTimings: boolean;
  checkInTime: string;
  checkOutTime: string;

  // Digital Payment & UPI QR
  showUpiQrCode: boolean;
  upiId: string;
  bankAccountDetails: string;

  // Signatory & Stamp
  showSignatory: boolean;
  signatoryTitle: string;
  signatoryDepartment: string;

  // Terms & Conditions
  termsAndConditions: string;
  thankYouMessage: string;
  customNotes: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly receiptDesignPath = path.resolve(process.cwd(), 'receipt-design.json');

  constructor(private readonly prisma: PrismaService) { }

  getDefaultReceiptDesign(): ReceiptDesignConfig {
    return {
      hotelName: 'Hotel Radha Palace',
      tagline: 'Boutique Luxury Hospitality Management • Official Stay Folio',
      logoUrl: '/radha-krishna-logo.jpg',
      showLogo: true,
      address: '108 Heritage Boulevard, Civil Lines, New Delhi, India - 110054',
      phone: '+91 98765 43210',
      email: 'reservations@hotelradhapalace.com',
      website: 'www.hotelradhapalace.com',
      gstin: '07AAAAA0000A1Z5',
      panNumber: 'AAAAA0000A',
      fssaiNumber: '10019011000123',
      state: 'Delhi',
      stateCode: '07',

      themeColor: '#59283A',
      accentColor: '#C4A06A',
      headerStyle: 'MODERN_SPLIT',
      fontFamily: 'SERIF',
      showBorderAccent: true,
      watermarkText: '',

      folioTitle: 'OFFICIAL GUEST STAY FOLIO & BILL',
      invoiceTitle: 'TAX INVOICE & GST BILL',
      receiptNumberPrefix: 'HRP',

      showGstBreakdown: true,
      showItemizedServices: true,
      showPaymentHistory: true,
      showCheckInOutTimings: true,
      checkInTime: '12:00 PM',
      checkOutTime: '11:00 AM',

      showUpiQrCode: false,
      upiId: '',
      bankAccountDetails: '',

      showSignatory: true,
      signatoryTitle: 'Authorized Signatory',
      signatoryDepartment: 'Front Office & Accounts',

      termsAndConditions: '1. All guests must provide valid photo ID upon check-in.\n2. Room charges are non-refundable after standard cancellation period.\n3. Goods & Services Tax (GST) charged as per applicable Govt. of India rules.\n4. Any damage to hotel property will be charged to the guest.\n5. Disputes are subject to local jurisdiction.',
      thankYouMessage: 'Thank you for choosing Hotel Radha Palace. We look forward to welcoming you again!',
      customNotes: 'Computer generated bill. No signature required if electronically verified.',
    };
  }

  async getReceiptDesign(): Promise<ReceiptDesignConfig> {
    const defaults = this.getDefaultReceiptDesign();

    try {
      if (fs.existsSync(this.receiptDesignPath)) {
        const fileContent = fs.readFileSync(this.receiptDesignPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        return { ...defaults, ...parsed };
      }
    } catch (err: any) {
      this.logger.warn(`Could not read receipt design file: ${err.message}. Using defaults.`);
    }

    // Try syncing basic hotel info from hotelSetting if available
    try {
      const hotelSetting = await this.prisma.hotelSetting.findUnique({ where: { id: 'default' } });
      if (hotelSetting) {
        if (hotelSetting.hotelName) defaults.hotelName = hotelSetting.hotelName;
        if (hotelSetting.hotelAddress) defaults.address = hotelSetting.hotelAddress;
        if (hotelSetting.mobileNumber) defaults.phone = hotelSetting.mobileNumber;
        if (hotelSetting.email) defaults.email = hotelSetting.email;
        if (hotelSetting.defaultCheckInTime) defaults.checkInTime = hotelSetting.defaultCheckInTime;
        if (hotelSetting.defaultCheckOutTime) defaults.checkOutTime = hotelSetting.defaultCheckOutTime;
        if (hotelSetting.logoFileReference) defaults.logoUrl = hotelSetting.logoFileReference;
      }
    } catch (err: any) {
      this.logger.debug(`Could not read hotelSetting for defaults: ${err.message}`);
    }

    return defaults;
  }

  async updateReceiptDesign(data: Partial<ReceiptDesignConfig>): Promise<ReceiptDesignConfig> {
    const current = await this.getReceiptDesign();
    const updated: ReceiptDesignConfig = {
      ...current,
      ...data,
    };

    try {
      fs.writeFileSync(this.receiptDesignPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to write receipt-design.json: ${err.message}`);
    }

    // Also sync basic hotel settings into prisma
    try {
      await this.prisma.hotelSetting.upsert({
        where: { id: 'default' },
        update: {
          hotelName: updated.hotelName,
          hotelAddress: updated.address,
          mobileNumber: updated.phone,
          email: updated.email,
          defaultCheckInTime: updated.checkInTime,
          defaultCheckOutTime: updated.checkOutTime,
          logoFileReference: updated.logoUrl,
        },
        create: {
          id: 'default',
          hotelName: updated.hotelName,
          hotelAddress: updated.address,
          mobileNumber: updated.phone,
          email: updated.email,
          currencyCode: 'INR',
          timezone: 'Asia/Kolkata',
          defaultCheckInTime: updated.checkInTime,
          defaultCheckOutTime: updated.checkOutTime,
          logoFileReference: updated.logoUrl,
          taxEnabled: true,
          defaultTaxPercentage: 12.0,
          defaultSalaryDays: 30,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'RECEIPT_DESIGN',
          entityId: 'default',
          action: 'UPDATE',
          description: `Customized receipt & invoice layout design: theme=${updated.themeColor}, style=${updated.headerStyle}`,
          newValues: {
            themeColor: updated.themeColor,
            headerStyle: updated.headerStyle,
            hotelName: updated.hotelName,
            folioTitle: updated.folioTitle,
            invoiceTitle: updated.invoiceTitle,
          },
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not sync receipt design to hotelSetting: ${err.message}`);
    }

    return updated;
  }

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
