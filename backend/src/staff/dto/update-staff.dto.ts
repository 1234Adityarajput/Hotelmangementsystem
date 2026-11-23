import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED'],
    example: 'ACTIVE',
    description: 'Current employment status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED'], {
    message: 'Invalid employment status',
  })
  employmentStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'RESIGNED';
}
