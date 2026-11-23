import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@ApiTags('Room Types')
@ApiBearerAuth('JWT-auth')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all room types with room counts' })
  async findAll() {
    return this.roomTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single room type details' })
  async findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new room type' })
  async create(@Body() dto: CreateRoomTypeDto) {
    return this.roomTypesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room type details' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete room type if unused' })
  async remove(@Param('id') id: string) {
    return this.roomTypesService.remove(id);
  }
}
