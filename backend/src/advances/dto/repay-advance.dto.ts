import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RepayAdvanceDto {
  @ApiProperty({ example: 2500.00, description: 'Repayment / recovery amount' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Repayment amount must be positive' })
  amount: number;

  @ApiPropertyOptional({ example: 'Cash returned by employee', description: 'Repayment remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
