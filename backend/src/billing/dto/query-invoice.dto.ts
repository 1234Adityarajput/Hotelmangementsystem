import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInvoiceDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'] })
  @IsEnum(['DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'])
  @IsOptional()
  status?: 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Search invoice number or guest name' })
  @IsString()
  @IsOptional()
  search?: string;

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
