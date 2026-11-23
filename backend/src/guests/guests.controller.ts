import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto, AdditionalGuestDto } from './dto/create-guest.dto';
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
  @ApiOperation({ summary: 'Get single guest details with stay history, documents, and co-guests' })
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new guest with primary ID proof, party size, and companions' })
  async create(@Body() dto: CreateGuestDto) {
    return this.guestsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update guest details, ID proofs, and companions' })
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

  @Post(':id/co-guests')
  @ApiOperation({ summary: 'Add an additional guest / companion to a registered guest' })
  async addCoGuest(@Param('id') id: string, @Body() dto: AdditionalGuestDto) {
    return this.guestsService.addCoGuest(id, dto);
  }

  @Delete(':id/co-guests/:coGuestId')
  @ApiOperation({ summary: 'Remove a companion / co-guest' })
  async deleteCoGuest(@Param('id') id: string, @Param('coGuestId') coGuestId: string) {
    return this.guestsService.deleteCoGuest(id, coGuestId);
  }
}
