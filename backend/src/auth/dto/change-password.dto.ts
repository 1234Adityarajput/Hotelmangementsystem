import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'admin', description: 'Admin username or email' })
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  username: string;

  @ApiProperty({ example: 'Admin@Hotel2026!', description: 'Current admin password' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({ example: 'NewSecretPass2026!', description: 'New account password' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
