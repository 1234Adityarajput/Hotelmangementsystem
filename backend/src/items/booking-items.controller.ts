import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateBookingItemDto } from './dto/create-booking-item.dto';

@ApiTags('Booking Items & Orders')
@ApiBearerAuth('JWT-auth')
@Controller('booking-items')
export class BookingItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all guest item purchase records with guest name, room number, item, price and date' })
  async findAllGuestItemRecords(
    @Query('search') search?: string,
    @Query('bookingId') bookingId?: string,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.itemsService.findAllGuestItemRecords({
      search,
      bookingId,
      date,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'List all items and services ordered for a booking' })
  async findBookingItems(@Param('bookingId') bookingId: string) {
    return this.itemsService.findBookingItems(bookingId);
  }

  @Post()
  @ApiOperation({ summary: 'Add an item or service charge to a booking' })
  async addBookingItem(@Body() dto: CreateBookingItemDto) {
    return this.itemsService.addBookingItem(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a booking item' })
  async deleteBookingItem(@Param('id') id: string) {
    return this.itemsService.deleteBookingItem(id);
  }
}
