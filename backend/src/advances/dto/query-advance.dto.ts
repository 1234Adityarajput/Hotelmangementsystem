import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAdvanceDto {
  @ApiPropertyOptional({ description: 'Filter by staff UUID' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'PARTIALLY_REPAID', 'REPAID', 'WAIVED'],
    description: 'Filter by repayment status',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PARTIALLY_REPAID', 'REPAID', 'WAIVED'])
  status?: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID' | 'WAIVED';

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

  @ApiPropertyOptional({ default: 15, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;
}
