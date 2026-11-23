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

export class RecordSalaryPaymentDto {
  @ApiProperty({ example: 'salary-record-uuid', description: 'Salary Record ID' })
  @IsString()
  @IsNotEmpty({ message: 'Salary Record ID is required' })
  salaryRecordId: string;

  @ApiProperty({ example: 20000.00, description: 'Disbursement amount' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Payment amount must be greater than 0' })
  paymentAmount: number;

  @ApiProperty({
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
    example: 'BANK_TRANSFER',
    description: 'Disbursement channel',
  })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'], {
    message: 'Invalid payment method',
  })
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiProperty({ example: '2026-11-23', description: 'Disbursement date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Payment date is required' })
  paymentDate: string;

  @ApiPropertyOptional({ example: 'NEFT-AXIS-992384', description: 'Bank transaction ID' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'November salary disbursed via corporate NEFT', description: 'Remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
