import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RelocateRoomDto {
  @ApiProperty({ example: 'uuid-of-new-room' })
  @IsString()
  @IsNotEmpty()
  newRoomId: string;

  @ApiPropertyOptional({ example: 'AC issue in previous room' })
  @IsString()
  @IsOptional()
  reason?: string;
}
