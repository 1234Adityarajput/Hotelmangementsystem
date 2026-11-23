import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth() {
    const dbStatus = await this.prisma.isDatabaseConnected();
    const nodeEnv = this.configService.get<string>('app.nodeEnv', 'development');
    const port = this.configService.get<number>('app.port', 4000);

    return {
      status: 'ok',
      service: 'hotel-management-backend',
      version: '1.0.0',
      environment: nodeEnv,
      port,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        configured: Boolean(
          process.env.DATABASE_URL &&
            !process.env.DATABASE_URL.includes('user:password@localhost:5432'),
        ),
        provider: 'postgresql',
        connected: dbStatus.connected,
        message: dbStatus.message,
        ...(dbStatus.latencyMs !== undefined && { latencyMs: dbStatus.latencyMs }),
      },
      system: {
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }
}
