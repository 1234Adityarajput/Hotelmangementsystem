import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { QueryGuestDto } from './dto/query-guest.dto';
import { CreateGuestDocumentDto } from './dto/create-document.dto';

@ApiTags('Guest Management')
@ApiBearerAuth('JWT-auth')
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  @ApiOperation({ summary: 'List guests with search, pagination and filtering' })
  async findAll(@Query() query: QueryGuestDto) {
    return this.guestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single guest details with stay history and documents' })
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new guest' })
  async create(@Body() dto: CreateGuestDto) {
    return this.guestsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update guest details' })
  async update(@Param('id') id: string, @Body() dto: UpdateGuestDto) {
    return this.guestsService.update(id, dto);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload/register an identity document reference for a guest' })
  async addDocument(@Param('id') id: string, @Body() dto: CreateGuestDocumentDto) {
    return this.guestsService.addDocument(id, dto);
  }

  @Delete(':id/documents/:docId')
  @ApiOperation({ summary: 'Delete a guest document reference' })
  async deleteDocument(@Param('id') id: string, @Param('docId') docId: string) {
    return this.guestsService.deleteDocument(id, docId);
  }
}
