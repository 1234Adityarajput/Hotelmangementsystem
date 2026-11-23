import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestDto {
  @ApiProperty({ example: 'Rohan Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, { message: 'Invalid mobile number format' })
  mobileNumber: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsString()
  @IsOptional()
  alternateMobileNumber?: string;

  @ApiPropertyOptional({ example: 'rohan.sharma@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '42 Marine Lines' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '400020' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  @IsOptional()
  gender?: string;
}
