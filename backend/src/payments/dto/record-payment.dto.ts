import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ example: 'uuid-of-invoice' })
  @IsString()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ enum: ['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND'], default: 'PARTIAL' })
  @IsEnum(['ADVANCE', 'PARTIAL', 'FINAL', 'REFUND'])
  paymentType: 'ADVANCE' | 'PARTIAL' | 'FINAL' | 'REFUND';

  @ApiProperty({ enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'], default: 'CASH' })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'])
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiProperty({ example: 2500.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'UPI-9876543210' })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiPropertyOptional({ example: '2026-12-05' })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Paid via GPay at front desk' })
  @IsString()
  @IsOptional()
  notes?: string;
}
