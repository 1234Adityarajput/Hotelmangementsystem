import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password@localhost:5432')) {
      this.logger.warn('DATABASE_URL is not configured or using default placeholder. Skipping immediate DB connect.');
      return;
    }
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database successfully.');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database on startup:', error);
    }
  }

  async isDatabaseConnected(): Promise<{ connected: boolean; message: string; latencyMs?: number }> {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password@localhost:5432')) {
      return {
        connected: false,
        message: 'DATABASE_URL is using placeholder credentials. Neon PostgreSQL credentials pending.',
      };
    }

    const start = Date.now();
    try {
      // Execute a real SQL ping query to verify connection
      await this.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return {
        connected: true,
        message: 'Successfully connected and verified PostgreSQL database.',
        latencyMs,
      };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown database error';
      return {
        connected: false,
        message: `Database connection error: ${errMessage}`,
      };
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database.');
  }
}
