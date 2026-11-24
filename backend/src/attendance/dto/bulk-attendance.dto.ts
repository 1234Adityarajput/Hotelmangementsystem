import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkMarkAttendanceDto {
  @ApiProperty({ example: '2026-11-24', description: 'Attendance date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty({ message: 'Attendance date is required' })
  attendanceDate: string;

  @ApiProperty({
    enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'],
    example: 'PRESENT',
    description: 'Attendance status for all selected staff',
  })
  @IsEnum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF'], {
    message: 'Invalid attendance status',
  })
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional staff IDs list. If omitted or empty, applies to all active staff in specified department',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];

  @ApiPropertyOptional({ example: 'ALL', description: 'Department filter if staffIds not provided' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '09:00 AM', description: 'Standard check-in time' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '06:00 PM', description: 'Standard check-out time' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 'Bulk marked by Front Desk / Admin', description: 'Notes or remarks' })
  @IsOptional()
  @IsString()
  notes?: string;
}
