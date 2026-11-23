import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { BillingService } from './billing.service';

@Module({
  controllers: [InvoicesController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
