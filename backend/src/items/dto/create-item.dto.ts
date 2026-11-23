import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Club Sandwich' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Toasted triple-decker sandwich with fries' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 350.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
