import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CheckInCheckOutController } from './check-in-out.controller';
import { CheckInCheckOutService } from './check-in-out.service';

@Module({
  controllers: [BookingsController, CheckInCheckOutController],
  providers: [BookingsService, CheckInCheckOutService],
  exports: [BookingsService, CheckInCheckOutService],
})
export class BookingsModule {}
