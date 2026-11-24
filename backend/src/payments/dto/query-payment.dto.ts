import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPaymentDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
  @IsOptional()
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

  @ApiPropertyOptional({ enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'] })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'])
  @IsOptional()
  method?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiPropertyOptional({ enum: ['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND'] })
  @IsEnum(['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND'])
  @IsOptional()
  type?: 'ADVANCE' | 'PARTIAL' | 'FINAL' | 'REFUND';

  @ApiPropertyOptional({ description: 'Search by reference, UTR, guest name, mobile or room' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Filter by invoice ID' })
  @IsString()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
