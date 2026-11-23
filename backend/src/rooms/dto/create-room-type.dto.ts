import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Suite' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Spacious suite with balcony and sea view' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 3500.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultPricePerNight: number;

  @ApiProperty({ example: 2, default: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
