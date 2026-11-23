import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: 'uuid-of-room-type' })
  @IsString()
  @IsNotEmpty()
  roomTypeId: string;

  @ApiPropertyOptional({ example: 'Corner room with extra lighting' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  floor: number;

  @ApiProperty({ example: 2500.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiPropertyOptional({ enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' })
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'])
  @IsOptional()
  roomStatus?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
