import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-primary-guest' })
  @IsString()
  @IsNotEmpty()
  primaryGuestId: string;

  @ApiProperty({ example: 'uuid-of-room' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @ApiPropertyOptional({ example: '12:00 PM' })
  @IsString()
  @IsOptional()
  checkInTime?: string;

  @ApiProperty({ example: '2026-12-05' })
  @IsDateString()
  @IsNotEmpty()
  expectedCheckOutDate: string;

  @ApiPropertyOptional({ example: '11:00 AM' })
  @IsString()
  @IsOptional()
  expectedCheckOutTime?: string;

  @ApiPropertyOptional({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfNights?: number;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  numberOfGuests?: number;

  @ApiPropertyOptional({ example: 2500.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  roomRatePerNight?: number;

  @ApiPropertyOptional({ example: 1000.00, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  advanceAmount?: number;

  @ApiPropertyOptional({ example: 'CASH', enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'] })
  @IsString()
  @IsOptional()
  advancePaymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiPropertyOptional({ example: 'Late check-in requested' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['uuid-of-co-guest-1'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coGuestIds?: string[];
}
