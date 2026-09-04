import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Amina Hassan' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Hassan Retail Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiProperty({ example: 'amina@hassanretail.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Internal notes, never shown to the client.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
