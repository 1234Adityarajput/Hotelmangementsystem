import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRoomDto {
  @ApiPropertyOptional({ description: 'Filter by room status', enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] })
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'])
  @IsOptional()
  status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

  @ApiPropertyOptional({ description: 'Filter by Room Type ID' })
  @IsString()
  @IsOptional()
  roomTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by Floor' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({ description: 'Search room number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
