import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@ApiTags('Payments Management')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments with filters for method, status, booking or invoice' })
  async findAll(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single payment details' })
  async findOne(@Param('id') id: string) {
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
}
