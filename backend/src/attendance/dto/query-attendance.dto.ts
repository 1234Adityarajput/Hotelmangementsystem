import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttendanceDto {
  @ApiPropertyOptional({ description: 'Filter by staff UUID' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ description: 'Specific date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Start date for range (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for range (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'])
  status?: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';

  @ApiPropertyOptional({ description: 'Filter by staff department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 31, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 31;
}
