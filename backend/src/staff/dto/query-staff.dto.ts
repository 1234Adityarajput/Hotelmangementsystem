import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStaffDto {
  @ApiPropertyOptional({ description: 'Search by employee code, name, mobile, email or designation' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED'],
    description: 'Filter by employment status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED'])
  employmentStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'RESIGNED';

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
