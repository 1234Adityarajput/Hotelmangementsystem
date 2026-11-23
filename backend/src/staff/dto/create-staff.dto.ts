import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Employee full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: '+91 9876543210', description: 'Primary mobile number' })
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @ApiPropertyOptional({ example: '+91 9876543211', description: 'Alternate contact' })
  @IsOptional()
  @IsString()
  alternateMobileNumber?: string;

  @ApiPropertyOptional({ example: 'rahul.staff@hotel.com', description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Flat 402, Civil Lines, City', description: 'Residential address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '1992-05-15', description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Sunita Sharma (+91 9123456789)', description: 'Emergency contact' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ example: 'Front Desk Executive', description: 'Job designation' })
  @IsString()
  @IsNotEmpty({ message: 'Designation is required' })
  designation: string;

  @ApiProperty({ example: 'Front Office', description: 'Department (Front Office, Housekeeping, Maintenance, F&B, Security)' })
  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @ApiProperty({ example: '2026-01-01', description: 'Joining date' })
  @IsString()
  @IsNotEmpty({ message: 'Joining date is required' })
  joiningDate: string;

  @ApiProperty({ example: 25000.00, description: 'Monthly basic salary in INR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Monthly salary must be non-negative' })
  monthlySalary: number;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  bankAccountHolder?: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234', description: 'Bank IFSC code' })
  @IsOptional()
  @IsString()
  bankIfscCode?: string;

  @ApiPropertyOptional({ example: 'Verified police verification completed', description: 'Internal remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
