import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings with pagination, status and search filters' })
  async findAll(@Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details including guests, items, invoices and payments' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new room reservation' })
  async create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking details' })
  async update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.bookingsService.cancel(id, reason);
  }
}
