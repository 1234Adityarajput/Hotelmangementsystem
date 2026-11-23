import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateInvoiceDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ enum: ['PERCENTAGE', 'FIXED'], default: null })
  @IsEnum(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ example: 10.00, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ example: 12.00, description: 'Tax percentage (defaults to hotel settings if not passed)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxPercentage?: number;

  @ApiPropertyOptional({ example: '2026-12-05' })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;
}
