import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PerformCheckOutDto {
  @ApiPropertyOptional({ example: '11:00 AM' })
  @IsString()
  @IsOptional()
  actualCheckOutTime?: string;

  @ApiPropertyOptional({ enum: ['PERCENTAGE', 'FIXED'] })
  @IsEnum(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ example: 12.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPercentage?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharges?: number;

  @ApiPropertyOptional({ example: 'CASH', enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'] })
  @IsString()
  @IsOptional()
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiPropertyOptional({ example: 2500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({ example: 'Settled at front desk checkout' })
  @IsString()
  @IsOptional()
  notes?: string;
}
