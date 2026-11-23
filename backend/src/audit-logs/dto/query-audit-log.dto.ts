import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. BOOKING, GUEST, ROOM, STAFF, PAYROLL)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    enum: ['CREATE', 'UPDATE', 'DELETE', 'FINALIZE', 'CANCEL', 'CORRECTION'],
    description: 'Filter by action type',
  })
  @IsOptional()
  @IsEnum(['CREATE', 'UPDATE', 'DELETE', 'FINALIZE', 'CANCEL', 'CORRECTION'])
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'FINALIZE' | 'CANCEL' | 'CORRECTION';

  @ApiPropertyOptional({ description: 'Specific entity UUID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Text search in description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;
}
