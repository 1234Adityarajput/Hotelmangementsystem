import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { GenerateAllPayrollDto } from './dto/generate-all-payroll.dto';
import { RecordSalaryPaymentDto } from './dto/record-salary-payment.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';

@ApiTags('Payroll & Salary')
@ApiBearerAuth('JWT-auth')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get payroll financial totals and status metrics' })
  async getStats(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.payrollService.getStats(month, year);
  }

  @Get()
  @ApiOperation({ summary: 'List payroll slips with month, year, staff, and status filters' })
  async findAll(@Query() query: QueryPayrollDto) {
    return this.payrollService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single salary record with payment history and breakdown' })
  async findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate monthly payroll slip for an employee' })
  @ApiResponse({ status: 201, description: 'Payroll slip generated successfully' })
  async generatePayroll(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(dto);
  }

  @Post('generate-all')
  @ApiOperation({ summary: 'Bulk calculate & generate payroll for all active employees for the month' })
  @ApiResponse({ status: 201, description: 'Bulk payroll calculated successfully' })
  async generateAllPayroll(@Body() dto: GenerateAllPayrollDto) {
    return this.payrollService.generateAllPayroll(dto);
  }

  @Post('disburse')
  @ApiOperation({ summary: 'Record partial or full salary disbursement' })
  @ApiResponse({ status: 201, description: 'Salary payment recorded successfully' })
  async recordSalaryPayment(@Body() dto: RecordSalaryPaymentDto) {
    return this.payrollService.recordSalaryPayment(dto);
  }
}
