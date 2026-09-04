import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ProjectHealth, ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'E-Commerce Mobile Application' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Estimated duration in days. Required if estimatedCompletionDate is omitted.',
  })
  @ValidateIf((o) => !o.estimatedCompletionDate)
  @IsInt()
  @IsPositive()
  estimatedDurationDays?: number;

  @ApiPropertyOptional({
    description: 'Estimated completion date. Required if estimatedDurationDays is omitted.',
    example: '2026-10-01',
  })
  @ValidateIf((o) => !o.estimatedDurationDays)
  @IsDateString()
  estimatedCompletionDate?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth, default: ProjectHealth.ON_TRACK })
  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;
}
