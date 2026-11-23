import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBookingDto {
  @ApiPropertyOptional({ enum: ['RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] })
  @IsEnum(['RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'])
  @IsOptional()
  status?: 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Filter by room ID' })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter by guest ID' })
  @IsString()
  @IsOptional()
  guestId?: string;

  @ApiPropertyOptional({ description: 'Search booking number or guest name/mobile' })
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
