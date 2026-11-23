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

export class CreateExpenseDto {
  @ApiProperty({ example: 'expense-category-uuid', description: 'Expense category ID' })
  @IsString()
  @IsNotEmpty({ message: 'Category ID is required' })
  expenseCategoryId: string;

  @ApiProperty({ example: 'Vegetable & Dairy supplies for hotel restaurant', description: 'Expense description' })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({ example: 4500.00, description: 'Expense amount in INR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'],
    example: 'UPI',
    description: 'Payment method used',
  })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER'], {
    message: 'Invalid payment method',
  })
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

  @ApiProperty({ example: '2026-11-23', description: 'Expense payment date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Payment date is required' })
  paymentDate: string;

  @ApiPropertyOptional({ example: 'UPI-REF-9923841', description: 'Transaction reference or bill number' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'Purchased from City Fresh Mart', description: 'Remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
