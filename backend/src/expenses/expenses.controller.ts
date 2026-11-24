import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-category.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Expense Management')
@ApiBearerAuth('JWT-auth')
@Roles('OWNER')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated today, month, year expenses and category breakdown' })
  async getStats() {
    return this.expensesService.getStats();
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all expense categories' })
  async findAllCategories() {
    return this.expensesService.findAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new expense category' })
  async createCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.expensesService.createCategory(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List operational expenses with category and date filters' })
  async findAll(@Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense details' })
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new operational hotel expense' })
  @ApiResponse({ status: 201, description: 'Expense recorded successfully' })
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing expense entry' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense entry' })
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
