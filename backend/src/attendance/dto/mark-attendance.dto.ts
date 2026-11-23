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

export class MarkAttendanceDto {
  @ApiProperty({ example: 'staff-uuid-1234', description: 'Staff member UUID' })
  @IsString()
  @IsNotEmpty({ message: 'Staff ID is required' })
  staffId: string;

  @ApiProperty({ example: '2026-11-23', description: 'Attendance date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Attendance date is required' })
  attendanceDate: string;

  @ApiProperty({
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'],
    example: 'PRESENT',
    description: 'Attendance status',
  })
  @IsEnum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'], {
    message: 'Invalid attendance status',
  })
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';

  @ApiPropertyOptional({ example: '09:00 AM', description: 'Check in time' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '06:00 PM', description: 'Check out time' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 8.5, description: 'Total working hours' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  workingHours?: number;

  @ApiPropertyOptional({ example: 0.5, description: 'Overtime hours beyond standard shift' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeHours?: number = 0;

  @ApiPropertyOptional({ example: 'Approved medical leave', description: 'Remarks or reason' })
  @IsOptional()
  @IsString()
  notes?: string;
}
