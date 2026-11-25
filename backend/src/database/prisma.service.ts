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

      // Synchronize database trigger function to allow cascading guest deletions
      try {
        await this.$executeRawUnsafe(`
          CREATE OR REPLACE FUNCTION protect_primary_booking_guest()
          RETURNS TRIGGER AS $$
          DECLARE
            v_booking_primary_guest text;
          BEGIN
            IF pg_trigger_depth() > 1 OR current_setting('hotel.allow_guest_delete', true) = 'on' THEN
              IF (TG_OP = 'DELETE') THEN
                RETURN OLD;
              ELSE
                RETURN NEW;
              END IF;
            END IF;

            IF (TG_OP = 'DELETE') THEN
              SELECT "primary_guest_id" INTO v_booking_primary_guest
              FROM "bookings" WHERE "id" = OLD."booking_id";

              IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
                RAISE EXCEPTION 'Cannot delete primary guest record (guest %) for booking %: This guest is currently designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
              END IF;
              RETURN OLD;
            END IF;

            IF (TG_OP = 'INSERT') THEN
              IF NEW."is_primary_guest" = true THEN
                SELECT "primary_guest_id" INTO v_booking_primary_guest
                FROM "bookings" WHERE "id" = NEW."booking_id";

                IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
                  RAISE EXCEPTION 'Cannot set guest % as primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
                END IF;
              END IF;
              RETURN NEW;
            END IF;

            IF (TG_OP = 'UPDATE') THEN
              SELECT "primary_guest_id" INTO v_booking_primary_guest
              FROM "bookings" WHERE "id" = NEW."booking_id";

              IF OLD."is_primary_guest" = true AND NEW."is_primary_guest" = false THEN
                IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
                  RAISE EXCEPTION 'Cannot demote primary guest % for booking %: This guest is designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
                END IF;
              END IF;

              IF NEW."is_primary_guest" = true THEN
                IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
                  RAISE EXCEPTION 'Cannot promote guest % to primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
                END IF;
              END IF;

              RETURN NEW;
            END IF;

            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);
        this.logger.log('Database trigger protect_primary_booking_guest synchronized successfully.');
      } catch (triggerError) {
        this.logger.warn('Could not auto-sync protect_primary_booking_guest trigger:', triggerError);
      }
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database on startup:', error);
    }
  }

  async isDatabaseConnected(): Promise<{ connected: boolean; message: string; latencyMs?: number }> {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password@localhost:5432')) {
      return {
        connected: false,
        message: 'DATABASE_URL is using placeholder credentials. PostgreSQL credentials pending.',
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
