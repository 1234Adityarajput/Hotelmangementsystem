import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type RegisterType =
  | 'guests'
  | 'rooms'
  | 'bookings'
  | 'arrivals'
  | 'inhouse'
  | 'departures'
  | 'items'
  | 'invoices'
  | 'payments'
  | 'staff'
  | 'attendance'
  | 'advances'
  | 'salaries'
  | 'expenses';

export class QueryRegisterDto {
  @ApiProperty({
    enum: [
      'guests',
      'rooms',
      'bookings',
      'arrivals',
      'inhouse',
      'departures',
      'items',
      'invoices',
      'payments',
      'staff',
      'attendance',
      'advances',
      'salaries',
      'expenses',
    ],
    example: 'bookings',
    description: 'Target digital register name',
  })
  @IsEnum([
    'guests',
    'rooms',
    'bookings',
    'arrivals',
    'inhouse',
    'departures',
    'items',
    'invoices',
    'payments',
    'staff',
    'attendance',
    'advances',
    'salaries',
    'expenses',
  ])
  type: RegisterType;

  @ApiPropertyOptional({ description: 'Text search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
