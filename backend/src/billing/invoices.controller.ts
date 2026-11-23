import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@ApiTags('Invoices & Billing')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices with filters, guest details and status' })
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.billingService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full invoice breakdown including payments and room charges' })
  async findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all invoices for a given booking' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.billingService.findByBooking(bookingId);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate and finalize checkout invoice with tax and discount' })
  async generateInvoice(@Body() dto: GenerateInvoiceDto) {
    return this.billingService.generateInvoice(dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an unpaid or draft invoice' })
  async cancelInvoice(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.billingService.cancelInvoice(id, reason);
  }
}
