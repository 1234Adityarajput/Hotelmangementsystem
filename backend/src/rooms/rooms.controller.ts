import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { QueryRoomDto } from './dto/query-room.dto';

@ApiTags('Room Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List rooms with status, floor and type filters' })
  async findAll(@Query() query: QueryRoomDto) {
    return this.roomsService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Find available rooms for a given date range or current moment' })
  async findAvailable(
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    return this.roomsService.findAvailable(checkIn, checkOut, roomTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single room details' })
  async findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new room to inventory' })
  async create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room information' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update room status (AVAILABLE, OCCUPIED, MAINTENANCE)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE',
  ) {
    return this.roomsService.updateStatus(id, status);
  }

  @Patch(':id/price')
  @ApiOperation({ summary: 'Update room price per night' })
  async updatePrice(
    @Param('id') id: string,
    @Body('pricePerNight') pricePerNight: number,
  ) {
    return this.roomsService.updatePrice(id, pricePerNight);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a room' })
  async remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
