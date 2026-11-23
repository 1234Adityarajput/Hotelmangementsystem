import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@hotel.com', description: 'Admin email address or username' })
  @IsString()
  @IsNotEmpty({ message: 'Email or username is required' })
  email: string;

  @ApiProperty({ example: 'AdminSecurePass123!', description: 'Admin account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
