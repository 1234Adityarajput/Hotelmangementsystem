import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingItemDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ example: 'uuid-of-catalog-item' })
  @IsString()
  @IsOptional()
  itemId?: string;

  @ApiProperty({ example: 'Club Sandwich', description: 'Snapshot name of item/service' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 2, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 350.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Delivered to room 102' })
  @IsString()
  @IsOptional()
  notes?: string;
}
