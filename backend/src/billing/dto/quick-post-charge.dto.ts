import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickPostChargeDto {
  @ApiProperty({ description: 'Booking UUID' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({ description: 'Catalog Item UUID if selected' })
  @IsString()
  @IsOptional()
  itemId?: string;

  @ApiProperty({ description: 'Item or Service Name', example: 'Club Sandwich & Fresh Juice' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({
    description: 'Component Category: Food & Beverage, Laundry, Room Service, Extra Bed, Other Services, Additional Items',
    example: 'Food & Beverage',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Unit Price in INR', example: 350.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Quantity', example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Notes or Instructions' })
  @IsString()
  @IsOptional()
  notes?: string;
}
