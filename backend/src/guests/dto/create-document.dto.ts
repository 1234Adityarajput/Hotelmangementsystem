import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGuestDocumentDto {
  @ApiProperty({ example: 'AADHAAR', description: 'Type of identity document e.g. AADHAAR, PASSPORT, DRIVING_LICENSE' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: '1234-5678-9012' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'docs/guests/doc-1234.pdf', description: 'Safe internal storage path or reference' })
  @IsString()
  @IsNotEmpty()
  documentFileReference: string;
}
