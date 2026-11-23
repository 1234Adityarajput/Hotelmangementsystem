import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Matches,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdditionalGuestDto {
  @ApiProperty({ example: 'Pooja Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ example: 'FEMALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'Spouse' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiPropertyOptional({ example: 'AADHAAR' })
  @IsString()
  @IsOptional()
  idProofType?: string;

  @ApiPropertyOptional({ example: '9876-5432-1098' })
  @IsString()
  @IsOptional()
  idProofNumber?: string;

  @ApiPropertyOptional({ example: 'docs/companions/doc-pooja.pdf' })
  @IsString()
  @IsOptional()
  documentFileReference?: string;
}

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

  @ApiPropertyOptional({ example: '42 Marine Lines, Fort' })
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

  // 5. ID Proof Type
  @ApiPropertyOptional({ example: 'AADHAAR', enum: ['AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'PAN_CARD', 'OTHER'] })
  @IsString()
  @IsOptional()
  idProofType?: string;

  // 6. ID Proof Number
  @ApiPropertyOptional({ example: '1234-5678-9012' })
  @IsString()
  @IsOptional()
  idProofNumber?: string;

  // 7. ID Proof Document
  @ApiPropertyOptional({ example: 'docs/guests/rohan_aadhaar.pdf' })
  @IsString()
  @IsOptional()
  idProofDocument?: string;

  // 8. Number of Guests
  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  numberOfGuests?: number;

  // 9. Additional Guest Information (Co-guests / companions)
  @ApiPropertyOptional({ type: () => [AdditionalGuestDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdditionalGuestDto)
  additionalGuests?: AdditionalGuestDto[];
}
