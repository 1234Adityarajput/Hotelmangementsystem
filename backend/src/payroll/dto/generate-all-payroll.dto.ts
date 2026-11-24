import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateAllPayrollDto {
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

  @ApiPropertyOptional({ example: 'ALL', description: 'Department filter or ALL' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: true, description: 'Auto-deduct outstanding staff advances' })
  @IsOptional()
  @IsBoolean()
  autoDeductAdvances?: boolean = true;
}
