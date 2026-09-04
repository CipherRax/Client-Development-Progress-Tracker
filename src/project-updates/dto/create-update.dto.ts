import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UpdateVisibility } from '@prisma/client';

export class CreateProjectUpdateDto {
  @ApiProperty({ example: 'Payment integration underway' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'We have started integrating M-Pesa payment processing.' })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: UpdateVisibility, default: UpdateVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(UpdateVisibility)
  visibility?: UpdateVisibility;
}
