import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Kitchen & Dining Supplies', description: 'Category title' })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Groceries, dairy, spices, and cooking gas', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
