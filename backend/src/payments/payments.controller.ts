import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Payments Management')
@ApiBearerAuth('JWT-auth')
@Roles('OWNER', 'MANAGER')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated payment statistics and channel breakdown' })
  async getStats() {
    return this.paymentsService.getStats();
  }

  @Get('pending')
  @ApiOperation({ summary: 'List all pending payments and active folios with outstanding balance' })
  async getPendingPayments() {
    return this.paymentsService.getPendingPayments();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get monthly payments history and archived records' })
  async getHistory(@Query('month') month?: string, @Query('year') year?: string) {
    return this.paymentsService.getHistory(month, year);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments with filters for method, status, booking or invoice' })
  async findAll(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single payment details' })
  async findOne(@Param('id') id: string) {
    if (id === 'stats') {
      return this.paymentsService.getStats();
    }
    if (id === 'pending') {
      return this.paymentsService.getPendingPayments();
    }
    if (id === 'history') {
      return this.paymentsService.getHistory();
    }
    return this.paymentsService.findOne(id);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'List payments for a specific booking' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new payment (Advance, Partial, Final) and update invoice balance' })
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.paymentsService.recordPayment(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Safely delete payment, adjust balances, and archive in audit log' })
  async remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
