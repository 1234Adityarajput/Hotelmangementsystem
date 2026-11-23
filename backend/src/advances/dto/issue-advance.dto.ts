import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IssueAdvanceDto {
  @ApiProperty({ example: 'staff-uuid-1234', description: 'Staff member UUID' })
  @IsString()
  @IsNotEmpty({ message: 'Staff ID is required' })
  staffId: string;

  @ApiProperty({ example: 5000.00, description: 'Advance amount in INR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Advance amount must be greater than 0' })
  amount: number;

  @ApiProperty({ example: '2026-11-23', description: 'Date of advance disbursement (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Advance date is required' })
  advanceDate: string;

  @ApiProperty({
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
    example: 'CASH',
    description: 'Disbursement payment method',
  })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'], {
    message: 'Invalid payment method',
  })
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiPropertyOptional({ example: 'Emergency medical advance requested by staff', description: 'Reason or notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
