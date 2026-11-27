import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { QuickPostChargeDto } from './dto/quick-post-charge.dto';

@ApiTags('Invoices & Billing')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly billingService: BillingService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get monthly billing and invoice history including active and deleted records' })
  async getHistory(@Query('month') month?: string, @Query('year') year?: string) {
    return this.billingService.getHistory(month, year);
  }

  @Get('active-folios')
  @ApiOperation({ summary: 'List all active guest folios with live automatic billing calculations' })
  async getActiveFolios(@Query('search') search?: string) {
    return this.billingService.getActiveFolios(search);
  }

  @Get('live/:bookingId')
  @ApiOperation({ summary: 'Get live real-time automatic billing calculation and breakdown for a guest booking' })
  async getLiveBillingFolio(
    @Param('bookingId') bookingId: string,
    @Query('taxPercentage') taxPercentage?: string,
  ) {
    const tax = taxPercentage !== undefined ? Number(taxPercentage) : undefined;
    return this.billingService.getLiveBillingFolio(bookingId, tax);
  }

  @Post('quick-post-charge')
  @ApiOperation({ summary: 'Quick post an item or service charge and automatically update guest billing' })
  async quickPostCharge(@Body() dto: QuickPostChargeDto) {
    return this.billingService.quickPostCharge(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all invoices with filters, guest details and status' })
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.billingService.findAll(query);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all invoices for a given booking' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.billingService.findByBooking(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full invoice breakdown including payments and room charges' })
  async findOne(@Param('id') id: string) {
    if (id === 'active-folios') {
      return this.billingService.getActiveFolios();
    }
    return this.billingService.findOne(id);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice or folio charge with permanent audit preservation' })
  async remove(@Param('id') id: string) {
    return this.billingService.remove(id);
  }
}
