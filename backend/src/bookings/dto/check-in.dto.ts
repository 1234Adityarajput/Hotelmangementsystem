import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PerformCheckInDto {
  @ApiPropertyOptional({ example: '12:30 PM' })
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional({ example: 'CASH', enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'] })
  @IsString()
  @IsOptional()
  advancePaymentMethod?: string;
}
