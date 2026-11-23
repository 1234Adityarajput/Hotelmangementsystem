import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateHotelSettingDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.hotelSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        hotelName: 'Grand Horizon Hotel',
        hotelAddress: '100 Beach Road, Civil Lines',
        mobileNumber: '+91 9876543210',
        email: 'info@grandhorizon.com',
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
        provider: 'Neon Serverless PostgreSQL 16+',
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
        strategy: 'Continuous Neon Write-Ahead Log (WAL) & Branch Snapshots',
        pointInTimeRecovery: 'Enabled',
        automatedDailyRetention: 'Configured via Neon Cloud Console',
      },
    };
  }
}
