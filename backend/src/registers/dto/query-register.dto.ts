import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type RegisterType =
  | 'guests'
  | 'check-ins'
  | 'check-outs'
  | 'rooms'
  | 'billing'
  | 'payments'
  | 'cash-book'
  | 'services'
  | 'staff'
  | 'attendance'
  | 'salaries'
  | 'expenses'
  | 'business'
  // Backward-compatible aliases
  | 'bookings'
  | 'arrivals'
  | 'inhouse'
  | 'departures'
  | 'items'
  | 'invoices'
  | 'advances';

export class QueryRegisterDto {
  @ApiProperty({
    enum: [
      'guests',
      'check-ins',
      'check-outs',
      'rooms',
      'billing',
      'payments',
      'cash-book',
      'services',
      'staff',
      'attendance',
      'salaries',
      'expenses',
      'business',
      'bookings',
      'arrivals',
      'inhouse',
      'departures',
      'items',
      'invoices',
      'advances',
    ],
    example: 'check-ins',
    description: 'Target digital register name (13 Core Hotel Registers)',
  })
  @IsEnum([
    'guests',
    'check-ins',
    'check-outs',
    'rooms',
    'billing',
    'payments',
    'cash-book',
    'services',
    'staff',
    'attendance',
    'salaries',
    'expenses',
    'business',
    'bookings',
    'arrivals',
    'inhouse',
    'departures',
    'items',
    'invoices',
    'advances',
  ])
  type: RegisterType;

  @ApiPropertyOptional({ description: 'Text search query (name, code, reference, mobile)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by specific room number' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

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
