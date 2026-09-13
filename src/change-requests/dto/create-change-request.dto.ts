import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Min, MaxLength } from 'class-validator';

export class CreateChangeRequestDto {
  @ApiProperty({ example: 'Add Google Sign-In' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiPropertyOptional({ description: 'Why this change is needed.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  requestedBy?: string;

  @ApiProperty({ description: 'Estimated additional days this change will add if approved. Must be at least 1.' })
  @IsInt()
  @Min(1)
  estimatedAdditionalDays: number;

  @ApiPropertyOptional({ description: 'Estimated additional hours of work.' })
  @IsOptional()
  @IsPositive()
  estimatedAdditionalHours?: number;
}
