import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@ApiTags('Items Catalog')
@ApiBearerAuth('JWT-auth')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List catalog items with category and search filter' })
  async findAll(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.itemsService.findAllItems(categoryId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item details' })
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOneItem(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new catalog item' })
  async create(@Body() dto: CreateItemDto) {
    return this.itemsService.createItem(dto);
  }

  @Patch(':id/price')
  @ApiOperation({ summary: 'Quick set or update item/service price' })
  async updatePrice(@Param('id') id: string, @Body('price') price: number) {
    return this.itemsService.updatePrice(id, Number(price));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update catalog item' })
  async update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.updateItem(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate catalog item' })
  async delete(@Param('id') id: string) {
    return this.itemsService.deleteItem(id);
  }
}
