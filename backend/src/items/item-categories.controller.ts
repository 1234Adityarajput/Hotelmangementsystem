import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemCategoryDto } from './dto/create-category.dto';
import { UpdateItemCategoryDto } from './dto/update-category.dto';

@ApiTags('Item Categories')
@ApiBearerAuth('JWT-auth')
@Controller('item-categories')
export class ItemCategoriesController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all item categories' })
  async findAll() {
    return this.itemsService.findAllCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create new item category' })
  async create(@Body() dto: CreateItemCategoryDto) {
    return this.itemsService.createCategory(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update item category' })
  async update(@Param('id') id: string, @Body() dto: UpdateItemCategoryDto) {
    return this.itemsService.updateCategory(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete empty item category' })
  async delete(@Param('id') id: string) {
    return this.itemsService.deleteCategory(id);
  }
}
