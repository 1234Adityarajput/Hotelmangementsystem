import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePayrollDto {
  @ApiProperty({ example: 'staff-uuid-1234', description: 'Staff member UUID' })
  @IsString()
  @IsNotEmpty({ message: 'Staff ID is required' })
  staffId: string;

  @ApiProperty({ example: 11, description: 'Payroll Month (1-12)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  payrollMonth: number;

  @ApiProperty({ example: 2026, description: 'Payroll Year (2000-2100)' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  payrollYear: number;

  @ApiPropertyOptional({ example: 30, description: 'Configured salary days in month (default 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(31)
  configuredSalaryDays?: number = 30;

  @ApiPropertyOptional({ example: 26, description: 'Override payable days (leave empty for automatic attendance calculation)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  payableDays?: number;

  @ApiPropertyOptional({ example: 0, description: 'Additional manual deductions (e.g. tax, penalties)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deductions?: number = 0;

  @ApiPropertyOptional({ example: 1000, description: 'Advance deduction from outstanding balance' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  advanceDeductions?: number = 0;

  @ApiPropertyOptional({ example: 'staff-advance-uuid', description: 'Specific advance record ID to deduct from' })
  @IsOptional()
  @IsString()
  staffAdvanceId?: string;

  @ApiPropertyOptional({ example: 8, description: 'Manual override for overtime hours' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeHours?: number;

  @ApiPropertyOptional({ example: 'Approved monthly salary calculation', description: 'Internal payroll notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
