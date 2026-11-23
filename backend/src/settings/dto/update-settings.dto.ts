import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHotelSettingDto {
  @ApiPropertyOptional({ example: 'Grand Horizon Hotel & Suites' })
  @IsOptional()
  @IsString()
  hotelName?: string;

  @ApiPropertyOptional({ example: '100 Beach Road, Civil Lines' })
  @IsOptional()
  @IsString()
  hotelAddress?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'concierge@grandhorizon.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: '12:00 PM' })
  @IsOptional()
  @IsString()
  defaultCheckInTime?: string;

  @ApiPropertyOptional({ example: '11:00 AM' })
  @IsOptional()
  @IsString()
  defaultCheckOutTime?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({ example: 12.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  defaultTaxPercentage?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(31)
  defaultSalaryDays?: number;
}
